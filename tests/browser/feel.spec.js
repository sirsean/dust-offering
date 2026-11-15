import { test, expect } from '@playwright/test';
import { open, stroke, hidden, state } from './helpers.js';

test('the opening has tangible sand for a first swipe, with physical feedback and a clean prepared reset', async ({
  page,
}) => {
  await open(page);
  await expect(page.locator('#hint')).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        dust.sim.grains.filter(
          (g) => g.y > 65 && g.y < 155 && Math.abs(g.x - 80) < 25,
        ).length,
    ),
  ).toBeGreaterThan(40);
  await hidden(page, true);
  const before = await state(page);
  const positions = await page.evaluate(() => dust.sim.snapshot());
  const pile = await page.evaluate(() => {
    const g = dust.sim.grains.find((g) => g.bond && g.y > 70 && g.y < 150);
    return { x: g.x, y: g.y };
  });
  await stroke(
    page,
    [pile.x, pile.y],
    [pile.x - 15, Math.min(170, pile.y + 35)],
  );
  const response = await page.evaluate(
    (old) => ({
      moved: dust.sim.grains.filter(
        (g, i) => Math.hypot(g.x - old[i].x, g.y - old[i].y) > 0.1,
      ).length,
      feedback: dust.sim.brushFeedback,
      active: dust.sim.brushStrokes.size,
    }),
    positions,
  );
  expect(response.moved).toBeGreaterThan(10);
  expect(response.feedback.serial).toBeGreaterThan(0);
  expect(response.active).toBe(0);
  expect((await state(page)).retained).toBe(before.retained);
  await hidden(page, false);
  await page.clock.runFor(100);
  await page.screenshot({
    path: test.info().outputPath('first-material-swipe.png'),
  });
  await hidden(page, true);
  await page.locator('#reset').click();
  expect(await page.evaluate(() => dust.sim.time)).toBe(9);
  expect(await page.evaluate(() => dust.sim.discovery.active.size)).toBe(0);
  expect((await state(page)).spill).toBe(0);
  expect((await state(page)).retained).toBeGreaterThan(100);
  expect(await page.evaluate(() => dust.sim.brushStrokes.size)).toBe(0);
});

test('real arrivals produce brief bowl feedback; material audio requires Sound opt-in and mutes cleanly', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, 'challenge=stone-offering-v7');
  await page.clock.runFor(100);
  const rim = () =>
    page.evaluate(() => {
      const r = dust.renderer,
        s = r.scale;
      return [
        ...r.ctx.getImageData(
          Math.round(40 * s),
          Math.round(177 * s),
          Math.round(5 * s),
          Math.round(3 * s),
        ).data,
      ];
    });
  const original = await rim();
  expect(await page.evaluate(() => dust.audio.context)).toBeNull();
  await page.evaluate(() => {
    dust.sim.addGrain(42.5, 180.9, 0, 16);
    dust.sim.emitted++;
    dust.sim.remaining--;
  });
  await page.clock.runFor(100);
  expect((await state(page)).left).toBe(1);
  expect(await page.evaluate(() => dust.sim.lastCollections[0].x)).toBe(42.5);
  expect(await rim()).not.toEqual(original);
  expect(await page.evaluate(() => dust.audio.context)).toBeNull();
  await page.clock.runFor(1000);
  expect(await rim()).toEqual(original);
  await page.locator('#sound').click();
  expect(await page.evaluate(() => dust.audio.enabled)).toBe(true);
  expect(await page.evaluate(() => dust.audio.context.state)).toBe('running');
  await page.evaluate(() => {
    const grain = dust.sim.addGrain(80.5, 110.5);
    dust.sim.anchor(grain, 'stone');
    dust.sim.emitted++;
    dust.sim.remaining--;
  });
  await stroke(page, [80.5, 105.5], [90.5, 130.5]);
  await page.clock.runFor(200);
  expect(await page.evaluate(() => dust.audio.brushEvents)).toBeGreaterThan(0);
  await hidden(page, true);
  await expect
    .poll(() => page.evaluate(() => dust.audio.textureGain.gain.value))
    .toBe(0);
  await hidden(page, false);
  await page.locator('#sound').click();
  expect(await page.evaluate(() => dust.audio.enabled)).toBe(false);
  expect(await page.evaluate(() => dust.audio.context.state)).toBe('suspended');
  expect(errors).toEqual([]);
});

test('uncovering the stone completes a visible goal without interruption and permits a fresh offering', async ({
  page,
}) => {
  await open(page);
  await expect(page.locator('#discovery-status')).toBeVisible();
  await expect(page.locator('#discovery-progress')).toBeVisible();
  await page.locator('#pour').click();
  for (let y = 10; y <= 175; y += 8) await stroke(page, [0, y], [160, y], 4);
  await page.clock.runFor(200);
  await expect(page.locator('#discovery-status')).toHaveText('Stone found');
  await expect(page.locator('#reset')).toHaveText('New stone');
  expect(
    await page.evaluate(() => dust.game.discovery.coverage),
  ).toBeGreaterThanOrEqual(0.82);
  expect(await page.evaluate(() => dust.game.phase)).toBe('running');
  expect(
    await page.evaluate(() => document.querySelector('#result').open),
  ).toBe(false);
  await page.screenshot({ path: test.info().outputPath('stone-found.png') });
  await page.clock.runFor(5000);
  await expect(page.locator('#discovery-status')).toHaveText('Stone found');
  await hidden(page, true);
  await page.locator('#reset').click();
  expect(await page.evaluate(() => dust.game.discovery.coverage)).toBe(0);
  await expect(page.locator('#reset')).toHaveText('Reset');
  await expect(page.locator('#discovery-status')).toHaveText('Uncovered 0%');
  expect((await state(page)).retained).toBeGreaterThan(100);
});
