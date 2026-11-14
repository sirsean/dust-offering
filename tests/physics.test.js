import assert from 'node:assert/strict';
import test from 'node:test';
import { Simulation } from '../src/simulation/simulation.js';
import { measureSplit } from '../scripts/physics-check.js';
import { physicsScene } from '../src/config/physics-scene.js';
import { fillStressScene } from '../src/config/stress-scene.js';

function advance(sim, count) {
  for (let i = 0; i < count; i++) sim.step();
}
function conserved(sim) {
  assert.equal(
    sim.emitted,
    sim.left + sim.right + sim.spill + sim.grains.length,
  );
}

test('unobstructed challenge emits 4800 grains in exactly 2400 steps and conserves supply', () => {
  const sim = new Simulation({ supply: 4800 });
  for (let i = 0; i < 2400; i++) {
    sim.step();
    conserved(sim);
    assert.equal(4800, sim.remaining + sim.emitted);
    if (i < 2399) assert.ok(sim.remaining > 0);
  }
  assert.equal(sim.remaining, 0);
  assert.equal(sim.emitted, 4800);
  advance(sim, 300);
  conserved(sim);
  assert.equal(sim.grains.length, 0);
  assert.equal(sim.spill, 4800);
});

test('stopping and blocking emission spend no supply and accrue no backlog', () => {
  const sim = new Simulation({ supply: 4800 });
  sim.pouring = false;
  advance(sim, 120);
  assert.equal(sim.emitted, 0);
  sim.pouring = true;
  sim.ridges.add({ x: 72, y: 14 }, { x: 88, y: 14 });
  advance(sim, 120);
  assert.equal(sim.emitted, 0);
  assert.equal(sim.blocked, true);
  sim.ridges.rub(80, 14, 12);
  sim.step();
  assert.equal(sim.emitted, 2);
  assert.equal(sim.remaining, 4798);
  sim.pouring = false;
  sim.step();
  assert.equal(sim.emitted, 2);
  assert.ok(sim.grains[0].y > 14);
});

test('the Free Pour cap pauses and resumes without deleting retained grains', () => {
  const sim = new Simulation({ freePourCap: 4 });
  advance(sim, 10);
  assert.equal(sim.grains.length, 4);
  assert.equal(sim.emitted, 4);
  assert.equal(sim.blocked, true);
  advance(sim, 300);
  assert.ok(sim.emitted > 4);
  conserved(sim);
  assert.ok(sim.grains.length <= 4);
});

test('collection interpolates the crossing and counts each removed grain once', () => {
  const sim = new Simulation({ sourceRate: 0 });
  sim.collect({ px: 60, py: 180, x: 80, y: 183 });
  assert.equal(sim.left, 1);
  sim.addGrain(115, 180.9, 0, 78);
  sim.step();
  assert.equal(sim.right, 1);
  assert.equal(sim.grains.length, 0);
  advance(sim, 10);
  assert.equal(sim.right, 1);
});

test('20 and 35 degree ramps transport grains both ways without staircase jams', () => {
  for (const angle of [20, 35])
    for (const direction of [-1, 1]) {
      const sim = new Simulation({ sourceRate: 0 });
      const slope = Math.tan((angle * Math.PI) / 180);
      const start = { x: 80 - direction * 50, y: 70 };
      sim.ridges.add(start, { x: 80 + direction * 50, y: 70 + 100 * slope });
      const grain = sim.addGrain(start.x + direction * 10, 70 + 10 * slope - 2);
      advance(sim, 480);
      assert.ok(
        (grain.x - start.x) * direction > 100,
        `${angle} degrees, direction ${direction}`,
      );
    }
});

test('a supported pile starts draining within 0.2 seconds after a rub', () => {
  const sim = new Simulation();
  const fixture = physicsScene.catch;
  sim.ridges.add(fixture.start, fixture.end);
  advance(sim, fixture.pourSteps);
  sim.pouring = false;
  advance(sim, fixture.settleSteps);
  assert.ok(
    sim.grains.filter((g) => Math.abs(g.x - 80) < 8 && g.y > 70).length > 10,
  );
  const count = sim.grains.length;
  sim.edit({ x: 80, y: 80 }, { x: 80, y: 80 }, 'rub');
  // Widen the same cut to a 12-unit opening, preserving all grains.
  sim.ridges.rub(fixture.cut.x, fixture.cut.y, fixture.cut.radius);
  assert.equal(sim.grains.length, count);
  advance(sim, 12);
  assert.ok(sim.grains.some((g) => Math.abs(g.x - 80) < 8 && g.y > 80.5));
});

test('three-width split gate passes independently for three fixed seeds', () => {
  for (const seed of physicsScene.seeds) {
    const results = physicsScene.widths.map((width) =>
      measureSplit(width, seed),
    );
    assert.ok(
      results.filter((r) => r.fraction >= 0.1 && r.fraction <= 0.9).length >= 2,
    );
    for (let i = 1; i < results.length; i++)
      assert.ok(
        results[i].fraction - results[i - 1].fraction >= 0.1,
        JSON.stringify(results),
      );
    for (const result of results) assert.equal(result.emitted, 1800);
  }
});

test('seeded replay with identical edits on identical steps is identical', () => {
  function replay() {
    const sim = new Simulation({ supply: 4800, seed: 2026 });
    for (let i = 0; i < 600; i++) {
      if (i === 25) sim.edit({ x: 42, y: 75 }, { x: 120, y: 113 }, 'draw');
      if (i === 260) sim.edit({ x: 82, y: 94 }, { x: 85, y: 95 }, 'rub');
      sim.step();
      conserved(sim);
    }
    return {
      grains: sim.grains,
      ridges: sim.ridges.segments,
      left: sim.left,
      right: sim.right,
      spill: sim.spill,
      remaining: sim.remaining,
    };
  }
  assert.deepEqual(replay(), replay());
});

test('drawing through dust adds support without changing counts or injecting velocity', () => {
  const sim = new Simulation({ sourceRate: 0 });
  const grain = sim.addGrain(80, 80, 3, 4);
  sim.edit({ x: 70, y: 80 }, { x: 90, y: 80 }, 'draw');
  assert.equal(sim.grains.length, 1);
  assert.equal(grain.vx, 3);
  assert.equal(grain.vy, 4);
  assert.ok(grain.y < 79);
});

test('a loaded support retains 6000 grains; an edit wakes sleepers and a moving contact wakes neighbors', () => {
  const stress = new Simulation({ sourceRate: 0 });
  fillStressScene(stress);
  advance(stress, 120);
  assert.equal(stress.grains.length, 6000);
  conserved(stress);
  const sim = new Simulation({ sourceRate: 0 });
  sim.ridges.add({ x: 60, y: 80 }, { x: 100, y: 80 });
  const a = sim.addGrain(80, 78.35);
  const b = sim.addGrain(81.3, 78.35);
  advance(sim, 120);
  assert.equal(a.sleeping, true);
  assert.equal(b.sleeping, true);
  sim.addGrain(80, 75, 0, 78);
  advance(sim, 3);
  assert.equal(a.sleeping, false);
  assert.equal(b.sleeping, false);
  advance(sim, 120);
  sim.edit({ x: 80, y: 80 }, { x: 82, y: 80 }, 'rub');
  assert.ok(sim.grains.every((g) => !g.sleeping));
  advance(sim, 12);
  assert.ok(sim.grains.some((g) => g.y > 80));
});
