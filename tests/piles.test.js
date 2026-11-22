import assert from 'node:assert/strict';
import test from 'node:test';
import { pileLevels } from '../src/config/piles.js';
import { performStroke } from '../src/lab/policy.js';
import { PileGame, measurePiles } from '../src/piles/game.js';
import { insideStone } from '../src/simulation/geometry.js';
import { pileStrokes } from './fixtures/piles.js';

test('each authored ring fits the stone, spaces between rings are clear, and the well supply can fill them', () => {
  for (const level of pileLevels) {
    const { sim, targets } = new PileGame(level);
    for (const [index, target] of targets.entries()) {
      for (let step = 0; step < 64; step++) {
        const angle = (step / 64) * Math.PI * 2;
        assert.ok(
          insideStone(
            target.x + target.radius * Math.cos(angle),
            target.y + target.radius * Math.sin(angle),
          ),
          level.id,
        );
      }
      for (const other of targets.slice(index + 1)) {
        assert.ok(
          Math.hypot(target.x - other.x, target.y - other.y) >
            target.radius + other.radius,
          level.id,
        );
      }
      for (const well of level.wells) {
        assert.ok(
          Math.hypot(target.x - well.x, target.y - well.y) >= 36,
          level.id,
        );
      }
    }
    assert.ok(
      targets.reduce((sum, target) => sum + target.required, 0) <=
        sim.config.supply,
      level.id,
    );
  }
});

test('each ring needs its own dust, and completion waits for the supply and a stable arrangement', () => {
  const game = new PileGame(pileLevels[2]);
  const [left, right, third] = game.targets;
  assert.deepEqual(
    measurePiles(
      [
        { x: left.x, y: left.y },
        { x: 80, y: 190 },
      ],
      game.targets,
    ),
    [1, 0, 0],
  );
  const leftPile = Array.from(
    { length: left.required + right.required },
    () => left,
  );
  assert.deepEqual(measurePiles(leftPile, game.targets), [
    leftPile.length,
    0,
    0,
  ]);
  game.sim.grains = [
    ...Array.from({ length: left.required }, () => left),
    ...Array.from({ length: right.required }, () => right),
    ...Array.from({ length: third.required }, () => third),
  ];
  game.checkArrangement();
  assert.equal(game.readySince, null);
  game.sim.remaining = 0;
  game.sim.brushStrokes.set(1, {});
  game.checkArrangement();
  assert.equal(game.readySince, null);
  game.sim.brushStrokes.clear();
  game.sim.grains.push(
    ...Array.from({ length: left.capacity - left.required + 1 }, () => left),
  );
  game.checkArrangement();
  assert.equal(
    game.readySince,
    null,
    'An overfilled ring blocks completion even when the others are ready',
  );
  game.sim.grains.pop();
  game.checkArrangement();
  const readySince = game.readySince;
  assert.notEqual(readySince, null);
  game.sim.steps = readySince + 23;
  game.checkArrangement();
  assert.equal(game.complete, false);
  game.sim.steps++;
  game.checkArrangement();
  assert.equal(game.complete, true);
});

test('the old long sweeps finish with full carry while the new brush leaves dust to recover', () => {
  for (const level of pileLevels) {
    for (const fullCarry of [true, false]) {
      const game = new PileGame(level);
      const { sim } = game;
      if (fullCarry) sim.config.brushCarry = 1;
      for (let step = 0; step < 1800; step++) game.step();
      assert.equal(sim.remaining, 0, level.id);
      assert.equal(sim.activeWell, level.wells.at(-1), level.id);
      assert.equal(game.complete, false, `${level.id} must require a stroke`);
      for (const stroke of pileStrokes(level)) {
        performStroke(sim, stroke);
        for (let step = 0; step < 120; step++) game.step();
      }
      assert.equal(
        game.complete,
        fullCarry,
        `${level.id}: ${game.counts.join(', ')}`,
      );
      assert.ok(
        game.counts.some((count) => count > 0),
        level.id,
      );
      assert.equal(sim.grains.length, sim.config.supply, level.id);
      assert.equal(sim.emitted, sim.grains.length, level.id);
    }
  }
});

test('excess dust stays recoverable and can be swept into another ring', () => {
  const level = pileLevels[3];
  const game = new PileGame(level);
  const [upper, right] = game.targets;
  for (let step = 0; step < 1500; step++) game.step();
  performStroke(game.sim, {
    a: { x: 56.012, y: 122.655 },
    b: { x: 78.937, y: 67.381 },
  });
  for (let step = 0; step < 100; step++) game.step();
  assert.ok(game.counts[0] > upper.capacity);
  assert.equal(game.complete, false);
  performStroke(game.sim, {
    a: { x: 63.071, y: 68.612 },
    b: { x: 116.587, y: 136.408 },
  });
  for (let step = 0; step < 100; step++) game.step();
  assert.ok(game.counts[0] <= upper.capacity);
  assert.ok(game.counts[1] >= right.required);
  assert.equal(game.sim.grains.length, game.sim.config.supply);
});
