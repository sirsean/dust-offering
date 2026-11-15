import assert from 'node:assert/strict';
import test from 'node:test';
import { Game } from '../src/game/game.js';
import { Simulation } from '../src/simulation/simulation.js';
import { freePour } from '../src/config/free-pour.js';

test('Free Pour starts with real source-born sand to touch while discovery is hidden', () => {
  const game = new Game('free', { seed: 48 }),
    sim = game.sim;
  const replay = new Simulation({ seed: 48 });
  for (let i = 0; i < freePour.warmupSeconds * 60; i++) replay.step();
  assert.deepEqual(sim.snapshot(), replay.snapshot());
  assert.equal(sim.sourceTime, freePour.warmupSeconds);
  assert.equal(sim.discovery.active.size, 0);
  assert.ok(
    sim.grains.filter((g) => g.y > 65 && g.y < 155 && Math.abs(g.x - 80) < 25)
      .length > 60,
  );
  assert.equal(sim.emitted, sim.left + sim.right + sim.grains.length);
  assert.equal(sim.remaining, Infinity);
});

test('Challenge retains its empty preparation, fixed seed and complete finite supply', () => {
  const game = new Game('challenge', { seed: 123 });
  for (let i = 0; i < 600; i++) game.step();
  assert.equal(game.sim.grains.length, 0);
  assert.equal(game.sim.sourceTime, 0);
  assert.equal(game.sim.remaining, 960);
  assert.equal(game.sim.config.seed, 48);
});

test('discovering a stone supplies a quiet completion without ending Free Pour or losing material', () => {
  const game = new Game('free', { seed: 48 });
  const emitted = game.sim.emitted;
  assert.equal(game.discovery.complete, false);
  for (let pass = 0; pass < 2; pass++)
    for (let y = 10; y <= 175; y += 8) game.edit({ x: 0, y }, { x: 160, y });
  assert.equal(game.discovery.complete, true);
  assert.equal(game.phase, 'running');
  assert.equal(game.sim.emitted, emitted);
  assert.equal(
    game.sim.left + game.sim.right + game.sim.grains.length,
    emitted,
  );
  game.reset();
  assert.equal(game.discovery.coverage, 0);
  assert.equal(game.discovery.complete, false);
});

test('free runs vary by default, while an explicit seed repeats a clean prepared reset', () => {
  const varied = new Game('free', { warmupSeconds: 0 });
  const seeds = new Set();
  for (let i = 0; i < 8; i++) {
    varied.reset();
    seeds.add(varied.sim.config.seed);
  }
  assert.ok(seeds.size > 1);
  const game = new Game('free', { seed: 48 });
  const initial = game.sim.snapshot();
  game.edit(
    { x: 80, y: 80 },
    { x: 110, y: 150 },
    { pointerId: 1, start: true },
  );
  game.endBrush(1);
  for (let i = 0; i < 600; i++) game.step();
  game.reset();
  assert.deepEqual(game.sim.snapshot(), initial);
  assert.equal(game.sim.discovery.active.size, 0);
  assert.equal(game.sim.surface.active.size, 0);
  assert.equal(game.sim.brushStrokes.size, 0);
  assert.equal(game.sim.spill, 0);
});

test('ending a late brush clears Finish eligibility, and lifting after Finish cannot edit the result', () => {
  const game = new Game('challenge');
  game.begin();
  const grain = game.sim.addGrain(80, 120);
  game.sim.emitted = 1;
  game.sim.remaining = 0;
  game.sim.anchor(grain, 'stone');
  game.edit(
    { x: 80, y: 120 },
    { x: 80.5, y: 120.5 },
    { pointerId: 1, start: true },
  );
  game.canFinish = true;
  game.endBrush(1);
  assert.equal(game.canFinish, false);
  game.edit(
    { x: 80, y: 120 },
    { x: 80.5, y: 120.5 },
    { pointerId: 2, start: true },
  );
  game.canFinish = true;
  game.finish();
  const snapshot = game.sim.snapshot();
  game.endBrush(2);
  assert.deepEqual(game.sim.snapshot(), snapshot);
  assert.equal(game.sim.brushStrokes.size, 0);
});
