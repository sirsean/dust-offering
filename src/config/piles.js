// Positions and radii use the same logical stone coordinates as the brush.
// Supply comes from the wells. Each ring asks for an equal share by default.
export const pileLevels = [
  {
    id: 'first-pile',
    name: 'First pile',
    seed: 48,
    wells: [{ x: 72, y: 116, grains: 520 }],
    targets: [{ x: 97, y: 116, radius: 17 }],
    fill: 0.7,
  },
  {
    id: 'two-sides',
    name: 'Two sides',
    seed: 2026,
    wells: [
      { x: 65, y: 123, grains: 440 },
      { x: 94, y: 124, grains: 440 },
    ],
    targets: [
      { x: 48, y: 144, radius: 16 },
      { x: 112, y: 145, radius: 16 },
    ],
    fill: 0.7,
  },
  {
    id: 'three-islands',
    name: 'Three islands',
    seed: 914,
    wells: [
      { x: 80, y: 77, grains: 440 },
      { x: 66, y: 126, grains: 440 },
      { x: 113, y: 151, grains: 440 },
    ],
    targets: [
      { x: 83, y: 103, radius: 16 },
      { x: 47, y: 151, radius: 16 },
      { x: 91, y: 148, radius: 16 },
    ],
    fill: 0.7,
  },
  {
    id: 'four-corners',
    name: 'Four corners',
    seed: 3601,
    wells: [
      { x: 55, y: 131, grains: 880 },
      { x: 105, y: 131, grains: 880 },
    ],
    targets: [
      { x: 58, y: 108, radius: 14 },
      { x: 102, y: 108, radius: 14 },
      { x: 47, y: 155, radius: 15 },
      { x: 113, y: 155, radius: 15 },
    ],
    fill: 0.64,
  },
];

export const piles = Object.freeze({
  id: 'piles-v1',
  preparationSeconds: 4,
  holdSeconds: 0.4,
  forwardBrush: true,
});
