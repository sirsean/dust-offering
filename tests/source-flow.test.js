import assert from 'node:assert/strict';
import test from 'node:test';
import { prototype } from '../src/config/prototype.js';
import { sourceFlow } from '../src/simulation/source-flow.js';
import { Simulation } from '../src/simulation/simulation.js';

test('the flow swells gently, stays bounded, and has brief interrupted sputters instead of a repeating minute', () => {
  for (const seed of [48, 2026, 914]) {
    const config = { ...prototype, seed };
    const rates = Array.from({ length: 10800 }, (_, i) =>
      sourceFlow(config, i / 60),
    );
    const peak = Math.max(...rates);
    assert.ok(peak > 32 && peak < 44);
    assert.equal(Math.min(...rates), 0);
    assert.ok(rates.filter((rate) => rate === 0).length > 300);
    for (let i = 1; i < 120; i++)
      assert.ok(Math.abs(rates[i] - rates[i - 1]) < 0.3);
    let longestGap = 0,
      gap = 0;
    for (const rate of rates) {
      assert.ok(rate >= 0 && rate < 44);
      gap = rate === 0 ? gap + 1 : 0;
      longestGap = Math.max(longestGap, gap);
    }
    assert.ok(longestGap >= 10 && longestGap < 30);
    assert.notDeepEqual(rates.slice(0, 3600), rates.slice(3600, 7200));
  }
});

test('source samples are seeded, order-independent and do not consume particle randomness', () => {
  const a = new Simulation(),
    b = new Simulation();
  const times = [0, 0.5, 7.2, 15, 33.1, 80, 124];
  const original = times.map((time) => sourceFlow(a.config, time));
  assert.deepEqual(
    times
      .toReversed()
      .map((time) => sourceFlow(a.config, time))
      .toReversed(),
    original,
  );
  assert.notDeepEqual(
    times.map((time) => sourceFlow({ ...a.config, seed: 2026 }, time)),
    original,
  );
  for (let i = 0; i < 100; i++) void a.sourceRate;
  assert.equal(a.random(), b.random());
  assert.equal(sourceFlow({ ...a.config, sourceRate: 0 }, 7.2), 0);
  assert.equal(sourceFlow({ ...a.config, sourceFlowVariation: 0 }, 7.2), 24);
});

test('the wider physical pour emits visibly different amounts and actual gaps without bursts or lost grains', () => {
  const sim = new Simulation({ stoneAdhesionRate: 0, sandAdhesionRate: 0 });
  const bins = Array(60).fill(0);
  let longestGap = 0,
    gap = 0;
  for (let step = 0; step < 3600; step++) {
    const before = sim.emitted;
    sim.step();
    const born = sim.emitted - before;
    assert.ok(born >= 0 && born <= 1);
    bins[Math.floor(step / 60)] += born;
    gap = born ? 0 : gap + 1;
    longestGap = Math.max(longestGap, gap);
    assert.equal(sim.blocked, false);
    assert.equal(sim.emitted, sim.left + sim.right + sim.grains.length);
  }
  assert.ok(Math.min(...bins) < 10);
  assert.ok(Math.max(...bins) > 32);
  assert.ok(longestGap > 12 && longestGap < 45);
});

test('paused or capped emission follows the same flow clock and resumes without stored-up sand', () => {
  const sim = new Simulation({ freePourCap: 1 });
  for (let i = 0; i < 120; i++) sim.step();
  assert.equal(sim.emitted, 1);
  assert.equal(sim.blockReason, 'full');
  sim.pouring = false;
  for (let i = 0; i < 1800; i++) sim.step();
  assert.equal(sim.emitted, 1);
  assert.equal(sim.sourceRate, sourceFlow(sim.config, sim.sourceTime));
  sim.config.freePourCap = 6000;
  sim.pouring = true;
  const before = sim.emitted;
  sim.step();
  assert.ok(sim.emitted - before <= 1);
  assert.ok(sim.emissionFraction < 1);
});
