import assert from 'node:assert/strict';
import test from 'node:test';
import { prototype as config } from '../src/config/prototype.js';

test('the starting configuration respects the collision travel bound', () => {
  const substepTravel =
    config.maxSpeed / config.stepsPerSecond / config.collisionSubsteps;
  assert.ok(substepTravel <= config.grainRadius);
});

test('challenge supply and integer targets preserve the planned 3:5 measure', () => {
  assert.equal(
    config.startingSupply,
    config.sourceRate * config.activePourSeconds,
  );
  assert.equal(config.leftTarget + config.rightTarget, config.startingSupply);
  assert.equal(config.leftTarget, (config.startingSupply * 3) / 8);
  assert.equal(config.rightTarget, (config.startingSupply * 5) / 8);
});
