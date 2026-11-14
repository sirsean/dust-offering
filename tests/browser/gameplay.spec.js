import { test, expect } from '@playwright/test';
import { open, stroke, hidden, state } from './helpers.js';

test('one gentle brush action shapes actual deposits, without Draw/Rub modes or blank-stone barriers', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, 'challenge=stone-offering-v2');
  await expect(page.locator('.tools button')).toHaveCount(2);
  await expect(
    page.getByRole('button', { name: 'Draw', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Rub', exact: true }),
  ).toHaveCount(0);
  await stroke(page, [80, 60], [95, 140]);
  expect((await state(page)).retained).toBe(0);
  await page.locator('#free').click();
  await page.clock.runFor(3000);
  const early = await state(page);
  expect(early.emitted).toBeLessThan(90);
  expect(
    await page.evaluate(() => Math.max(...dust.sim.grains.map((g) => g.y))),
  ).toBeLessThan(65);
  await page.clock.runFor(22000);
  const before = await state(page);
  expect(before.attached).toBeGreaterThan(60);
  expect(before.ground).toBeGreaterThan(20);
  await hidden(page, true);
  const mass = await state(page);
  const positions = await page.evaluate(() =>
    JSON.stringify(dust.sim.snapshot()),
  );
  await stroke(page, [78, 28], [90, 115]);
  const brushed = await state(page);
  expect(brushed.retained).toBe(mass.retained);
  expect(brushed.emitted).toBe(mass.emitted);
  expect(brushed.attached).toBeLessThan(mass.attached);
  expect(
    await page.evaluate(() => JSON.stringify(dust.sim.snapshot())),
  ).not.toBe(positions);
  await hidden(page, false);
  await page.clock.runFor(12000);
  const after = await state(page);
  expect(after.ground).toBeGreaterThan(20);
  expect(after.emitted).toBe(after.left + after.right + after.retained);
  expect(after.emitted).toBe(
    after.left + after.right + after.spill + after.face,
  );
  await page.screenshot({ path: test.info().outputPath('stone-sculpt.png') });
  expect(errors).toEqual([]);
});

test('Pause preserves visible bottom piles, loose sand keeps falling, and Reset clears everything', async ({
  page,
}) => {
  await open(page);
  await page.clock.runFor(30000);
  await page.locator('#pour').click();
  const before = await state(page);
  await expect(page.locator('#pour')).toHaveText('Resume');
  await page.clock.runFor(22000);
  const settled = await state(page);
  expect(settled.emitted).toBe(before.emitted);
  expect(settled.ground).toBeGreaterThan(40);
  expect(settled.attached).toBeGreaterThan(40);
  const groundIds = await page.evaluate(() =>
    dust.sim.grains.filter((g) => g.missed && g.sleeping).map((g) => g.id),
  );
  expect(groundIds.length).toBeGreaterThan(10);
  await page.clock.runFor(5000);
  expect(
    await page.evaluate(
      (ids) => ids.every((id) => dust.sim.grains.some((g) => g.id === id)),
      groundIds,
    ),
  ).toBe(true);
  await page.locator('#reset').click();
  await hidden(page, true);
  const reset = await state(page);
  expect(reset.spill).toBe(0);
  expect(reset.attached).toBe(0);
  expect(reset.retained).toBeLessThan(4);
  await expect(page.locator('#pour')).toHaveText('Pause pour');
});

