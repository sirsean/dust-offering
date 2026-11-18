import { insideStone } from '../simulation/geometry.js';
import { distribution, scoreCounts, evaluateGoal } from './goals.js';

const clampPoint = (p) => ({
  x: Math.max(0, Math.min(160, p.x)),
  y: Math.max(0, Math.min(200, p.y)),
});
function cellIndex(goal, x, y) {
  if (!insideStone(x, y)) return -1;
  return (
    goal.lookup[
      Math.floor(y / goal.cellSize) * goal.columns +
        Math.floor(x / goal.cellSize)
    ] ?? -1
  );
}
function fitCounts(counts, goal, total) {
  return scoreCounts(counts, goal, total);
}
function aimed(source, target, limit = 32) {
  const distance = Math.hypot(target.x - source.x, target.y - source.y);
  if (distance < 1) return null;
  const dx = (target.x - source.x) / distance,
    dy = (target.y - source.y) / distance;
  const travel = Math.min(distance, limit);
  return {
    a: clampPoint({ x: source.x - dx * 8, y: source.y - dy * 8 }),
    b: clampPoint({
      x: source.x + dx * (travel - 7),
      y: source.y + dy * (travel - 7),
    }),
  };
}

// A one-stroke geometric predictor. It observes current sand and the visible
// target, but knows no future emissions. It never mutates the live simulation.
function predict(sim, goal, stroke, base) {
  const projected = goal.type === 'gather' || goal.type === 'clear' ? [] : null;
  const counts = base.slice();
  const { a, b } = stroke,
    length = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(1, Math.ceil(length / (sim.config.brushWidth / 6)));
  const radius = sim.config.brushWidth / 2 + sim.config.grainRadius;
  for (const g of sim.grains) {
    let x = g.x,
      y = g.y;
    for (let i = 0; i <= steps; i++) {
      const px = a.x + ((b.x - a.x) * i) / steps,
        py = a.y + ((b.y - a.y) * i) / steps;
      const dx = x - px,
        dy = y - py,
        d = Math.hypot(dx, dy);
      if (d < radius && d > 1e-8) {
        x += (dx / d) * (radius - d);
        y += (dy / d) * (radius - d);
      }
    }
    if (projected) projected.push({ x, y });
    if (x === g.x && y === g.y) continue;
    const old = cellIndex(goal, g.x, g.y),
      next = cellIndex(goal, x, y);
    if (old >= 0) counts[old]--;
    if (next >= 0) counts[next]++;
  }
  return projected
    ? evaluateGoal({ ...sim, grains: projected }, goal).fit
    : fitCounts(counts, goal, sim.emitted);
}

export function chooseStroke(sim, goal, policy, random, index = 0) {
  if (policy === 'idle' || !sim.grains.length) return null;
  if (policy === 'sweep') {
    const y = 35 + (index % 6) * 24;
    return index % 2
      ? { a: { x: 155, y }, b: { x: 5, y: y + 5 } }
      : { a: { x: 5, y }, b: { x: 155, y: y + 5 } };
  }
  if (policy === 'random') {
    const g = sim.grains[Math.floor(random() * sim.grains.length)],
      angle = random() * Math.PI * 2,
      length = 12 + random() * 20;
    return aimed(g, {
      x: g.x + Math.cos(angle) * length,
      y: g.y + Math.sin(angle) * length,
    });
  }
  const { counts } = distribution(sim, goal),
    bins = new Map();
  for (const g of sim.grains) {
    const key =
      Math.floor(g.y / goal.cellSize) * goal.columns +
      Math.floor(g.x / goal.cellSize);
    let bin = bins.get(key);
    if (!bin) {
      bin = { n: 0, x: 0, y: 0, index: cellIndex(goal, g.x, g.y) };
      bins.set(key, bin);
    }
    bin.n++;
    bin.x += g.x;
    bin.y += g.y;
  }
  const sources = [...bins.values()]
    .map((p) => ({
      x: p.x / p.n,
      y: p.y / p.n,
      invalid: p.index < 0 || goal.cells[p.index].weight === 0,
      excess:
        p.n - (p.index < 0 ? 0 : goal.cells[p.index].target * sim.emitted),
    }))
    .filter((p) => p.excess > 5 && (goal.type !== 'clear' || p.invalid))
    .sort((a, b) => b.excess - a.excess)
    .slice(0, 6);
  const targets = goal.cells
    .map((p, i) => ({ ...p, need: p.target * sim.emitted - counts[i] }))
    .filter((p) => p.need > 2);
  let best = null,
    value =
      goal.type === 'gather' || goal.type === 'clear'
        ? evaluateGoal(sim, goal).fit
        : fitCounts(counts, goal, sim.emitted);
  for (const source of sources) {
    const nearby = targets
      .toSorted(
        (a, b) =>
          b.need / (12 + Math.hypot(b.x - source.x, b.y - source.y)) -
          a.need / (12 + Math.hypot(a.x - source.x, a.y - source.y)),
      )
      .slice(0, 3);
    for (const target of nearby) {
      const stroke = aimed(source, target);
      if (!stroke) continue;
      const candidate = predict(sim, goal, stroke, counts);
      if (candidate > value + 1e-5) {
        value = candidate;
        best = stroke;
      }
    }
  }
  return best;
}

export function performStroke(sim, { a, b }, segments = 12, pointerId = 1) {
  sim.brush(a, a, { start: true, pointerId });
  let previous = a;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments,
      next = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    sim.brush(previous, next, { start: false, pointerId });
    previous = next;
  }
  sim.endBrush(pointerId);
}
