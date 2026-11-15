import assert from 'node:assert/strict';
import test from 'node:test';
import { Simulation } from '../src/simulation/simulation.js';
import { sweepFixture, stroke } from '../scripts/feel-check.js';

test('a broad sweep moves useful material toward either bowl without creating sand', () => {
  for (const [direction, target] of [
    ['left', 45],
    ['right', 115],
  ]) {
    const sim = sweepFixture(Simulation);
    const before = sim.snapshot();
    stroke(sim, { x: 80, y: 145 }, { x: target, y: 170 });
    assert.ok(
      sim.grains.filter(
        (g, i) => Math.hypot(g.x - before[i].x, g.y - before[i].y) > 0.5,
      ).length > 80,
    );
    assert.equal(sim.emitted, 153);
    for (let i = 0; i < 480; i++) {
      sim.step();
      assert.equal(sim.emitted, sim.left + sim.right + sim.grains.length);
      assert.ok(sim.grains.every((g) => Math.hypot(g.vx, g.vy) <= 16.000001));
    }
    assert.ok(sim[direction] > 70);
    assert.ok(sim[direction === 'left' ? 'right' : 'left'] < 5);
  }
});

test('sparse and dense events produce the same swept material positions', () => {
  const sparse = sweepFixture(Simulation),
    dense = sweepFixture(Simulation);
  stroke(sparse, { x: 80, y: 145 }, { x: 45, y: 170 }, 1);
  stroke(dense, { x: 80, y: 145 }, { x: 45, y: 170 }, 100);
  for (let i = 0; i < sparse.grains.length; i++) {
    assert.ok(
      Math.hypot(
        sparse.grains[i].x - dense.grains[i].x,
        sparse.grains[i].y - dense.grains[i].y,
      ) < 1e-9,
    );
    assert.equal(sparse.grains[i].bond, dense.grains[i].bond);
  }
  assert.equal(sparse.brushStrokes.size, 0);
  assert.equal(dense.brushStrokes.size, 0);
});

test('a stationary held contact cannot repeatedly pump sand or strengthen its trace', () => {
  const sim = sweepFixture(Simulation),
    point = { x: 80, y: 145 };
  sim.brush(point, point, { pointerId: 1, start: true });
  const before = sim.snapshot(),
    trace = sim.surface.snapshot();
  for (let i = 0; i < 60; i++)
    sim.brush(point, point, { pointerId: 1, start: false });
  assert.deepEqual(sim.snapshot(), before);
  assert.deepEqual(sim.surface.snapshot(), trace);
  sim.endBrush(1);
  assert.deepEqual(sim.snapshot(), before);
});

test('each finger owns its residual brush spacing and ending one preserves the other', () => {
  const sim = sweepFixture(Simulation);
  sim.brush(
    { x: 70, y: 145 },
    { x: 70.5, y: 146 },
    { pointerId: 1, start: true },
  );
  sim.brush(
    { x: 90, y: 145 },
    { x: 90.5, y: 146 },
    { pointerId: 2, start: true },
  );
  assert.equal(sim.brushStrokes.size, 2);
  sim.endBrush(1);
  assert.equal(sim.brushStrokes.size, 1);
  assert.ok(sim.brushStrokes.has(2));
  const serial = sim.brushFeedback.serial;
  sim.brush(
    { x: 90.5, y: 146 },
    { x: 105, y: 160 },
    { pointerId: 2, start: false },
  );
  assert.ok(sim.brushFeedback.serial > serial);
  sim.endBrush(2);
  assert.equal(sim.brushStrokes.size, 0);
  assert.equal(sim.grains.length, 153);
});

test('material feedback requires actual sand contact and collection feedback records the real crossing', () => {
  const sim = new Simulation({ sourceRate: 0 });
  sim.brush({ x: 80, y: 100 }, { x: 90, y: 120 });
  assert.equal(sim.brushFeedback.serial, 0);
  assert.ok(sim.discovery.levelAt(85, 110) > 0);
  const grain = sim.addGrain(85, 110);
  sim.emitted++;
  sim.anchor(grain, 'stone');
  sim.brush({ x: 80, y: 100 }, { x: 90, y: 120 });
  assert.ok(sim.brushFeedback.moved > 0);
  assert.equal(sim.brushFeedback.released, 1);
  assert.equal(grain.brushedAt, sim.time);
  sim.collect({ px: 40, py: 180, x: 44, y: 182, missed: false });
  assert.deepEqual(sim.lastCollections[0], { x: 42, time: sim.time });
  assert.equal(sim.lastCollections[1], null);
});