test('new optional challenge retains scoring, isolated bests, sharing fallback and a repeatable fresh stone', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('dust-offering:best:stone-offering-v1', '999'),
  );
  await open(page, 'challenge=stone-offering-v2');
  await expect(page.locator('#best')).toHaveText('Best —');
  await expect(page.locator('#pour')).toHaveText('Begin');
  await page.clock.runFor(1000);
  expect((await state(page)).remaining).toBe(960);
  await page.locator('#pour').click();
  for (let i = 0; i < 3; i++) {
    await page.clock.runFor(10000);
    await stroke(page, [80, 28], [80, 65]);
  }
  await page.clock.runFor(32000);
  await expect(page.locator('#pour')).toHaveText('Finish');
  await expect(page.locator('#pour')).toBeEnabled();
  const final = await state(page);
  expect(final.remaining).toBe(0);
  expect(final.emitted).toBe(960);
  expect(final.left + final.right + final.retained).toBe(960);
  expect(final.spill).toBeGreaterThan(0);
  await page.locator('#pour').click();
  await expect(page.locator('#result')).toBeVisible();
  const score = await page.evaluate(() => dust.game.result.score);
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(1000);
  expect(
    await page.evaluate(() =>
      localStorage.getItem('dust-offering:best:stone-offering-v2'),
    ),
  ).toBe(String(score));
  expect(
    await page.evaluate(() =>
      localStorage.getItem('dust-offering:best:stone-offering-v1'),
    ),
  ).toBe('999');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw Error('denied');
        },
      },
    });
  });
  await page.locator('#share').click();
  await expect(page.locator('#manual-share')).toHaveValue(
    /challenge=stone-offering-v2/,
  );
  await expect(page.locator('#result-uncollected')).toContainText(
    'on the ground',
  );
  await page.screenshot({ path: test.info().outputPath('stone-result.png') });
  await page.locator('#again').click();
  expect((await state(page)).retained).toBe(0);
  expect((await state(page)).spill).toBe(0);
  await expect(page.locator('#pour')).toHaveText('Begin');
  await page.reload();
  await expect(page.locator('#best')).toHaveText(`Best ${score}`);
});

test('touch strokes cancel cleanly and release deposited sand without modes', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'phone', 'Touch-enabled viewport only');
  await open(page);
  await page.clock.runFor(18000);
  await hidden(page, true);
  const before = await state(page);
  const rect = await page.locator('#field').boundingBox();
  const p = (x, y) => ({
    x: rect.x + (x / 160) * rect.width,
    y: rect.y + (y / 200) * rect.height,
    id: 1,
  });
  const client = await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [p(80, 30)],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [p(86, 110)],
  });
  expect(await page.evaluate(() => dust.renderer.brushes.size > 0)).toBe(true);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchCancel',
    touchPoints: [],
  });
  expect(await page.evaluate(() => dust.renderer.brushes.size)).toBe(0);
  const after = await state(page);
  expect(after.retained).toBe(before.retained);
  expect(after.attached).toBeLessThan(before.attached);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [p(85, 80)],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  expect(await page.evaluate(() => dust.renderer.brushes.size)).toBe(0);
});

test('rotation and hidden recovery preserve bonded sand and ground piles; source and bowls are protected', async ({
  page,
}) => {
  await open(page);
  await page.clock.runFor(22000);
  await stroke(page, [65, 85], [65, 140]);
  await hidden(page, true);
  const before = await state(page);
  const snapshot = await page.evaluate(() =>
    JSON.stringify(dust.sim.snapshot()),
  );
  const coating = await page.evaluate(() =>
    JSON.stringify(dust.sim.surface.snapshot()),
  );
  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(100);
  expect(await page.evaluate(() => JSON.stringify(dust.sim.snapshot()))).toBe(
    snapshot,
  );
  expect(
    await page.evaluate(() => JSON.stringify(dust.sim.surface.snapshot())),
  ).toBe(coating);
  await stroke(page, [75, 14], [85, 14]);
  await stroke(page, [30, 181], [60, 181]);
  expect(
    await page.evaluate(() => JSON.stringify(dust.sim.surface.snapshot())),
  ).toBe(coating);
  expect(await page.evaluate(() => JSON.stringify(dust.sim.snapshot()))).toBe(
    snapshot,
  );
  await page.clock.runFor(10000);
  expect((await state(page)).steps).toBe(before.steps);
  await hidden(page, false);
  await page.clock.runFor(100);
  expect((await state(page)).steps - before.steps).toBeLessThanOrEqual(7);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => dust.renderer.reducedMotion.matches)).toBe(
    true,
  );
  for (let i = 0; i < 3; i++) {
    await page.locator('#challenge').click();
    await page.locator('#free').click();
  }
  expect((await state(page)).attached).toBe(0);
  await expect(page.locator('#pour')).toHaveText('Pause pour');
});

test('narrow phones and landscape fit, controls remain accessible, storage denial and mute are safe', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Denied', 'SecurityError');
      },
    }),
  );
  await open(page, 'challenge=stone-offering-v2');
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 640 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.clock.runFor(100);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    for (const id of ['pour', 'reset', 'sound', 'free', 'challenge'])
      expect(
        (await page.locator(`#${id}`).boundingBox()).height,
      ).toBeGreaterThanOrEqual(44);
  }
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});
