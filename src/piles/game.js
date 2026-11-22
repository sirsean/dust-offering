import { piles } from '../config/piles.js';
import { UpwellingSimulation } from '../lab/simulation.js';
import { insideStone } from '../simulation/geometry.js';

export function measurePiles(grains, targets) {
  const counts = targets.map(() => 0);
  for (const grain of grains) {
    if (!insideStone(grain.x, grain.y)) continue;
    const index = targets.findIndex(
      ({ x, y, radius }) =>
        (grain.x - x) ** 2 + (grain.y - y) ** 2 <= radius ** 2,
    );
    if (index >= 0) counts[index]++;
  }
  return counts;
}

export class PileGame {
  constructor(level) {
    this.level = level;
    const supply = level.wells.reduce((sum, well) => sum + well.grains, 0);
    this.sim = new UpwellingSimulation({
      id: piles.id,
      seed: level.seed,
      wells: level.wells,
      supply,
      forwardBrush: piles.forwardBrush,
    });
    const share = supply / level.targets.length;
    this.targets = level.targets.map((target) => ({
      ...target,
      required: Math.ceil(share * level.fill),
      capacity: Math.floor(share * (2 - level.fill)),
    }));
    this.guide = { type: 'piles', targets: this.targets };
    this.complete = false;
    this.readySince = null;
    this.counts = this.targets.map(() => 0);
    for (
      let i = 0;
      i < piles.preparationSeconds * this.sim.config.stepsPerSecond;
      i++
    ) {
      this.sim.step();
    }
    this.checkArrangement();
  }

  brush(a, b, stroke) {
    this.readySince = null;
    this.sim.brush(a, b, stroke);
  }

  step() {
    this.sim.step();
    // Keep feedback current without inspecting every particle on every frame.
    if (this.sim.steps % 6 === 0) this.checkArrangement();
  }

  checkArrangement() {
    this.counts = measurePiles(this.sim.grains, this.targets);
    const ready = this.targets.every(
      ({ required, capacity }, index) =>
        this.counts[index] >= required && this.counts[index] <= capacity,
    );
    if (this.complete) return;
    if (this.sim.remaining || this.sim.brushStrokes.size || !ready) {
      this.readySince = null;
      return;
    }
    this.readySince ??= this.sim.steps;
    if (
      this.sim.steps - this.readySince >=
      piles.holdSeconds * this.sim.config.stepsPerSecond
    ) {
      this.complete = true;
    }
  }
}
