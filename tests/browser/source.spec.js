import { test, expect } from '@playwright/test';
import { open, hidden, state } from './helpers.js';

test('dust enters from above without a top marker, sways gently, and preserves its phase through hiding and resizing', async ({
  page,
}) => {
  await open(page, 'challenge=stone-offering-v7');
  await page.clock.runFor(100);
  const top = await page.evaluate(() => {
    const r = dust.renderer,
      s = r.scale;
    const region = [
      Math.round(70 * s),
      Math.round(10 * s),
      Math.round(20 * s),
      Math.round(3 * s),
    ];
    return {
      actual: [...r.ctx.getImageData(...region).data],
      stone: [...r.background.getContext('2d').getImageData(...region).data],
    };
  });
  expect(top.actual).toEqual(top.stone);
  await page.locator('#pour').click();
  await page.clock.runFor(150);
  expect(await page.evaluate(() => dust.sim.grains.length)).toBeGreaterThan(0);
  expect(
    await page.evaluate(() =>
      dust.sim.grains.every((g) => g.y < -dust.sim.config.grainRadius),
    ),
  ).toBe(true);
  await page.clock.runFor(14850);
  expect(await page.evaluate(() => dust.sim.sourceX)).toBeGreaterThan(123);
  expect(
    await page.evaluate(() =>
      dust.sim.grains
        .filter((g) => g.y >= 0 && g.y < 2)
        .every((g) => g.x > 105),
    ),
  ).toBe(true);
  await page.screenshot({ path: test.info().outputPath('pour-right.png') });
  await page.locator('#pour').click();
  const count = (await state(page)).emitted;
  const before = await page.evaluate(() => dust.sim.sourceX);
  await page.clock.runFor(6000);
  expect((await state(page)).emitted).toBe(count);
  expect(await page.evaluate(() => dust.sim.sourceX)).toBeLessThan(before - 5);
  await hidden(page, true);
  const frozen = await page.evaluate(() => ({
    x: dust.sim.sourceX,
    time: dust.sim.sourceTime,
    rate: dust.sim.sourceRate,
  }));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(6000);
  expect(
    await page.evaluate(() => ({
      x: dust.sim.sourceX,
      time: dust.sim.sourceTime,
      rate: dust.sim.sourceRate,
    })),
  ).toEqual(frozen);
  await page.setViewportSize({ width: 390, height: 844 });
  await hidden(page, false);
  await page.clock.runFor(100);
  await page.locator('#pour').click();
  await page.clock.runFor(24000);
  expect(await page.evaluate(() => dust.sim.sourceX)).toBeLessThan(37);
  const arrivals = await page.evaluate(() =>
    dust.sim.grains.filter((g) => g.y >= 0 && g.y < 2).map((g) => g.x),
  );
  expect(arrivals.length).toBeGreaterThan(0);
  expect(Math.max(...arrivals)).toBeLessThan(55);
  const mass = await state(page);
  expect(mass.emitted).toBe(mass.left + mass.right + mass.retained);
  await page.screenshot({ path: test.info().outputPath('pour-left.png') });
  await page.locator('#challenge').click();
  expect(await page.evaluate(() => dust.sim.sourceTime)).toBe(0);
});

test('a broad stream swells, thins and briefly sputters while every grain stays accounted for', async ({
  page,
}) => {
  await open(page, 'challenge=stone-offering-v7');
  await page.evaluate(() => {
    window.pourSamples = [];
    const sim = dust.sim,
      emit = sim.emit;
    sim.emit = function () {
      const nextId = this.nextId,
        before = this.emitted;
      emit.call(this);
      if (this.sourceStartStep === null) return;
      window.pourSamples.push({
        time: this.sourceTime,
        born: this.emitted - before,
        offsets: this.grains
          .filter((grain) => grain.id >= nextId)
          .map((grain) => grain.x - this.sourceX),
      });
    };
  });
  await page.locator('#pour').click();
  await page.clock.runFor(36000);
  const samples = await page.evaluate(() => window.pourSamples);
  const bins = Array(36).fill(0);
  let gap = 0,
    longestGap = 0;
  for (const sample of samples) {
    if (sample.time >= 36) continue;
    bins[Math.floor(sample.time)] += sample.born;
    expect(sample.born).toBeLessThanOrEqual(1);
    gap = sample.born ? 0 : gap + 1;
    longestGap = Math.max(longestGap, gap);
  }
  const offsets = samples.flatMap((sample) => sample.offsets);
  expect(Math.max(...offsets) - Math.min(...offsets)).toBeGreaterThan(30);
  expect(Math.min(...bins)).toBeLessThan(10);
  expect(Math.max(...bins)).toBeGreaterThan(32);
  expect(longestGap).toBeGreaterThan(12);
  expect(longestGap).toBeLessThan(45);
  const mass = await state(page);
  expect(mass.emitted).toBe(mass.left + mass.right + mass.retained);
  await page.screenshot({ path: test.info().outputPath('variable-pour.png') });
});
