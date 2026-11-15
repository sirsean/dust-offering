import assert from 'node:assert/strict';
import test from 'node:test';
import { prototype } from '../src/config/prototype.js';
import { SurfaceDiscovery } from '../src/simulation/surface-discovery.js';
import { Simulation } from '../src/simulation/simulation.js';
import { Game } from '../src/game/game.js';

const point = { x: 80.5, y: 100.5 };
function advance(sim, steps) {
  for (let i = 0; i < steps; i++) sim.step();
}

test('the stone starts undiscovered; brushing reveals only the touched area and stacks to full visibility', () => {
  const field = new SurfaceDiscovery(prototype);
  assert.deepEqual(field.snapshot(), []);
  field.brush(point, point);
  const once = field.levelAt(point.x, point.y);
  assert.ok(once > 0.6 && once < 0.7);
  field.brush(point, point);
  assert.equal(field.levelAt(point.x, point.y), 1);
  assert.equal(field.levelAt(110, 120), 0);
  assert.equal(field.levelAt(80, 20), 0);
  for (let i = 0; i < 20; i++) field.brush(point, point);
  assert.equal(field.levelAt(point.x, point.y), 1);
});

test('fast and dense brush samples uncover the same continuous path without stationary-event dosing', () => {
  const a = new SurfaceDiscovery(prototype),
    b = new SurfaceDiscovery(prototype);
  const start = { x: 80.5, y: 50.5 },
    end = { x: 80.5, y: 150.5 };
  a.brush(start, end);
  b.brush(start, start);
  let previous = start;
  for (let y = 50.75; y <= 150.5; y += 0.25) {
    const next = { x: 80.5, y };
    b.brush(previous, next, { start: false });
    previous = next;
  }
  for (const y of [70.5, 90.5, 110.5, 130.5]) {
    assert.ok(a.levelAt(80.5, y) > 0.6);
    assert.ok(Math.abs(a.levelAt(80.5, y) - b.levelAt(80.5, y)) < 0.02);
  }
  const before = b.snapshot();
  b.brush(end, end, { start: false });
  assert.deepEqual(b.snapshot(), before);
});

test('sand contact accumulates by time and path, while off-stone and ground grains reveal nothing', () => {
  const a = new SurfaceDiscovery(prototype),
    b = new SurfaceDiscovery(prototype);
  a.grainContact(point, point, 1);
  for (let i = 0; i < 10; i++) b.grainContact(point, point, 0.1);
  assert.ok(Math.abs(a.levelAt(point.x, point.y) - 0.24) < 1e-6);
  assert.ok(
    Math.abs(a.levelAt(point.x, point.y) - b.levelAt(point.x, point.y)) < 1e-6,
  );
  const before = a.levelAt(point.x, point.y);
  a.grainContact(point, point, 1);
  assert.ok(a.levelAt(point.x, point.y) > before);
  const untouched = new SurfaceDiscovery(prototype);
  for (const p of [
    { x: 80, y: -4 },
    { x: 10, y: 100 },
    { x: 80, y: 197 },
  ])
    untouched.grainContact(p, p, 10);
  assert.deepEqual(untouched.snapshot(), []);
  untouched.grainContact({ x: 80, y: 50 }, { x: 80, y: 65 }, 1);
  for (const y of [52, 55, 60, 63]) assert.ok(untouched.levelAt(80, y) > 0);
  assert.equal(untouched.levelAt(100, 55), 0);
});

test('discovery reaches the apex and all rim edges without exposing the surrounding scene', () => {
  const field = new SurfaceDiscovery(prototype);
  field.brush({ x: 80, y: 3 }, { x: 80, y: 180 });
  field.brush({ x: 0, y: 176 }, { x: 160, y: 176 });
  for (const [x, y] of [
    [80, 6],
    [80, 175.9],
    [1, 176],
    [159, 176],
  ])
    assert.ok(field.levelAt(x, y) > 0);
  for (const [x, y] of [
    [80, 5],
    [80, 176.1],
    [0, 100],
    [40, 181],
  ])
    assert.equal(field.levelAt(x, y), 0);
});

test('discovery persists after grease fades and Begin, but Reset and mode changes hide the stone again', () => {
  const game = new Game('challenge');
  game.edit(point, point);
  const revealed = game.sim.discovery.snapshot();
  advance(game.sim, 5400);
  assert.equal(game.sim.surface.strengthAt(point.x, point.y), 0);
  assert.deepEqual(game.sim.discovery.snapshot(), revealed);
  game.begin();
  assert.deepEqual(game.sim.discovery.snapshot(), revealed);
  game.reset();
  assert.deepEqual(game.sim.discovery.snapshot(), []);
  game.edit(point, point);
  game.reset('free');
  assert.deepEqual(game.sim.discovery.snapshot(), []);
});

test('sand reveals the stone without changing particle physics, source timing or accounting', () => {
  const visible = new Simulation({ seed: 2026 }),
    disabled = new Simulation({
      seed: 2026,
      revealGrainRate: 0,
      revealBrushGain: 0,
    });
  for (let i = 0; i < 1200; i++) {
    if (i === 600)
      for (const sim of [visible, disabled])
        sim.brush({ x: 80, y: 70 }, { x: 110, y: 150 });
    visible.step();
    disabled.step();
  }
  assert.ok(visible.discovery.active.size > 0);
  assert.equal(disabled.discovery.active.size, 0);
  assert.deepEqual(visible.snapshot(), disabled.snapshot());
  assert.equal(visible.sourceTime, disabled.sourceTime);
  assert.equal(
    visible.emitted,
    visible.left + visible.right + visible.grains.length,
  );
  assert.equal(visible.left, disabled.left);
  assert.equal(visible.right, disabled.right);
  assert.equal(visible.spill, disabled.spill);
});
