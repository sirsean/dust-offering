import { prototype } from './prototype.js';

// Version this identifier if the published physics, layout, supply or scoring
// conditions change. Both shared links and best scores are scoped to this id.
export const challenge = Object.freeze({
  ...prototype,
  id: prototype.challengeId,
  seed: 48,
  sourceX: 80,
  sourceY: 14,
  collectionY: 181,
  supply: prototype.startingSupply,
  startingRidges: Object.freeze([]),
});
