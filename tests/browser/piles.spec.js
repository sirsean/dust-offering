import { test, expect } from '@playwright/test';
import { pileLevels } from '../../src/config/piles.js';
import { bankedStrokes } from '../fixtures/piles.js';

async function open(page, query = '') {
  await page.clock.install({ time: new Date('2026-11-22T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-22T00:00:01Z'));
  await page.goto(`/piles.html?debug&${query}`);
  await expect(page.locator('#stone')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function waitForDust(page, duration) {
  await page.clock.runFor(duration);
  await expect(page.locator('#pause')).toHaveText('Wells quiet');
}

test('native touch completes every stone in order and leaves the arrangement available for inspection', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'phone', 'Native touch viewport only');
  await open(page);
  const client = await context.newCDPSession(page);
  const next = page.locator('#next');
  const board = page.locator('#field');
  for (const [index, level] of pileLevels.entries()) {
    if (index === 2) await page.setViewportSize({ width: 520, height: 600 });
    await expect(page.locator('#stone')).toHaveValue(level.id);
    await expect(next).toBeDisabled();
    const rect = await board.boundingBox();
    await waitForDust(page, 5000 + index * 4500);
    expect(await board.boundingBox()).toEqual(rect);
    const point = (x, y) => ({
      x: rect.x + (x / 160) * rect.width,
      y: rect.y + (y / 200) * rect.height,
      id: 1,
    });
    const strokes = bankedStrokes(level);
    for (const [strokeIndex, { a, b }] of strokes.entries()) {
      if (await next.isEnabled()) break;
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [point(a.x, a.y)],
      });
      const samples = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2.5);
      for (let step = 1; step <= samples; step++) {
        const t = step / samples;
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)],
        });
        await page.clock.runFor(18);
      }
      await expect(next).toBeDisabled();
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await page.clock.runFor(900);
      if (index === 0 && strokeIndex === 0) {
        await expect(page.locator('#status')).toHaveText('0 / 1 ready');
        await expect(next).toBeDisabled();
      }
    }
    const played = await page.evaluate(() => {
      const { game } = window.pileStudy;
      return {
        counts: game.counts,
        emitted: game.sim.emitted,
        retained: game.sim.grains.length,
        remaining: game.sim.remaining,
      };
    });
    expect(played.emitted).toBe(played.retained);
    expect(played.remaining).toBe(0);
    console.log(level.id, played.counts);
    await expect(page.locator('#status')).toHaveText('Stone complete');
    expect(await board.boundingBox()).toEqual(rect);
    await expect(page.locator('#stone')).toHaveValue(level.id);
    await expect(next).toBeEnabled();
    await page.screenshot({ path: info.outputPath(`${level.id}.png`) });
    await next.click();
  }
  await expect(page.locator('#stone')).toHaveValue(pileLevels[0].id);
  await expect(next).toBeDisabled();
});

test('a viewport resize keeps the painted board until the new size can be drawn', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 680 });
  await open(page);
  await page.clock.runFor(150);
  const board = page.locator('#field');
  const before = await board.evaluate((field) => {
    const cssWidth = field.getBoundingClientRect().width;
    const bitmap = () => ({
      width: field.width,
      pixel: [...field.getContext('2d').getImageData(20, 20, 1, 1).data],
    });
    window.resizeSample = new Promise((resolve) => {
      const observer = new ResizeObserver(() => {
        if (field.getBoundingClientRect().width === cssWidth) return;
        observer.disconnect();
        resolve(bitmap());
      });
      observer.observe(field);
    });
    return bitmap();
  });
  expect(before.pixel[3]).toBe(255);

  await page.setViewportSize({ width: 390, height: 620 });
  expect(await page.evaluate(() => window.resizeSample)).toEqual(before);
  await page.clock.runFor(50);
  const resized = await board.evaluate((field) => ({
    width: field.width,
    expectedWidth: Math.round(
      field.getBoundingClientRect().width * Math.min(devicePixelRatio, 2),
    ),
    alpha: field.getContext('2d').getImageData(20, 20, 1, 1).data[3],
  }));
  expect(resized.width).toBeLessThan(before.width);
  expect(resized.width).toBe(resized.expectedWidth);
  expect(resized.alpha).toBe(255);
});

test('a direct stone link, replay, pause, and narrow layout work through the playtest page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, 'stone=three-islands');
  await expect(page.locator('#stone')).toHaveValue('three-islands');
  await expect(page.locator('#status')).toHaveText('0 / 3 ready');
  await page.locator('#pause').click();
  const remaining = await page.evaluate(
    () => window.pileStudy.game.sim.remaining,
  );
  await page.clock.runFor(800);
  expect(await page.evaluate(() => window.pileStudy.game.sim.remaining)).toBe(
    remaining,
  );
  await page.locator('#restart').click();
  await expect(page.locator('#pause')).toHaveText('Pause wells');
  await page.locator('#stone').selectOption('two-sides');
  await expect(page.locator('#status')).toHaveText('0 / 2 ready');
  await expect(page).toHaveURL(/stone=two-sides/);
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.querySelector('#field').clientHeight,
      controlsFit: [...document.querySelectorAll('button,select')].every(
        (element) =>
          element.getBoundingClientRect().height >= 44 &&
          element.scrollWidth <= element.clientWidth + 1,
      ),
    }));
    expect(layout.width).toBe(viewport.width);
    expect(layout.height).toBeGreaterThan(240);
    expect(layout.controlsFit).toBe(true);
  }
});
