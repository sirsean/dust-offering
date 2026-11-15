import { test, expect } from '@playwright/test';
import { open, stroke, hidden } from './helpers.js';

async function pixels(page, x, y) {
  return page.evaluate(
    ({ x, y }) => {
      const r = dust.renderer,
        px = Math.round(x * r.scale),
        py = Math.round(y * r.scale);
      return {
        actual: [...r.ctx.getImageData(px, py, 1, 1).data],
        landscape: [
          ...r.background.getContext('2d').getImageData(px, py, 1, 1).data,
        ],
      };
    },
    { x, y },
  );
}

test('the entire stone starts invisible, local brushing deepens its reveal, and discovery survives fading and resize until Reset', async ({
  page,
}) => {
  await open(page, 'challenge=stone-offering-v6');
  await page.clock.runFor(100);
  for (const [x, y] of [
    [80, 7],
    [30, 150],
    [130, 150],
    [80, 175],
    [80, 100],
  ]) {
    const p = await pixels(page, x, y);
    expect(p.actual).toEqual(p.landscape);
  }
  expect(await page.evaluate(() => dust.sim.discovery.active.size)).toBe(0);
  await page.screenshot({ path: test.info().outputPath('hidden-stone.png') });
  await stroke(page, [80.5, 65.5], [80.5, 145.5]);
  await page.clock.runFor(100);
  const once = await page.evaluate(() =>
    dust.sim.discovery.levelAt(80.5, 100.5),
  );
  expect(once).toBeGreaterThan(0.6);
  expect(once).toBeLessThan(0.8);
  const p = await pixels(page, 84, 100);
  expect(p.actual).not.toEqual(p.landscape);
  for (let i = 0; i < 2; i++) await stroke(page, [80.5, 65.5], [80.5, 145.5]);
  await page.clock.runFor(100);
  expect(
    await page.evaluate(() => dust.sim.discovery.levelAt(80.5, 100.5)),
  ).toBe(1);
  const elsewhere = await pixels(page, 110, 120);
  expect(elsewhere.actual).toEqual(elsewhere.landscape);
  await page.screenshot({ path: test.info().outputPath('brush-reveal.png') });
  const snapshot = await page.evaluate(() =>
    JSON.stringify(dust.sim.discovery.snapshot()),
  );
  await page.clock.runFor(90000);
  expect(
    await page.evaluate(() => JSON.stringify(dust.sim.discovery.snapshot())),
  ).toBe(snapshot);
  expect(
    await page.evaluate(() => dust.sim.surface.strengthAt(80.5, 100.5)),
  ).toBe(0);
  const uncovered = await pixels(page, 80, 100);
  expect(uncovered.actual).not.toEqual(uncovered.landscape);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.runFor(100);
  expect((await pixels(page, 80, 100)).actual).not.toEqual(uncovered.landscape);
  await hidden(page, true);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(1000);
  expect(
    await page.evaluate(() => JSON.stringify(dust.sim.discovery.snapshot())),
  ).toBe(snapshot);
  await hidden(page, false);
  await page.locator('#reset').click();
  await page.clock.runFor(100);
  expect(await page.evaluate(() => dust.sim.discovery.active.size)).toBe(0);
  const reset = await pixels(page, 80, 100);
  expect(reset.actual).toEqual(reset.landscape);
});

test('sand alone gradually reveals its contact patch, while untouched parts of the triangle remain invisible', async ({
  page,
}) => {
  await open(page, 'challenge=stone-offering-v6');
  await page.clock.runFor(100);
  await page.evaluate(() => {
    const grain = dust.sim.addGrain(90.5, 110.5);
    dust.sim.emitted++;
    dust.sim.remaining--;
    dust.sim.anchor(grain, 'stone');
  });
  await page.clock.runFor(200);
  const early = await page.evaluate(() =>
    dust.sim.discovery.levelAt(90.5, 110.5),
  );
  expect(early).toBeGreaterThan(0);
  expect(early).toBeLessThan(0.1);
  await page.clock.runFor(4500);
  expect(
    await page.evaluate(() => dust.sim.discovery.levelAt(90.5, 110.5)),
  ).toBe(1);
  const contact = await pixels(page, 91.8, 110.5);
  expect(contact.actual).not.toEqual(contact.landscape);
  expect(await page.evaluate(() => dust.sim.discovery.levelAt(70, 110))).toBe(
    0,
  );
  const untouched = await pixels(page, 70, 110);
  expect(untouched.actual).toEqual(untouched.landscape);
  expect(await page.evaluate(() => dust.sim.surface.active.size)).toBe(0);
  await page.screenshot({ path: test.info().outputPath('grain-reveal.png') });
});
