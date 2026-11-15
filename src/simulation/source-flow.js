// Random access noise keeps the pour independent of particle RNG and rendering.
// Sampling in a pause or debug view cannot alter the later emission sequence.
function valueAt(seed, index, channel) {
  let value = seed ^ Math.imul(index + 1, 0x9e3779b1) ^ channel;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function smooth(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

function noise(seed, time, channel) {
  const index = Math.floor(time);
  const from = valueAt(seed, index, channel);
  const to = valueAt(seed, index + 1, channel);
  return from + (to - from) * smooth(time - index);
}

export function sourceFlow(config, time) {
  const c = config;
  if (!c.sourceRate || !c.sourceFlowVariation) return c.sourceRate;
  const swell =
    1 +
    c.sourceFlowVariation *
      (2 * noise(c.seed, time / c.sourceFlowSeconds, 0x632be5ab) - 1);
  const ripple =
    1 +
    c.sourceFlowVariation *
      0.2 *
      (2 * noise(c.seed, time / c.sourceRippleSeconds, 0x85157af5) - 1);

  // One short cluster at a different offset in each window. Its uneven gaps
  // interrupt the slow swell without building any backlog to release later.
  const window = Math.floor(time / c.sourceSputterInterval);
  const start =
    window * c.sourceSputterInterval +
    2 +
    valueAt(c.seed, window, 0x58f38ded) *
      (c.sourceSputterInterval - c.sourceSputterSeconds - 2);
  const elapsed = time - start;
  let gate = 1;
  if (elapsed >= 0 && elapsed < c.sourceSputterSeconds) {
    const pulses = 3 + Math.floor(valueAt(c.seed, window, 0x94d049bb) * 2);
    const phase = (elapsed / c.sourceSputterSeconds) * pulses;
    const pulse = Math.floor(phase);
    const position = phase - pulse;
    const gap = 0.45 + valueAt(c.seed, window * 4 + pulse, 0x369dea0f) * 0.3;
    gate = smooth((position - gap) / 0.08) * smooth((1 - position) / 0.06);
  }
  return c.sourceRate * swell * ripple * gate;
}
