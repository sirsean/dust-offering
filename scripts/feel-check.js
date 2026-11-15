import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export function sweepFixture(Simulation, options = {}) {
  const sim = new Simulation({ sourceRate: 0, ...options });
  for (let row = 0; row < 9; row++)
    for (let column = 0; column < 17; column++) {
      const grain = sim.addGrain(68 + column * 1.45, 140 + row * 1.45);
      sim.anchor(grain, 'stone');
      sim.emitted++;
    }
  return sim;
}

export function stroke(sim, a, b, segments = 24, pointerId = 1) {
  sim.brush(a, a, { start: true, pointerId });
  let previous = a;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const next = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    sim.brush(previous, next, { start: false, pointerId });
    previous = next;
  }
  sim.endBrush?.(pointerId);
}

export function measureSweep(Simulation, direction, segments = 24, options) {
  const sim = sweepFixture(Simulation, options);
  const before = new Map(sim.grains.map((g) => [g.id, { x: g.x, y: g.y }]));
  if (direction !== 'idle')
    stroke(
      sim,
      { x: 80, y: 145 },
      { x: direction === 'left' ? 45 : 115, y: 170 },
      segments,
    );
  const released = sim.grains.filter((g) => !g.bond);
  const immediately = {
    moved: sim.grains.filter(
      (g) =>
        Math.hypot(g.x - before.get(g.id).x, g.y - before.get(g.id).y) > 0.5,
    ).length,
    released: released.length,
    meanX: released.length
      ? released.reduce((sum, g) => sum + g.x, 0) / released.length
      : null,
    meanVX: released.length
      ? released.reduce((sum, g) => sum + g.vx, 0) / released.length
      : null,
    snapshot: sim.snapshot(),
  };
  for (let i = 0; i < 8 * 60; i++) sim.step();
  return {
    direction,
    segments,
    immediately,
    afterEightSeconds: {
      left: sim.left,
      right: sim.right,
      retained: sim.grains.length,
      attached: sim.attachedCount,
      accounted: sim.left + sim.right + sim.grains.length,
    },
  };
}

export function measureReadiness(Simulation, options = {}) {
  const sim = new Simulation(options);
  const samples = [];
  for (let i = 1; i <= 60 * 60; i++) {
    sim.step();
    if ([3, 10, 20, 40, 60].includes(i / 60))
      samples.push({
        seconds: sim.time,
        emitted: sim.emitted,
        attached: sim.attachedCount,
        centralTouchable: sim.grains.filter(
          (g) => !g.missed && g.y > 65 && g.y < 155 && Math.abs(g.x - 80) < 25,
        ).length,
        revealEquivalent: [...sim.discovery.active].reduce(
          (sum, index) => sum + sim.discovery.levels[index],
          0,
        ),
        left: sim.left,
        right: sim.right,
      });
  }
  return samples;
}

export async function review(root = '.', options = {}) {
  const { Simulation } = await import(
    pathToFileURL(resolve(root, 'src/simulation/simulation.js'))
  );
  const sparse = measureSweep(Simulation, 'left', 1, options);
  const dense = measureSweep(Simulation, 'left', 40, options);
  const samplingDifference =
    sparse.immediately.snapshot.reduce((sum, g, i) => {
      const other = dense.immediately.snapshot[i];
      return sum + Math.hypot(g.x - other.x, g.y - other.y);
    }, 0) / sparse.immediately.snapshot.length;
  return {
    date: new Date().toISOString(),
    root,
    options,
    configuration: new Simulation(options).config,
    note: 'Behavioral evidence, not a measured human fun or retention score.',
    readiness: measureReadiness(Simulation, options),
    meanSparseDensePositionDifference: samplingDifference,
    sweeps: [
      sparse,
      dense,
      measureSweep(Simulation, 'right', 40, options),
      measureSweep(Simulation, 'idle', 1, options),
    ],
  };
}

if (process.argv[1]?.endsWith('feel-check.js')) {
  const root = process.argv[2] ?? '.';
  const output = process.argv[3];
  const result = await review(root, JSON.parse(process.argv[4] ?? '{}'));
  if (output) await writeFile(output, JSON.stringify(result, null, 2) + '\n');
  console.log(
    JSON.stringify({
      readiness: result.readiness,
      samplingDifference: result.meanSparseDensePositionDifference,
      sweeps: result.sweeps.map(
        ({ direction, segments, immediately, afterEightSeconds }) => ({
          direction,
          segments,
          immediately: { ...immediately, snapshot: undefined },
          afterEightSeconds,
        }),
      ),
    }),
  );
}
