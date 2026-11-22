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
    }
    assert.ok(
      targets.reduce((sum, target) => sum + target.required, 0) <=
        sim.config.supply,
      level.id,
    );
  }
});

test('each ring needs its own dust, and completion waits for the supply and a stable arrangement', () => {
  const game = new PileGame(pileLevels[1]);
  const [left, right] = game.targets;
  assert.deepEqual(
    measurePiles(
      [
        { x: left.x, y: left.y },
        { x: 80, y: 190 },
      ],
      game.targets,
    ),
    [1, 0],
  );
  const leftPile = Array.from(
    { length: left.required + right.required },
    () => left,
  );
  assert.deepEqual(measurePiles(leftPile, game.targets), [leftPile.length, 0]);
  game.sim.grains = [
    ...Array.from({ length: left.required }, () => left),
    ...Array.from({ length: right.required }, () => right),
  ];
  game.checkArrangement();
  assert.equal(game.readySince, null);
  game.sim.remaining = 0;
  game.sim.brushStrokes.set(1, {});
  game.checkArrangement();
  assert.equal(game.readySince, null);
  game.sim.brushStrokes.clear();
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

test('actual brush strokes solve all four stones, including splitting two wells into four piles', () => {
  for (const level of pileLevels) {
    const game = new PileGame(level);
    const { sim } = game;
    const before = sim.emitted;
    for (let step = 0; step < 1800; step++) game.step();
    assert.ok(before > 0);
    assert.equal(sim.remaining, 0, level.id);
    assert.equal(sim.activeWell, level.wells.at(-1), level.id);
    assert.equal(game.complete, false, `${level.id} must require a stroke`);
    for (const stroke of pileStrokes(level)) {
      performStroke(sim, stroke);
      for (let step = 0; step < 120; step++) game.step();
    }
    assert.equal(game.complete, true, `${level.id}: ${game.counts.join(', ')}`);
    assert.equal(sim.grains.length, sim.config.supply, level.id);
    assert.equal(sim.emitted, sim.grains.length, level.id);
  }
});
