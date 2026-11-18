import assert from 'node:assert/strict';
import test from 'node:test';
import { UpwellingSimulation } from '../src/lab/simulation.js';
import { createGoal, evaluateGoal } from '../src/lab/goals.js';
import { chooseStroke, performStroke } from '../src/lab/policy.js';
import { seededRandom } from '../src/simulation/random.js';
import { insideStone } from '../src/simulation/geometry.js';

function advance(sim, steps) {
  for (let i = 0; i < steps; i++) sim.step();
}
function grain(sim, x, y, vx = 0, vy = 0) {
  const g = sim.addGrain(x, y, vx, vy);
  sim.emitted++;
  sim.remaining--;
  return g;
}
function conserved(sim) {
  assert.equal(sim.emitted, sim.grains.length);
  assert.equal(sim.emitted + sim.remaining, sim.config.supply);
}

test('top-down material has no gravity or preferred motion axis and stays at rest', () => {
  const still = new UpwellingSimulation({ sourceRate: 0 }),
    a = new UpwellingSimulation({ sourceRate: 0 }),
    b = new UpwellingSimulation({ sourceRate: 0 });
  const rest = grain(still, 80, 100),
    x = grain(a, 80, 100, 8, 0),
    y = grain(b, 80, 100, 0, 8);
  for (const sim of [still, a, b]) advance(sim, 300);
  assert.equal(rest.x, 80);
  assert.equal(rest.y, 100);
  assert.equal(rest.sleeping, true);
  assert.equal(x.y, 100);
  assert.equal(y.x, 80);
  assert.ok(Math.abs(x.x - 80 - (y.y - 100)) < 1e-8);
  assert.ok(x.x > 82 && x.x < 83);
  assert.equal(x.sleeping, true);
});

test('three different interior wells emit finite real sand and pausing keeps supply without a backlog', () => {
  const sim = new UpwellingSimulation();
  assert.equal(sim.wells.length, 3);
  assert.ok(sim.wells.every((p) => insideStone(p.x, p.y)));
  assert.ok(sim.wells[2].y > sim.wells[0].y + 50);
  advance(sim, 300);
  const before = sim.emitted;
  sim.bubbling = false;
  advance(sim, 300);
  assert.equal(sim.emitted, before);
  sim.bubbling = true;
  sim.step();
  assert.ok(sim.emitted - before <= 2);
  advance(sim, 2400);
  assert.equal(sim.remaining, 0);
  assert.equal(sim.emitted, 3600);
  conserved(sim);
  assert.ok(
    sim.grains.every(
      (g) =>
        Number.isFinite(g.x) &&
        Number.isFinite(g.y) &&
        Math.hypot(g.vx, g.vy) <= 12.00001,
    ),
  );
  assert.ok(
    sim.grains.filter((g) => g.sleeping).every((g) => g.vx === 0 && g.vy === 0),
  );
});

test('a finger pushes existing material in any direction, and dust off the stone remains recoverable', () => {
  const sim = new UpwellingSimulation({ sourceRate: 0 });
  const g = grain(sim, 80, 174);
  performStroke(sim, { a: { x: 80, y: 160 }, b: { x: 80, y: 185 } });
  assert.equal(insideStone(g.x, g.y), false);
  conserved(sim);
  performStroke(sim, { a: { x: 80, y: 199 }, b: { x: 80, y: 155 } });
  assert.equal(insideStone(g.x, g.y), true);
  conserved(sim);
});

test('a stationary continued contact cannot pump sand or add grease, and fingers keep independent residual paths', () => {
  const sim = new UpwellingSimulation({ sourceRate: 0 });
  grain(sim, 80, 120);
  const p = { x: 80, y: 120 };
  sim.brush(p, p, { start: true, pointerId: 1 });
  const before = sim.snapshot(),
    surface = sim.surface.snapshot();
  for (let i = 0; i < 40; i++) sim.brush(p, p, { start: false, pointerId: 1 });
  assert.deepEqual(sim.snapshot(), before);
  assert.deepEqual(sim.surface.snapshot(), surface);
  sim.brush(
    { x: 100, y: 140 },
    { x: 101, y: 141 },
    { start: true, pointerId: 2 },
  );
  sim.endBrush(1);
  assert.equal(sim.brushStrokes.size, 1);
  assert.equal(sim.brushStrokes.has(2), true);
  sim.endBrush(2);
  assert.equal(sim.brushStrokes.size, 0);
  conserved(sim);
});

