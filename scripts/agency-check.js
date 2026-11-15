import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

function choosePile(sim, target) {
  const cells = new Map();
  for (const grain of sim.grains) {
    if (!grain.bond || grain.y < 85 || grain.y > 169) continue;
    const key = `${Math.floor(grain.x / 10)},${Math.floor(grain.y / 10)}`;
    const cell = cells.get(key) ?? { x: 0, y: 0, count: 0 };
    cell.x += grain.x;
    cell.y += grain.y;
    cell.count++;
    cells.set(key, cell);
  }
  return [...cells.values()]
    .map((cell) => ({
      x: cell.x / cell.count,
      y: cell.y / cell.count,
      count: cell.count,
    }))
    .sort(
      (a, b) =>
        b.count +
        b.y * 0.03 -
        Math.abs(b.x - target) * 0.06 -
        (a.count + a.y * 0.03 - Math.abs(a.x - target) * 0.06),
    )[0];
}

function sweep(sim, a, b) {
  let released = 0;
  const moved = new Set();
  function edit(from, to, start) {
    const before = new Map(sim.grains.map((g) => [g.id, { x: g.x, y: g.y }]));
    released += sim.brush(from, to, { start, pointerId: 1 });
    for (const grain of sim.grains) {
      const previous = before.get(grain.id);
      if (
        previous &&
        Math.hypot(grain.x - previous.x, grain.y - previous.y) > 0.01
      )
        moved.add(grain.id);
    }
  }
  edit(a, a, true);
  let previous = a;
  for (let i = 1; i <= 24; i++) {
    const point = {
      x: a.x + ((b.x - a.x) * i) / 24,
      y: a.y + ((b.y - a.y) * i) / 24,
    };
    edit(previous, point, false);
    sim.step();
    sim.step();
    previous = point;
  }
  released += sim.endBrush?.(1) ?? 0;
  return { released, moved: moved.size };
}

export function session(Simulation, seed, active, options = {}) {
  const sim = new Simulation({ seed, ...options });
  const gestures = [];
  let next = 10;
  while (sim.time < 60) {
    if (active && sim.time >= next && sim.time < 55) {
      const target = sim.left / 3 < sim.right / 5 ? 42.5 : 117.5;
      const pile = choosePile(sim, target);
      if (pile) {
        const time = sim.time;
        gestures.push({
          time,
          from: pile,
          target,
          ...sweep(sim, pile, { x: target, y: 174 }),
        });
      }
      next = sim.time + 4;
    }
    sim.step();
  }
  return {
    seed,
    active,
    gestures,
    emitted: sim.emitted,
    left: sim.left,
    right: sim.right,
    collected: sim.left + sim.right,
    attached: sim.attachedCount,
    retained: sim.grains.length,
    accounted: sim.left + sim.right + sim.grains.length,
  };
}

if (process.argv[1]?.endsWith('agency-check.js')) {
  const root = process.argv[2] ?? '.';
  const { Simulation } = await import(
    pathToFileURL(resolve(root, 'src/simulation/simulation.js'))
  );
  const options = JSON.parse(process.argv[4] ?? '{}');
  const results = [48, 2026, 914].map((seed) => ({
    idle: session(Simulation, seed, false, options),
    active: session(Simulation, seed, true, options),
  }));
  await writeFile(
    process.argv[3],
    JSON.stringify(
      {
        root,
        options,
        configuration: new Simulation(options).config,
        note: 'A material-seeking scripted policy; not a human skill, fun or retention study.',
        results,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    JSON.stringify(
      results.map(({ idle, active }) => ({
        seed: idle.seed,
        idleCollected: idle.collected,
        activeCollected: active.collected,
        additionalCollected: active.collected - idle.collected,
        gestures: active.gestures.length,
        materialResponses: active.gestures.filter((g) => g.moved > 0).length,
      })),
    ),
  );
}
