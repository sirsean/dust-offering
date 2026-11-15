import assert from 'node:assert/strict';
import test from 'node:test';
import { Air } from '../src/simulation/air.js';
import { Simulation } from '../src/simulation/simulation.js';
import { prototype } from '../src/config/prototype.js';
import { Game } from '../src/game/game.js';

test('fine dust is one fifth the diameter, with five times the flow, supply and retention room', () => {
  assert.equal(prototype.grainRadius, 0.65 / 5);
  assert.equal(prototype.sourceRate, 24 * 5);
  assert.equal(prototype.startingSupply, 960 * 5);
  assert.equal(prototype.freePourCap, 6000 * 5);
});

test('air is seeded and smooth in space/time, bounded, and independent of particle randomness', () => {
  const a = new Air(prototype),
    b = new Air(prototype),
    other = new Air({ ...prototype, seed: 2026 });
  const point = {};
  let last;
  for (let step = 0; step < 600; step++) {
    const time = step / 60;
    a.advanceTo(time);
    b.advanceTo(time);
    const sample = { ...a.sample(80, 100, point) };
    assert.deepEqual(sample, b.sample(80, 100, {}));
    assert.ok(Math.abs(sample.x) <= prototype.airSpeed);
    assert.ok(Math.abs(sample.y) <= prototype.airLift);
    const nearby = a.sample(80.001, 100.001, {});
    assert.ok(Math.hypot(sample.x - nearby.x, sample.y - nearby.y) < 0.001);
    if (last)
      assert.ok(Math.hypot(sample.x - last.x, sample.y - last.y) < 0.05);
    last = sample;
  }
  other.advanceTo(599 / 60);
  assert.notDeepEqual(last, other.sample(80, 100, {}));
  const sim = new Simulation(),
    control = new Simulation();
  for (let i = 0; i < 100; i++) {
    sim.air.advanceTo(i);
    sim.air.sample(50, 70, point);
  }
  assert.equal(sim.random(), control.random());
});

test('air gently drifts loose dust, acts more strongly on smaller grains, and cannot move attached grains', () => {
  function drift(radius, resistance) {
    const sim = new Simulation({
      sourceRate: 0,
      grainRadius: radius,
      airResistance: resistance,
      stoneAdhesionRate: 0,
      sandAdhesionRate: 0,
    });
    const grain = sim.addGrain(15, 20, 0, 3);
    const fixed = sim.addGrain(80, 100);
    sim.anchor(fixed, 'stone');
    sim.emitted = 2;
    for (let i = 0; i < 240; i++) {
      sim.step();
      assert.ok(Math.hypot(grain.vx, grain.vy) <= sim.config.maxSpeed + 1e-8);
    }
    assert.equal(fixed.x, 80);
    assert.equal(fixed.y, 100);
    assert.equal(sim.emitted, sim.left + sim.right + sim.grains.length);
    return grain;
  }
  const still = drift(0.13, 0),
    fine = drift(0.13, 0.16),
    coarse = drift(0.65, 0.16);
  assert.equal(still.x, 15);
  assert.ok(Math.abs(fine.x - 15) > 0.5);
  assert.ok(Math.abs(fine.x - 15) > Math.abs(coarse.x - 15));
  assert.ok(fine.y > 30 && fine.y < still.y);
});

test('waiting before Begin does not change the challenge breeze or its incoming grains', () => {
  const waited = new Game('challenge'),
    immediate = new Game('challenge');
  for (let i = 0; i < 600; i++) waited.step();
  waited.begin();
  immediate.begin();
  for (let i = 0; i < 300; i++) {
    waited.step();
    immediate.step();
  }
  const positions = (game) =>
    game.sim.grains.map(({ id, x, y, vx, vy, bond }) => ({
      id,
      x,
      y,
      vx,
      vy,
      bond,
    }));
  assert.deepEqual(positions(waited), positions(immediate));
});

test('the sparse hash resolves a fixed support in either insertion order and clears vacated bins', () => {
  for (const fixedFirst of [true, false]) {
    const sim = new Simulation({ sourceRate: 0 });
    const first = sim.addGrain(80, 100),
      second = sim.addGrain(80.1, 100);
    const fixed = fixedFirst ? first : second,
      loose = fixedFirst ? second : first;
    sim.anchor(fixed, 'stone');
    const x = fixed.x;
    sim.contacts();
    assert.equal(fixed.x, x);
    assert.ok(Math.abs(loose.x - fixed.x) >= 2 * sim.config.grainRadius - 1e-8);
    const oldCell = loose.cell;
    loose.x = 120;
    loose.y = 160;
    sim.release(fixed);
    fixed.x = 30;
    fixed.y = 150;
    sim.buildHash();
    assert.equal(sim.head[oldCell], -1);
    assert.equal(sim.grains.length, 2);
  }
});

test('cached fixed contacts match full rebuilds through births, attachments, collection and brushing', () => {
  const cached = new Simulation({ seed: 2026 }),
    rebuilt = new Simulation({ seed: 2026 });
  const contacts = rebuilt.contacts;
  rebuilt.contacts = function () {
    this.staticDirty = true;
    contacts.call(this);
  };
  for (let i = 0; i < 1800; i++) {
    if (i === 700 || i === 1200)
      for (const sim of [cached, rebuilt])
        sim.brush({ x: 70, y: 75 }, { x: 105, y: 165 });
    cached.step();
    rebuilt.step();
    if (i % 60 === 0) {
      assert.deepEqual(cached.snapshot(), rebuilt.snapshot());
      assert.equal(cached.left, rebuilt.left);
      assert.equal(cached.right, rebuilt.right);
      assert.equal(
        cached.emitted,
        cached.left + cached.right + cached.grains.length,
      );
    }
  }
  assert.ok(cached.left + cached.right > 0);
  assert.ok(cached.attachedCount > 0);
});
