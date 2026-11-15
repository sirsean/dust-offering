import { prototype } from './prototype.js';

// Version this identifier if the published physics, layout, supply or scoring
// conditions change. Both shared links and best scores are scoped to this id.
export const challenge = Object.freeze({
  ...prototype,
  id: prototype.challengeId,
  seed: 48,
  supply: prototype.startingSupply,
});
