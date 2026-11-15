import { writeFile } from 'node:fs/promises';
import { Game } from '../src/game/game.js';

const results = [];
for (const seed of [48, 2026, 914]) {
  const idle = new Game('free', { seed }),
    active = new Game('free', { seed });
  const start = active.sim.time;
  let foundAt = null,
    strokes = 0;
  for (let row = 0; row < 21; row++) {
    const y = 14 + row * 8;
    const half = ((y - 6) * 79) / 170;
    const a = { x: 80 - half, y },
      b = { x: 80 + half, y };
    active.edit(a, a, { pointerId: 1, start: true });
    let previous = a;
    for (let i = 1; i <= 24; i++) {
      const next = { x: a.x + ((b.x - a.x) * i) / 24, y };
      active.edit(previous, next, { pointerId: 1, start: false });
      active.step();
      active.step();
      idle.step();
      idle.step();
      previous = next;
    }
    active.endBrush(1);
    strokes++;
    if (foundAt === null && active.discovery.complete)
      foundAt = active.sim.time - start;
    for (let i = 0; i < 72; i++) {
      active.step();
      idle.step();
    }
  }
  results.push({
    seed,
    strokes,
    wallSimulationSeconds: active.sim.time - start,
    foundAtSeconds: foundAt,
    activeCoverage: active.discovery.coverage,
    idleCoverage: idle.discovery.coverage,
    emitted: active.sim.emitted,
    accounted: active.sim.left + active.sim.right + active.sim.grains.length,
  });
}
await writeFile(
  'artifacts/gameplay-review/discovery-goal.json',
  JSON.stringify(
    {
      note: 'Reachability and player authorship of an explicit uncovering goal; no human engagement claim.',
      results,
    },
    null,
    2,
  ) + '\n',
);
console.log(JSON.stringify(results));
