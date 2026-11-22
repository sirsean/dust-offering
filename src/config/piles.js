// Positions and radii use the same logical stone coordinates as the brush.
// Supply comes from the wells and is shared equally. Fill sets the lower
// bound, with the same tolerance above a full share for the upper bound.
export const pileLevels = [
  {
    id: 'first-pile',
    name: 'First pile',
    seed: 48,
    wells: [{ x: 80, y: 74, grains: 520 }],
    targets: [{ x: 80, y: 142, radius: 17 }],
    fill: 0.7,
  },
  {
    id: 'two-sides',
    name: 'Two sides',
    seed: 2026,
    wells: [{ x: 80, y: 85, grains: 880 }],
    targets: [
      { x: 44, y: 147, radius: 16 },
      { x: 116, y: 147, radius: 16 },
    ],
    fill: 0.7,
  },
  {
    id: 'three-islands',
    name: 'Three islands',
    seed: 914,
    wells: [{ x: 80, y: 116, grains: 1320 }],
    targets: [
      { x: 80, y: 58, radius: 15 },
      { x: 34, y: 154, radius: 15 },
      { x: 126, y: 154, radius: 15 },
    ],
    fill: 0.64,
  },
  {
    id: 'four-corners',
    name: 'Four corners',
    seed: 3601,
    wells: [
      { x: 60, y: 111, grains: 880 },
      { x: 100, y: 111, grains: 880 },
    ],
    targets: [
      { x: 77, y: 59, radius: 15 },
      { x: 117, y: 145, radius: 15 },
      { x: 37, y: 150, radius: 15 },
      { x: 79, y: 158, radius: 14 },
    ],
    fill: 0.64,
  },
];

export const piles = Object.freeze({
  id: 'piles-v3',
  preparationSeconds: 4,
  holdSeconds: 0.4,
  brushCarry: 0.88,
});