test('sparse and dense strokes push the same physical material', () => {
  const a = new UpwellingSimulation({ sourceRate: 0 }),
    b = new UpwellingSimulation({ sourceRate: 0 });
  for (const sim of [a, b])
    for (let i = 0; i < 40; i++)
      grain(sim, 78 + (i % 5) * 0.3, 110 + Math.floor(i / 5) * 0.3);
  const stroke = { a: { x: 80, y: 100 }, b: { x: 100, y: 145 } };
  performStroke(a, stroke, 1);
  performStroke(b, stroke, 100);
  for (let i = 0; i < a.grains.length; i++)
    assert.ok(
      Math.hypot(a.grains[i].x - b.grains[i].x, a.grains[i].y - b.grains[i].y) <
        1e-8,
    );
  conserved(a);
  conserved(b);
});

test('seeded material and input repeat exactly, and goal creation never affects physics', () => {
  const a = new UpwellingSimulation({ seed: 914 }),
    b = new UpwellingSimulation({ seed: 914 });
  for (let i = 0; i < 700; i++) {
    createGoal(i % 2 ? 'gather' : 'paths', 914);
    if (i === 500)
      for (const sim of [a, b])
        performStroke(sim, { a: { x: 80, y: 65 }, b: { x: 70, y: 115 } });
    a.step();
    b.step();
  }
  assert.deepEqual(a.snapshot(), b.snapshot());
  assert.deepEqual(a.wells, b.wells);
  conserved(a);
});

test('goals conserve required mass: emptying the stone or filling only one island cannot win', () => {
  const goal = createGoal('gather', 48),
    points = [];
  for (const p of goal.islands)
    for (let i = 0; i < 100; i++) points.push({ x: p.x, y: p.y });
  const sim = {
    grains: points,
    emitted: 300,
    remaining: 0,
    config: { supply: 300 },
  };
  assert.ok(evaluateGoal(sim, goal).fit > 0.99);
  sim.grains = points.map(() => ({ ...goal.islands[0] }));
  assert.ok(evaluateGoal(sim, goal).fit < 0.34);
  sim.grains = points.map(() => ({ x: 80, y: 190 }));
  for (const type of ['clear', 'level', 'gather', 'paths']) {
    const result = evaluateGoal(sim, createGoal(type, 48));
    assert.equal(result.fit, 0);
    assert.equal(result.complete, false);
  }
  sim.grains = [];
  sim.emitted = 0;
  assert.equal(evaluateGoal(sim, goal).complete, false);
});

test('the progress denominator includes dust still underground and completion waits for all of it', () => {
  const goal = createGoal('gather', 48),
    p = goal.islands[0];
  const sim = {
    grains: Array.from({ length: 100 }, () => ({ ...p })),
    emitted: 100,
    remaining: 200,
    config: { supply: 300 },
  };
  assert.ok(Math.abs(evaluateGoal(sim, goal).fit - 1 / 3) < 1e-9);
  assert.equal(evaluateGoal(sim, goal).complete, false);
  sim.emitted = 200;
  sim.remaining = 100;
  sim.grains.push(...Array.from({ length: 100 }, () => ({ x: 80, y: 190 })));
  assert.ok(Math.abs(evaluateGoal(sim, goal).fit - 1 / 3) < 1e-9);
});

test('the clear target covers a real well, and one heap cannot satisfy a whole pattern', () => {
  for (const seed of [48, 2026, 914]) {
    const sim = new UpwellingSimulation({ seed }),
      clear = createGoal('clear', seed);
    assert.ok(
      Math.hypot(
        clear.patch.x - sim.wells[1].x,
        clear.patch.y - sim.wells[1].y,
      ) < 22,
    );
  }
  const sim = {
    grains: Array.from({ length: 100 }, () => ({ x: 80, y: 100 })),
    emitted: 100,
    remaining: 0,
    config: { supply: 100 },
  };
  for (const type of ['level', 'paths'])
    assert.ok(evaluateGoal(sim, createGoal(type, 48)).fit < 0.1);
});

test('circular targets score actual grain positions at their visible rims', () => {
  const goal = createGoal('gather', 48),
    p = goal.islands[0];
  const sim = {
    grains: [{ x: p.x + 14.99, y: p.y }],
    emitted: 1,
    remaining: 0,
    config: { supply: 3 },
  };
  assert.ok(evaluateGoal(sim, goal).fit > 0.3);
  sim.grains[0].x = p.x + 15.01;
  assert.equal(evaluateGoal(sim, goal).fit, 0);
});

test('a purposeful policy changes a real deposit through the public brush API without adding material', () => {
  const sim = new UpwellingSimulation({ seed: 48 });
  advance(sim, 2400);
  const goal = createGoal('gather', 48),
    before = evaluateGoal(sim, goal).fit;
  const stroke = chooseStroke(sim, goal, 'purposeful', seededRandom(48));
  assert.ok(stroke);
  performStroke(sim, stroke);
  advance(sim, 120);
  assert.ok(evaluateGoal(sim, goal).fit > before + 0.01);
  assert.ok(sim.brushFeedback.serial > 0);
  conserved(sim);
});
