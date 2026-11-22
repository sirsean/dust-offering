import { test, expect } from '@playwright/test';
import { piles } from '../../src/config/piles.js';
import { levelFor } from '../../src/piles/levels.js';
import { bankedStrokes } from '../fixtures/piles.js';
import { stroke } from './helpers.js';

async function open(page, query = '') {
  await page.clock.install({ time: new Date('2026-11-22T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-22T00:00:01Z'));
  await page.goto(`/piles.html?debug&${query}`);
  await expect(page.locator('#offering')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function waitForDust(page, duration) {
  await page.clock.runFor(duration);
  await expect(page.locator('#pause')).toHaveText('Wells quiet');
}

async function discovery(page) {
  return page.evaluate(() => window.pileStudy.game.sim.discovery.snapshot());
}

async function stonePixel(page, x, y) {
  return page.evaluate(
    ({ x, y }) => {
      const { renderer, game } = window.pileStudy;
      const read = (context) => [
        ...context.getImageData(
          Math.round(x * renderer.scale),
          Math.round(y * renderer.scale),
          1,
          1,
        ).data,
      ];
      return {
        level: game.sim.discovery.levelAt(x, y),
        actual: read(renderer.ctx),
        ground: read(renderer.background.getContext('2d')),
        masked: read(renderer.stoneContext),
      };
    },
    { x, y },
  );
}

test('sand and fingers uncover only touched stone, which stays visible through restart', async ({
  page,
}) => {
  await open(page);
  expect(await discovery(page)).toEqual([]);
  for (const [x, y] of [
    [80, 7],
    [80, 50],
    [80, 175],
    [153, 175],
  ]) {
    const pixel = await stonePixel(page, x, y);
    expect(pixel.actual).toEqual(pixel.ground);
  }
  await page.screenshot({ path: test.info().outputPath('hidden-stone.png') });

  await page.clock.runFor(500);
  const early = await stonePixel(page, 80, 74);
  expect(early.level).toBeGreaterThan(0);
  expect(early.masked[3]).toBeGreaterThan(0);
  await page.clock.runFor(1500);
  expect((await stonePixel(page, 80, 74)).level).toBeGreaterThan(early.level);
  expect((await stonePixel(page, 80, 50)).level).toBe(0);

  await stroke(page, [80, 34], [80, 60]);
  await page.clock.runFor(50);
  const swept = await stonePixel(page, 80, 50);
  expect(swept.level).toBeGreaterThan(0.5);
  expect(swept.actual).not.toEqual(swept.ground);
  const untouched = await stonePixel(page, 153, 175);
  expect(untouched.actual).toEqual(untouched.ground);
  await page.screenshot({
    path: test.info().outputPath('uncovered-stone.png'),
  });

  const before = await discovery(page);
  await page.locator('#restart').click();
  expect(await discovery(page)).toEqual(before);
  const restarted = await stonePixel(page, 80, 50);
  expect(restarted.actual).not.toEqual(restarted.ground);
});

test('native touch advances in order through the first generated offering and story record, then resumes after reload', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'phone', 'Native touch viewport only');
  await open(page);
  const client = await context.newCDPSession(page);
  const next = page.locator('#next');
  const board = page.locator('#field');
  for (let number = 1; number <= 5; number++) {
    const level = levelFor(piles.defaultSeed, number);
    if (number === 3) await page.setViewportSize({ width: 520, height: 600 });
    await expect(page.locator('#offering')).toHaveText(`Offering ${number}`);
    await expect(next).toBeDisabled();
    const rect = await board.boundingBox();
    await waitForDust(page, 5000 + (number - 1) * 4500);
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
      if (number === 1 && strokeIndex === 0) {
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
    await expect(page.locator('#status')).toHaveText('Offering complete');
    expect(await board.boundingBox()).toEqual(rect);
    await expect(page.locator('#offering')).toHaveText(`Offering ${number}`);
    await expect(next).toBeEnabled();
    await page.screenshot({ path: info.outputPath(`${level.id}.png`) });
    const uncovered = await discovery(page);
    expect(uncovered.length).toBeGreaterThan(100);
    if (number === 5) {
      await expect(next).toHaveText('Read record');
      await next.click();
      const record = page.getByRole('dialog');
      await expect(record).toBeVisible();
      await expect(record.getByRole('heading')).toHaveText('The receipt');
      await expect(record).toContainText('Pyramid Order');
      await expect(page.locator('#offering')).toHaveText('Offering 5');
      const steps = () => page.evaluate(() => window.pileStudy.game.sim.steps);
      const paused = await steps();
      await page.clock.runFor(1000);
      expect(await steps()).toBe(paused);
      expect(await board.boundingBox()).toEqual(rect);
      await page.screenshot({ path: info.outputPath('the-receipt.png') });
      await page.keyboard.press('Escape');
      await expect(record).toBeHidden();
      await expect(page.locator('#offering')).toHaveText('Offering 5');
      await next.click();
      await record.getByRole('button', { name: 'Continue' }).click();
      await expect(record).toBeHidden();
    } else {
      await next.click();
    }
    expect(await discovery(page)).toEqual(uncovered);
  }
  await expect(page.locator('#offering')).toHaveText('Offering 6');
  await expect(next).toBeDisabled();
  const saved = await discovery(page);
  await page.reload();
  await expect(page.locator('#offering')).toHaveText('Offering 6');
  expect(await discovery(page)).toEqual(saved);
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

test('a new seed starts at the beginning, with no selector or URL shortcut, and the controls fit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, 'seed=scablands&stone=three-islands&level=5000');
  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('#offering')).toHaveText('Offering 1');
  await expect(page.locator('#status')).toHaveText('0 / 1 ready');
  await expect(page.locator('#next')).toBeDisabled();
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
  await expect(page.locator('#offering')).toHaveText('Offering 1');
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.querySelector('#field').clientHeight,
      controlsFit: [...document.querySelectorAll('.piles button')].every(
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
