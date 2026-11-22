import { seededRandom } from '../simulation/random.js';

const turn = Math.PI * 2;
const marksByTarget = new WeakMap();

function ringMarks(target, seed) {
  const cached = marksByTarget.get(target);
  if (cached?.seed === seed) return cached.marks;

  const { x, y, radius } = target;
  const random = seededRandom(seed ^ Math.imul(x, 8191) ^ Math.imul(y, 4093));
  const phase = random() * turn;
  const point = (angle, offset = 0) => {
    const uneven =
      0.65 * Math.sin(angle * 3 + phase) +
      0.4 * Math.cos(angle * 7 - phase) +
      (random() - 0.5) * 0.6;
    const r = radius + uneven + offset;
    return [x + Math.cos(angle) * r, y + Math.sin(angle) * r];
  };

  const count = 14 + Math.floor(random() * 5);
  const marks = Array.from({ length: count }, (_, index) => {
    const start = (index + random() * 0.34) / count;
    const end = (index + 0.51 + random() * 0.46) / count;
    const angle = ((start + end) / 2) * turn - Math.PI / 2;
    const path = new Path2D();
    for (let step = 0; step <= 5; step++) {
      const at = (start + ((end - start) * step) / 5) * turn - Math.PI / 2;
      const [px, py] = point(at);
      if (step === 0) path.moveTo(px, py);
      else path.lineTo(px, py);
    }
    const tick = new Path2D();
    tick.moveTo(...point(angle, 1.9));
    tick.lineTo(...point(angle + 0.018, 3.2));
    return {
      path,
      tick,
      at: (start + end) / 2,
      opacity: 0.22 + random() * 0.13,
    };
  });
  marksByTarget.set(target, { seed, marks });
  return marks;
}

export function drawPileRings(ctx, palette, targets, counts, seed) {
  ctx.setLineDash([]);
  ctx.lineCap = 'round';
  targets.forEach((target, index) => {
    const count = counts[index];
    const fill = Math.min(1, count / target.required);
    const overfilled = count > target.capacity;
    const marks = ringMarks(target, seed);
    marks.forEach(({ path, tick, at, opacity }, markIndex) => {
      const filled = at <= fill;
      ctx.strokeStyle = overfilled
        ? palette.pileOverflow
        : filled
          ? palette.sandLight
          : palette.mark;
      ctx.globalAlpha = opacity + (filled ? 0.23 : 0);
      ctx.lineWidth = filled ? 0.54 : 0.38;
      ctx.stroke(path);
      if (overfilled && markIndex % 3 === 0) {
        ctx.globalAlpha = 0.78;
        ctx.lineWidth = 0.68;
        ctx.stroke(tick);
      }
    });
  });
}
