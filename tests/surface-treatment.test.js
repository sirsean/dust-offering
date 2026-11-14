import assert from 'node:assert/strict';
import test from 'node:test';
import { prototype } from '../src/config/prototype.js';
import { SurfaceTreatment } from '../src/simulation/surface-treatment.js';
import { Simulation } from '../src/simulation/simulation.js';
import { Game } from '../src/game/game.js';

const point = { x: 80.5, y: 100.5 };
function advance(sim, steps) {
  for (let i = 0; i < steps; i++) sim.step();
}

test('each brush pass adds surface strength, including repeated taps, with a bounded maximum', () => {
  const field = new SurfaceTreatment(prototype);
  assert.equal(field.strengthAt(point.x, point.y), 0);
  field.paint(point, point);
  assert.equal(field.strengthAt(point.x, point.y), 1);
  field.paint(point, point);
  assert.equal(field.strengthAt(point.x, point.y), 2);
  for (let i = 0; i < 20; i++) field.paint(point, point);
  assert.equal(field.strengthAt(point.x, point.y), 6);
});

test('strength halves over time, a new pass adds to the decayed value, and old traces expire', () => {
  const field = new SurfaceTreatment(prototype);
  field.paint(point, point);
  field.advanceTo(30);
  assert.equal(field.strengthAt(point.x, point.y), 0.5);
  field.paint(point, point);
  assert.equal(field.strengthAt(point.x, point.y), 1.5);
  field.advanceTo(60);
  assert.equal(field.strengthAt(point.x, point.y), 0.75);
  field.advanceTo(600);
  assert.equal(field.strengthAt(point.x, point.y), 0);
  assert.deepEqual(field.snapshot().cells, []);
});

test('a continuous pass coats its full path similarly with sparse or dense pointer samples', () => {
  const sparse = new SurfaceTreatment(prototype),
    dense = new SurfaceTreatment(prototype);
  const a = { x: 80.5, y: 50.5 },
    b = { x: 80.5, y: 150.5 };
  sparse.paint(a, b);
  dense.paint(a, a);
  let previous = a;
  for (let y = 50.75; y <= 150.5; y += 0.25) {
    const next = { x: 80.5, y };
    dense.paint(previous, next, { start: false });
    previous = next;
  }
  for (const y of [65.5, 80.5, 100.5, 125.5, 140.5]) {
    assert.ok(sparse.strengthAt(80.5, y) > 0.95);
    assert.ok(
      Math.abs(sparse.strengthAt(80.5, y) - dense.strengthAt(80.5, y)) < 0.025,
    );
  }
  const before = dense.strengthAt(80.5, 150.5);
  dense.paint(b, b, { start: false });
  assert.equal(dense.strengthAt(80.5, 150.5), before);
});

test('treatment stays on editable stone and cannot coat the source or bowls', () => {
  const field = new SurfaceTreatment(prototype);
  for (const p of [
    { x: 80, y: 14 },
    { x: 40, y: 181 },
    { x: 10, y: 60 },
  ])
    field.paint(p, p);
  assert.equal(field.snapshot().cells.length, 0);
  field.paint({ x: 80, y: 26 }, { x: 80, y: 169 });
  assert.equal(field.strengthAt(80, 14), 0);
  assert.equal(field.strengthAt(80, 25.9), 0);
  assert.equal(field.strengthAt(80, 181), 0);
  assert.ok(field.strengthAt(80, 100) > 0);
});

test('pruning the visual coating does not change later adhesion field values', () => {
  const a = new SurfaceTreatment(prototype),
    b = new SurfaceTreatment(prototype);
  for (const field of [a, b]) {
    field.paint(point, point);
    field.advanceTo(600);
  }
  a.visitVisibleCells(() =>
    assert.fail('Expired coating should not be rendered'),
  );
  a.paint(point, point);
  b.paint(point, point);
  assert.deepEqual(a.snapshot(), b.snapshot());
});

test('coated stone catches a grain sooner, and fully decayed coating behaves like bare stone', () => {
  function scene(passes, aged = false) {
    const sim = new Simulation({ sourceRate: 0, sandAdhesionRate: 0 });
    for (let i = 0; i < passes; i++)
      sim.brush({ x: 80.5, y: 70 }, { x: 80.5, y: 155 });
    assert.equal(sim.grains.length, 0);
    if (aged) {
      sim.steps = 36000;
      sim.surface.advanceTo(sim.time);
    }
    const grain = sim.addGrain(80.5, 100.5);
    grain.threshold = 0.3;
    advance(sim, 120);
    return { sim, grain };
  }
  const bare = scene(0),
    treated = scene(3),
    faded = scene(3, true);
  assert.equal(bare.grain.bond, null);
  assert.equal(treated.grain.bond, 'stone');
  assert.ok(treated.grain.y < bare.grain.y);
  assert.equal(faded.grain.bond, null);
  assert.equal(faded.grain.y, bare.grain.y);
});

test('traces decay while the pour is paused, survive Begin, and clear completely on Reset', () => {
  const game = new Game('challenge');
  game.edit(point, point);
  assert.equal(game.sim.surface.strengthAt(point.x, point.y), 1);
  assert.equal(game.sim.grains.length, 0);
  advance(game.sim, 1800);
  assert.equal(game.sim.surface.strengthAt(point.x, point.y), 0.5);
  game.begin();
  assert.equal(game.sim.surface.strengthAt(point.x, point.y), 0.5);
  game.togglePour();
  advance(game.sim, 1800);
  assert.equal(game.sim.surface.strengthAt(point.x, point.y), 0.25);
  game.reset();
  assert.deepEqual(game.sim.surface.snapshot(), { time: 0, cells: [] });
});
