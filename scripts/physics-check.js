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
export function measureGuidance(passes, reverse = false, mirror = false) {
  const sim = new Simulation({
    sourceRate: 0,
    stoneAdhesionRate: 0,
    sandAdhesionRate: 0,
  });
  const a = { x: mirror ? 95 : 65, y: 70 },
    b = { x: mirror ? 55 : 105, y: 150 };
  for (let i = 0; i < passes; i++) sim.brush(reverse ? b : a, reverse ? a : b);
  const grain = sim.addGrain(mirror ? 90 : 70, 80, 0, 12);
  sim.emitted++;
  for (let i = 0; i < 240; i++) sim.step();
  return {
    kind: 'guidance',
    passes,
    reverse,
    mirror,
    seconds: 4,
    x: grain.x,
    y: grain.y,
    vx: grain.vx,
    vy: grain.vy,
    bond: grain.bond,
    accounted: sim.left + sim.right + sim.grains.length,
  };
}

export function measureInlet(seed) {
  const sim = new Simulation({ seed });
  const measurements = [];
  let minimumRate = Infinity,
    maximumRate = 0,
    blockedSteps = 0,
    maxAboveY36 = 0;
  for (let i = 0; i < 7200; i++) {
    minimumRate = Math.min(minimumRate, sim.sourceRate);
    maximumRate = Math.max(maximumRate, sim.sourceRate);
    sim.step();
    if (sim.blocked) blockedSteps++;
    if (i % 60 === 59)
      maxAboveY36 = Math.max(
        maxAboveY36,
        sim.grains.filter((g) => g.y < 36).length,
      );
    if (i === 3599 || i === 7199)
      measurements.push({
        kind: 'inlet',
        seed,
        seconds: sim.time,
        sourceX: sim.sourceX,
        sourceTime: sim.sourceTime,
        sourceRate: sim.sourceRate,
        minimumRate,
        maximumRate,
        blockedSteps,
        maxAboveY36,
        aboveBoard: sim.grains.filter((g) => g.y < 0).length,
        emitted: sim.emitted,
        aboveY36: sim.grains.filter((g) => g.y < 36).length,
        aboveY60: sim.grains.filter((g) => g.y < 60).length,
        upperBonds: sim.grains.filter((g) => g.y < 60 && g.bond).length,
        attached: sim.attachedCount,
        left: sim.left,
        right: sim.right,
        spill: sim.spill,
        accounted: sim.left + sim.right + sim.grains.length,
      });
  }
  return measurements;
}

if (process.argv[1]?.endsWith('physics-check.js')) {
  for (const seed of scene.seeds)
    console.log(JSON.stringify({ kind: 'adhesion', ...measureSand(seed) }));
  for (const passes of [0, 1, 3, 6])
    console.log(JSON.stringify(measureGuidance(passes)));
  console.log(JSON.stringify(measureGuidance(3, true)));
  console.log(JSON.stringify(measureGuidance(3, false, true)));
  for (const seed of scene.seeds)
    for (const sample of measureInlet(seed))
      console.log(JSON.stringify(sample));
}
