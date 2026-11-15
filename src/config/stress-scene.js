import { editableStone } from '../simulation/geometry.js';

// A deliberately full stone face. Frozen grains still count toward the cap
// and remain rendered; brushing releases real material from this fixture.
export function fillStressScene(sim, count = sim.config.freePourCap) {
  const scale = Math.sqrt(count / 6000);
  const spacing = 1.3 / scale;
  for (
    let row = 0;
    sim.grains.length < count && row < Math.ceil(110 * scale);
    row++
  ) {
    const y = 27 + (row * spacing * Math.sqrt(3)) / 2;
    for (
      let column = 0;
      column < Math.ceil(119 * scale) && sim.grains.length < count;
      column++
    ) {
      const x = 3 + column * spacing + ((row % 2) * spacing) / 2;
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
