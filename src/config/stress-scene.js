import { editableStone } from '../simulation/geometry.js';

// A deliberately full stone face. Frozen grains still count toward the cap
// and remain rendered; brushing releases real material from this fixture.
export function fillStressScene(sim) {
  for (let row = 0; sim.grains.length < 6000 && row < 110; row++) {
    const y = 27 + (row * 1.3 * Math.sqrt(3)) / 2;
    for (let column = 0; column < 119 && sim.grains.length < 6000; column++) {
      const x = 3 + column * 1.3 + (row % 2) * 0.65;
      if (editableStone(x, y)) {
        const grain = sim.addGrain(x, y);
        sim.anchor(grain, 'stone');
        // This artificial retained-load fixture stays fixed until brushed;
        // natural inlet weathering is measured in separate flowing scenes.
        grain.bondExpires = Infinity;
      }
    }
  }
  sim.emitted = sim.grains.length;
  sim.pouring = false;
}
