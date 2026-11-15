import assert from 'node:assert/strict';
import test from 'node:test';
import { Simulation } from '../src/simulation/simulation.js';

function advance(sim, steps) {
  for (let i = 0; i < steps; i++) sim.step();
}
function conserved(sim) {
  assert.equal(sim.emitted, sim.left + sim.right + sim.grains.length);
}

export function guidedGrain(passes, reverse = false, mirror = false) {
  const sim = new Simulation({
    sourceRate: 0,
    stoneAdhesionRate: 0,
    sandAdhesionRate: 0,
  });
  const a = { x: mirror ? 95 : 65, y: 70 },
    b = { x: mirror ? 55 : 105, y: 150 };
  for (let i = 0; i < passes; i++) sim.brush(reverse ? b : a, reverse ? a : b);
  const grain = sim.addGrain(mirror ? 90 : 70, 80, 0, 12);
  sim.emitted++;
  for (let i = 0; i < 240; i++) {
    sim.step();
    assert.ok(Math.hypot(grain.vx, grain.vy) <= 16.000001);
  }
  conserved(sim);
  return grain;
}

test('layered traces guide loosely downhill, independently of drawing direction, without solid rails', () => {
  const bare = guidedGrain(0),
    once = guidedGrain(1),
    layered = guidedGrain(3),
    upward = guidedGrain(3, true),
    left = guidedGrain(3, false, true);
  assert.equal(bare.x, 70);
  assert.ok(once.x > bare.x + 10);
  assert.ok(layered.x > once.x + 5);
  assert.ok(left.x < 90 - 20);
  assert.ok(Math.abs(upward.x - layered.x) < 0.001);
  assert.ok(Math.abs(upward.y - layered.y) < 0.001);
  for (const grain of [once, layered, upward, left]) {
    assert.ok(grain.y > 130);
    assert.equal(grain.bond, null);
  }
  assert.ok(
    Math.abs(layered.x - (65 + (layered.y - 70) / 2)) > 0.5,
    'The grain can drift across the trace',
  );
});

test('a horizontal trace slows crossing without suspending a grain or moving it uphill', () => {
  const sim = new Simulation({
    sourceRate: 0,
    stoneAdhesionRate: 0,
    sandAdhesionRate: 0,
  });
  for (let i = 0; i < 6; i++) sim.brush({ x: 50, y: 100 }, { x: 110, y: 100 });
  const grain = sim.addGrain(80, 100, 0, 4);
  sim.emitted++;
  advance(sim, 60);
  assert.ok(grain.y > 100.3);
  assert.ok(grain.vy > 0);
  advance(sim, 540);
  assert.ok(grain.y > 110);
  assert.ok(grain.vy > 0);
  assert.equal(grain.bond, null);
  conserved(sim);
});

test('temporary upper bonds release their descendants while lower stone attachments remain', () => {
  const sim = new Simulation({ sourceRate: 0, sandAdhesionRate: 0 });
  const root = sim.addGrain(80, 60),
    child = sim.addGrain(80, 58.7),
    lower = sim.addGrain(100, 120);
  const loose = sim.addGrain(80, 57.4),
    ground = sim.addGrain(8, 197.35);
  loose.sleeping = true;
  ground.sleeping = true;
  ground.missed = true;
  sim.spill = 1;
  sim.emitted = 5;
  sim.anchor(root, 'stone');
  sim.anchor(child, 'sand', root);
  sim.anchor(lower, 'stone');
  advance(sim, 144);
  assert.equal(root.bond, 'stone');
  assert.equal(child.bond, 'sand');
  advance(sim, 18);
  assert.equal(root.bond, null);
  assert.equal(child.bond, null);
  assert.equal(root.children.size, 0);
  assert.equal(child.parent, null);
  assert.equal(lower.bond, 'stone');
  assert.ok(root.y > 60);
  assert.ok(
    loose.y > 57.4,
    'Unsupported sleeping sand must fall when its support weathers',
  );
  assert.equal(ground.sleeping, true);
  assert.equal(ground.y, 197.35);
  conserved(sim);
});

test('the wider inlet spans the pour and drains during two minutes without a brush or lost grains', () => {
  for (const seed of [48, 2026, 914]) {
    const sim = new Simulation({ seed });
    let min = Infinity,
      max = -Infinity;
    for (let i = 0; i < 7200; i++) {
      sim.step();
      if (i < 60)
        for (const grain of sim.grains) {
          min = Math.min(min, grain.x);
          max = Math.max(max, grain.x);
        }
    }
    assert.ok(max - min > 30);
    assert.ok(sim.emitted > 2200 && sim.emitted < 3200);
    assert.equal(sim.blocked, false);
    assert.equal(sim.grains.filter((g) => g.bond && g.y < 45).length, 0);
    // The offscreen fall adds in-flight grains above the tip; they must keep
    // draining rather than forming a static cap at the old nozzle position.
    assert.ok(sim.grains.filter((g) => g.y < 36).length < 85);
    assert.ok(sim.grains.filter((g) => g.y < 60).length < 250);
    assert.ok(
      sim.attachedCount > 100,
      'Deposits still accumulate on the rest of the stone',
    );
    conserved(sim);
  }
});
