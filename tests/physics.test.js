import assert from 'node:assert/strict';
import test from 'node:test';
import { Simulation } from '../src/simulation/simulation.js';
import { fillStressScene } from '../src/config/stress-scene.js';

function advance(sim, count) {
  for (let i = 0; i < count; i++) sim.step();
}
function conserved(sim) {
  assert.equal(sim.emitted, sim.left + sim.right + sim.grains.length);
  assert.equal(sim.spill, sim.grains.filter((g) => g.missed).length);
  assert.equal(sim.emitted, sim.left + sim.right + sim.spill + sim.faceCount);
}
function seedGrain(sim, x, y, vx = 0, vy = 0) {
  const g = sim.addGrain(x, y, vx, vy);
  sim.emitted++;
  return g;
}

test('the variable source delivers all 960 grains at a gentle speed without losing mass', () => {
  const sim = new Simulation({
    supply: 960,
    stoneAdhesionRate: 0,
    sandAdhesionRate: 0,
  });
  for (let i = 0; i < 3900 && sim.remaining; i++) {
    sim.step();
    conserved(sim);
    assert.equal(sim.remaining + sim.emitted, 960);
    for (const g of sim.grains) assert.ok(Math.hypot(g.vx, g.vy) <= 16.000001);
  }
  assert.equal(sim.emitted, 960);
  assert.equal(sim.remaining, 0);
});

test('sand weakly adheres to bare stone, and an attached grain holds its position', () => {
  const sim = new Simulation({ sourceRate: 0 });
  const grain = seedGrain(sim, 80, 100);
  grain.threshold = 0.01;
  advance(sim, 180);
  assert.equal(grain.bond, 'stone');
  const position = { x: grain.x, y: grain.y };
  advance(sim, 180);
  assert.deepEqual({ x: grain.x, y: grain.y }, position);
  conserved(sim);
});

test('sand binds more readily to an existing deposit than to bare stone', () => {
  const bare = new Simulation({ sourceRate: 0 });
  const lone = seedGrain(bare, 80, 98.6, 0, 1);
  lone.threshold = 1;
  const sand = new Simulation({ sourceRate: 0, stoneAdhesionRate: 0 });
  const root = seedGrain(sand, 80, 100);
  sand.anchor(root, 'stone');
  const child = seedGrain(sand, 80, 98.6, 0, 1);
  child.threshold = 1;
  advance(bare, 120);
  advance(sand, 120);
  assert.equal(lone.bond, null);
  assert.equal(child.bond, 'sand');
  assert.equal(child.parent, root);
  assert.ok(root.children.has(child));
  conserved(sand);
});

test('natural accumulation creates both stone and sand bonds, with more sand bonds', () => {
  const sim = new Simulation();
  advance(sim, 1200);
  const stone = sim.grains.filter((g) => g.bond === 'stone').length;
  const sand = sim.grains.filter((g) => g.bond === 'sand').length;
  assert.ok(stone > 10);
  assert.ok(sand > stone);
  conserved(sim);
});

test('brushing releases a complete dependent chain, preserves every grain and delays reattachment', () => {
  const sim = new Simulation({ sourceRate: 0 });
  let parent = seedGrain(sim, 80, 110);
  sim.anchor(parent, 'stone');
  const chain = [parent];
  for (let i = 1; i < 12; i++) {
    const child = seedGrain(sim, 80, 110 - i * 1.3);
    sim.anchor(child, 'sand', parent);
    chain.push(child);
    parent = child;
  }
  const other = seedGrain(sim, 100, 130);
  sim.anchor(other, 'stone');
  const count = sim.grains.length;
  const released = sim.brush({ x: 80, y: 111 }, { x: 80, y: 111 });
  assert.equal(released, 12);
  assert.equal(sim.grains.length, count);
  assert.ok(
    chain.every(
      (g) => g.bond === null && g.parent === null && g.children.size === 0,
    ),
  );
  assert.equal(other.bond, 'stone');
  advance(sim, 60);
  assert.ok(chain.every((g) => g.bond === null));
  conserved(sim);
});

test('one stroke pushes real material aside; brushing empty stone creates a surface trace but no grains', () => {
  const brushed = new Simulation({ stoneAdhesionRate: 0, sandAdhesionRate: 0 });
  brushed.brush({ x: 60, y: 70 }, { x: 100, y: 140 });
  assert.equal(brushed.grains.length, 0);
  assert.ok(brushed.surface.strengthAt(80, 105) > 0);
  advance(brushed, 180);
  const control = new Simulation({ stoneAdhesionRate: 0, sandAdhesionRate: 0 });
  advance(control, 180);
  assert.equal(brushed.emitted, control.emitted);
  conserved(brushed);
  const sim = new Simulation({ sourceRate: 0 });
  const g = seedGrain(sim, 80, 100);
  sim.anchor(g, 'stone');
  sim.brush({ x: 65, y: 85 }, { x: 95, y: 115 });
  assert.equal(g.bond, null);
  assert.ok(Math.hypot(g.x - 80, g.y - 100) > 0.2);
  assert.equal(sim.grains.length, 1);
  conserved(sim);
});

