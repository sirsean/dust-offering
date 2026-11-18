import { seededRandom } from '../simulation/random.js';

// Goals can mark a real well without affecting its emissions or particle RNG.
// Every study receives exactly the same sites for a given seed.
export function createWells(config) {
  const random = seededRandom(config.seed ^ 0x27d4eb2d);
  const mirror = random() < 0.5 ? -1 : 1,
    wells = [];
  while (wells.length < Math.ceil(config.supply / config.wellBatch)) {
    const index = wells.length;
    const y = [68, 113, 148][index % 3] + random() * [24, 24, 15][index % 3];
    const half = ((y - 6) * 79) / 170;
    const side =
      index % 3 === 0 ? (random() - 0.5) * 0.9 : index % 3 === 1 ? -0.6 : 0.6;
    const point = { x: 80 + mirror * side * half, y };
    if (wells.every((p) => Math.hypot(p.x - point.x, p.y - point.y) > 22))
      wells.push(point);
  }
  return wells;
}
