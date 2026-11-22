import { test, expect } from '@playwright/test';
import { pileLevels } from '../../src/config/piles.js';
import { pileStrokes } from '../fixtures/piles.js';

async function open(page, query = '') {
  await page.clock.install();
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
    await expect(page.locator('#stone')).toHaveValue(level.id);
    await expect(next).toBeDisabled();
    await waitForDust(page, 5000 + index * 4500);
    const rect = await board.boundingBox();
    const point = (x, y) => ({
      x: rect.x + (x / 160) * rect.width,
      y: rect.y + (y / 200) * rect.height,
      id: 1,
    });
    for (const { a, b } of pileStrokes(level)) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [point(a.x, a.y)],
      });
      for (let step = 1; step <= 12; step++) {
        const t = step / 12;
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)],
        });
        await page.clock.runFor(36);
      }
      await expect(next).toBeDisabled();
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await page.clock.runFor(900);
    }
    await expect(page.locator('#status')).toHaveText('Stone complete');
    await expect(page.locator('#stone')).toHaveValue(level.id);
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
    await expect(next).toBeEnabled();
    await page.screenshot({ path: info.outputPath(`${level.id}.png`) });
    await next.click();
  }
  await expect(page.locator('#stone')).toHaveValue(pileLevels[0].id);
  await expect(next).toBeDisabled();
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
