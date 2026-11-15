import assert from 'node:assert/strict';
import test from 'node:test';
import { Simulation } from '../src/simulation/simulation.js';
import { Game } from '../src/game/game.js';

function advance(sim, steps) {
  for (let i = 0; i < steps; i++) sim.step();
}

test('grains are born fully above the board and fall into view without losing mass', () => {
  const sim = new Simulation();
  advance(sim, 3);
  assert.equal(sim.emitted, 1);
  const grain = sim.grains[0];
  assert.ok(grain.y < -sim.config.grainRadius);
  advance(sim, 60);
  assert.ok(grain.y > 0);
  assert.ok(grain.vy > 0);
  assert.equal(sim.emitted, sim.left + sim.right + sim.grains.length);
});

test('the opening sweeps smoothly across both sides and turns without leaving the board width', () => {
  const sim = new Simulation({ sourceRate: 0 });
  const positions = [sim.sourceX];
  let previous = sim.sourceX;
  for (let i = 1; i <= 3600; i++) {
    sim.step();
    assert.ok(Math.abs(sim.sourceX - previous) < 0.08);
    previous = sim.sourceX;
    if (i % 900 === 0) positions.push(sim.sourceX);
  }
  for (const [index, expected] of [80, 124, 80, 36, 80].entries())
    assert.ok(Math.abs(positions[index] - expected) < 1e-8);
  const wide = new Simulation({ sourceRate: 0, sourceSwayAmplitude: 500 });
  for (let i = 0; i < 3600; i++) {
    wide.step();
    assert.ok(
      wide.sourceX - wide.config.sourceWidth / 2 >=
        wide.config.grainRadius - 1e-8,
    );
    assert.ok(
      wide.sourceX + wide.config.sourceWidth / 2 <=
        wide.config.width - wide.config.grainRadius + 1e-8,
    );
  }
});

test('newly emitted grains follow the moving opening rather than a fixed centre', () => {
  const sim = new Simulation({ stoneAdhesionRate: 0, sandAdhesionRate: 0 });
  const right = [],
    left = [];
  for (let i = 0; i < 3600; i++) {
    const nextId = sim.nextId,
      centre = sim.sourceX;
    sim.step();
    for (const grain of sim.grains)
      if (grain.id >= nextId) {
        assert.ok(
          Math.abs(grain.x - centre) < sim.config.sourceWidth / 2 + 0.1,
        );
        assert.ok(grain.y < 0);
        if (i >= 14 * 60 && i < 16 * 60) right.push(grain.x);
        if (i >= 44 * 60 && i < 46 * 60) left.push(grain.x);
      }
    assert.equal(sim.emitted, sim.left + sim.right + sim.grains.length);
  }
  assert.ok(sim.emitted > 1000 && sim.emitted < 1800);
  assert.ok(right.length > 20 && left.length > 20);
  assert.ok(right.reduce((a, b) => a + b, 0) / right.length > 120);
  assert.ok(left.reduce((a, b) => a + b, 0) / left.length < 40);
});

test('challenge preparation does not shift the starting phase; pauses drift without emission and Reset restarts it', () => {
  const game = new Game('challenge');
  for (let i = 0; i < 600; i++) game.step();
  assert.equal(game.sim.sourceTime, 0);
  assert.equal(game.sim.sourceX, 80);
  game.begin();
  for (let i = 0; i < 900; i++) game.step();
  assert.ok(Math.abs(game.sim.sourceX - 124) < 1e-8);
  const count = game.sim.emitted;
  game.togglePour();
  for (let i = 0; i < 900; i++) game.step();
  assert.equal(game.sim.emitted, count);
  assert.ok(Math.abs(game.sim.sourceX - 80) < 1e-8);
  game.togglePour();
  for (let i = 0; i < 5; i++) game.step();
  assert.ok(game.sim.emitted > count && game.sim.emitted <= count + 4);
  game.reset();
  assert.equal(game.sim.sourceTime, 0);
  assert.equal(game.sim.sourceX, 80);
  assert.equal(game.sim.remaining, 960);
});