test('real attached sand deflects an incoming grain, with no generated barrier', () => {
  const sim = new Simulation({
    sourceRate: 0,
    stoneAdhesionRate: 0,
    sandAdhesionRate: 0,
  });
  for (let i = 0; i < 12; i++)
    sim.anchor(seedGrain(sim, 72 + i * 0.9, 90 + i * 0.9), 'stone');
  const flowing = seedGrain(sim, 80, 80, 0, 8);
  advance(sim, 120);
  assert.ok(flowing.x > 83);
  assert.equal(flowing.bond, null);
  conserved(sim);
});

test('missed grains settle into persistent piles in all three ground pockets', () => {
  const sim = new Simulation({
    sourceRate: 0,
    stoneAdhesionRate: 0,
    sandAdhesionRate: 0,
  });
  const grains = [8, 80, 152].map((x) => seedGrain(sim, x, 180.9, 0, 16));
  advance(sim, 300);
  assert.equal(sim.spill, 3);
  assert.equal(sim.grains.length, 3);
  for (const g of grains) {
    assert.ok(g.y > 197 && g.y <= 197.350001);
    assert.equal(g.sleeping, true);
  }
  const positions = sim.snapshot();
  sim.brush({ x: 80, y: 60 }, { x: 90, y: 130 });
  assert.ok(grains.every((g) => g.sleeping));
  advance(sim, 600);
  assert.deepEqual(sim.snapshot(), positions);
  conserved(sim);
});

test('collection interpolates the mouth crossing and counts a grain only once', () => {
  const sim = new Simulation({ sourceRate: 0 });
  assert.equal(
    sim.collect({ px: 60, py: 180, x: 80, y: 183, missed: false }),
    true,
  );
  assert.equal(sim.left, 1);
  sim.left = 0;
  seedGrain(sim, 115, 180.9, 0, 16);
  advance(sim, 10);
  assert.equal(sim.right, 1);
  assert.equal(sim.grains.length, 0);
  advance(sim, 60);
  assert.equal(sim.right, 1);
  conserved(sim);
  sim.spill = 1;
  assert.equal(
    sim.collect({ px: 60, py: 180, x: 80, y: 183, missed: true }),
    true,
  );
  assert.equal(sim.spill, 0);
});

test('stopped or obstructed emission spends no supply and resumes without a catch-up burst', () => {
  const sim = new Simulation({
    supply: 960,
    inletBondSeconds: Infinity,
    sourceSwayAmplitude: 0,
    sourceWidth: 18,
    sourceFlowVariation: 0,
  });
  sim.pouring = false;
  advance(sim, 120);
  assert.equal(sim.emitted, 0);
  for (let i = 0; i < 15; i++)
    sim.anchor(sim.addGrain(71 + i * 1.3, sim.config.sourceY), 'stone');
  sim.pouring = true;
  advance(sim, 120);
  assert.equal(sim.emitted, 0);
  assert.equal(sim.blockReason, 'source');
  for (const g of sim.grains) {
    sim.release(g);
    g.y = 25;
  }
  advance(sim, 5);
  assert.equal(sim.emitted, 2);
  assert.equal(sim.remaining, 958);
});

test('a full retained tray pauses emission without deleting stone or ground material', () => {
  const sim = new Simulation({ sourceRate: 24, freePourCap: 4 });
  for (let i = 0; i < 4; i++) {
    const g = seedGrain(sim, 76 + i * 1.3, 197.35);
    g.missed = true;
    sim.spill++;
  }
  advance(sim, 120);
  assert.equal(sim.emitted, 4);
  assert.equal(sim.grains.length, 4);
  assert.equal(sim.blockReason, 'full');
  conserved(sim);
});

test('identical seeds and brush strokes at identical steps reproduce the full state', () => {
  function replay() {
    const sim = new Simulation({ supply: 960, seed: 2026 });
    for (let i = 0; i < 1500; i++) {
      if (i === 500 || i === 1000)
        sim.brush({ x: 78, y: 32 }, { x: 94, y: 140 });
      sim.step();
      conserved(sim);
    }
    return {
      grains: sim.snapshot(),
      surface: sim.surface.snapshot(),
      discovery: sim.discovery.snapshot(),
      left: sim.left,
      right: sim.right,
      spill: sim.spill,
      remaining: sim.remaining,
      source: {
        x: sim.sourceX,
        time: sim.sourceTime,
        start: sim.sourceStartStep,
      },
    };
  }
  assert.deepEqual(replay(), replay());
});

test('the 6000-grain fixture is retained and a brush wakes/releases material without deleting it', () => {
  const sim = new Simulation({ sourceRate: 0 });
  fillStressScene(sim);
  assert.equal(sim.grains.length, 6000);
  advance(sim, 30);
  conserved(sim);
  const released = sim.brush({ x: 78, y: 40 }, { x: 94, y: 140 });
  assert.ok(released > 50);
  assert.equal(sim.grains.length, 6000);
  advance(sim, 30);
  conserved(sim);
});
