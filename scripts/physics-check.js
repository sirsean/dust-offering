import { Simulation } from '../src/simulation/simulation.js';
import { adhesionScene as scene } from '../src/config/adhesion-scene.js';

export function measureSand(seed) {
  const sim = new Simulation({ seed });
  const control = new Simulation({ seed });
  for (let i = 0; i < scene.gatherSteps; i++) {
    sim.step();
    control.step();
  }
  const before = {
    attached: sim.attachedCount,
    stone: sim.grains.filter((g) => g.bond === 'stone').length,
    sand: sim.grains.filter((g) => g.bond === 'sand').length,
    retained: sim.grains.length,
    ground: sim.spill,
  };
  const released = sim.brush(scene.brushStart, scene.brushEnd);
  const after = { attached: sim.attachedCount, retained: sim.grains.length };
  for (let i = 0; i < scene.flowSteps; i++) {
    sim.step();
    control.step();
  }
  sim.pouring = false;
  control.pouring = false;
  for (let i = 0; i < scene.settleSteps; i++) {
    sim.step();
    control.step();
  }
  return {
    seed,
    secondsBeforeBrush: scene.gatherSteps / 60,
    before,
    released,
    after,
    settled: {
      attached: sim.attachedCount,
      retained: sim.grains.length,
      ground: sim.spill,
      visibleGroundGrains: sim.grains.filter((g) => g.missed && g.y > 190)
        .length,
      left: sim.left,
      right: sim.right,
    },
    unbrushedControl: {
      left: control.left,
      right: control.right,
      ground: control.spill,
      attached: control.attachedCount,
      emitted: control.emitted,
    },
    emitted: sim.emitted,
    accounted: sim.left + sim.right + sim.grains.length,
  };
}
if (process.argv[1]?.endsWith('physics-check.js'))
  for (const seed of scene.seeds)
    console.log(JSON.stringify(measureSand(seed)));
