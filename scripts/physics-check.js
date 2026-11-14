import { Simulation } from '../src/simulation/simulation.js';
import { physicsScene as scene } from '../src/config/physics-scene.js';

export function measureSplit(width, seed, overrides = {}) {
  const sim = new Simulation({
    sourceX: scene.sourceX,
    sourceY: scene.sourceY,
    seed,
    ...overrides,
  });
  sim.ridges.add(scene.rampStart, scene.rampEnd);
  const cutY =
    scene.rampStart.y +
    (scene.cutX - scene.rampStart.x) * Math.tan(Math.PI / 9);
  sim.ridges.rub(scene.cutX, cutY, width / 2);
  const classified = new Set();
  let gap = 0;
  let end = 0;
  sim.onMove = (grain) => {
    if (classified.has(grain.id)) return;
    const below =
      (grain.y -
        scene.rampStart.y -
        (grain.x - scene.rampStart.x) * Math.tan(Math.PI / 9)) *
      Math.cos(Math.PI / 9);
    let path;
    if (grain.x > scene.rampEnd.x + 2) path = 'end';
    else if (
      below > 4 &&
      grain.x > scene.cutX - width - 5 &&
      grain.x < scene.rampEnd.x - 3
    )
      path = 'gap';
    if (path) {
      classified.add(grain.id);
      if (sim.steps >= scene.warmupSteps) {
        if (path === 'gap') gap++;
        else end++;
      }
    }
  };
  for (let i = 0; i < scene.warmupSteps + scene.sampleSteps; i++) sim.step();
  return {
    seed,
    width,
    gap,
    end,
    fraction: gap / (gap + end),
    retained: sim.grains.length,
    emitted: sim.emitted,
  };
}

if (process.argv[1]?.endsWith('physics-check.js')) {
  for (const seed of scene.seeds)
    for (const width of scene.widths)
      console.log(JSON.stringify(measureSplit(width, seed)));
}
