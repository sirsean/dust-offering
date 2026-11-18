import { test, expect } from '@playwright/test';

async function open(page, goal = 'gather') {
  await page.clock.install();
  await page.goto(`/lab.html?debug&seed=48&goal=${goal}`);
  await page.waitForFunction(() => window.stoneStudy);
  await page.evaluate(() => document.fonts.ready);
}
async function freeze(page, value = true) {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', { value, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, value);
}

test('top-down study enters directly, wells change places, and all surfaced grains remain when paused', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page);
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.getByText('Left bowl')).toHaveCount(0);
  const start = await page.evaluate(() => ({
    emitted: window.stoneStudy.sim.emitted,
    well: window.stoneStudy.sim.activeWell,
  }));
  expect(start.emitted).toBeGreaterThan(400);
  await page.clock.runFor(16000);
  const mid = await page.evaluate(() => ({
    emitted: window.stoneStudy.sim.emitted,
    well: window.stoneStudy.sim.activeWell,
  }));
  expect(mid.emitted).toBeGreaterThan(start.emitted);
  expect(mid.well).not.toEqual(start.well);
  await page.locator('#pause').click();
  const pausedEmitted = await page.evaluate(
    () => window.stoneStudy.sim.emitted,
  );
  await page.clock.runFor(5000);
  const before = await page.evaluate(() => window.stoneStudy.sim.snapshot());
  await page.clock.runFor(3000);
  expect(await page.evaluate(() => window.stoneStudy.sim.snapshot())).toEqual(
    before,
  );
  expect(await page.evaluate(() => window.stoneStudy.sim.emitted)).toBe(
    pausedEmitted,
  );
  await page.locator('#pause').click();
  await page.clock.runFor(40000);
  expect(await page.evaluate(() => window.stoneStudy.sim.remaining)).toBe(0);
  expect(await page.evaluate(() => window.stoneStudy.sim.grains.length)).toBe(
    3600,
  );
  await expect(page.locator('#material')).toHaveText('All dust surfaced');
  expect(errors).toEqual([]);
});

test('native fingers push sand independently and releasing one does not cancel the other', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'phone', 'Native touch viewport only');
  await open(page);
  await page.evaluate(() => {
    while (window.stoneStudy.sim.time < 40) window.stoneStudy.sim.step();
  });
  await freeze(page);
  const before = await page.evaluate(() => window.stoneStudy.sim.snapshot());
  const points = await page.evaluate(() =>
    window.stoneStudy.sim.wells.slice(0, 2),
  );
  const rect = await page.locator('#field').boundingBox();
  const p = (point, id) => ({
    x: rect.x + (point.x / 160) * rect.width,
    y: rect.y + (point.y / 200) * rect.height,
    id,
  });
  const client = await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [p(points[0], 1), p(points[1], 2)],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      p({ x: points[0].x - 15, y: points[0].y + 15 }, 1),
      p({ x: points[1].x + 15, y: points[1].y + 15 }, 2),
    ],
  });
  await page.clock.runFor(100);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [p({ x: points[1].x + 15, y: points[1].y + 15 }, 2)],
  });
  expect(
    await page.evaluate(() => window.stoneStudy.renderer.brushes.size),
  ).toBe(1);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [p({ x: points[1].x + 25, y: points[1].y + 20 }, 2)],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  expect(
    await page.evaluate(() => window.stoneStudy.renderer.brushes.size),
  ).toBe(0);
  expect(
    await page.evaluate(() => window.stoneStudy.sim.brushStrokes.size),
  ).toBe(0);
  const after = await page.evaluate(() => window.stoneStudy.sim.snapshot());
  expect(after.length).toBe(before.length);
  expect(
    after.filter(
      (g, i) => Math.hypot(g.x - before[i].x, g.y - before[i].y) > 0.1,
    ).length,
  ).toBeGreaterThan(200);
});

test('goal comparisons share a seeded shower, restart repeats it, and a new stone changes it', async ({
  page,
}) => {
  await open(page);
  await freeze(page);
  await page.locator('#restart').click();
  const before = await page.evaluate(() => window.stoneStudy.sim.snapshot());
  for (const type of ['level', 'clear', 'paths', 'gather']) {
    await page.locator(`[data-goal="${type}"]`).click();
    expect(await page.evaluate(() => window.stoneStudy.sim.snapshot())).toEqual(
      before,
    );
    await expect(page.locator(`[data-goal="${type}"]`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }
  await page.locator('#guide').click();
  expect(await page.evaluate(() => window.stoneStudy.renderer.showGuide)).toBe(
    false,
  );
  await page.locator('#restart').click();
  expect(await page.evaluate(() => window.stoneStudy.sim.snapshot())).toEqual(
    before,
  );
  await page.locator('#next').click();
  expect(await page.evaluate(() => window.stoneStudy.sim.config.seed)).not.toBe(
    48,
  );
  expect(
    await page.evaluate(() => window.stoneStudy.sim.brushStrokes.size),
  ).toBe(0);
});

test('the study fits narrow, landscape and desktop screens, and rotation preserves the arrangement', async ({
  page,
}) => {
  await open(page);
  await page.clock.runFor(1000);
  await freeze(page);
  const before = await page.evaluate(() => window.stoneStudy.sim.snapshot());
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.clock.runFor(100);
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      canvas: document.querySelector('#field').getBoundingClientRect().toJSON(),
      buttons: [...document.querySelectorAll('button')].map((b) => ({
        height: b.getBoundingClientRect().height,
        right: b.getBoundingClientRect().right,
        scroll: b.scrollWidth,
        width: b.clientWidth,
      })),
    }));
    expect(layout.overflow).toBe(false);
    expect(layout.canvas.height).toBeGreaterThan(180);
    expect(
      layout.buttons.every(
        (b) =>
          b.height >= 44 &&
          b.right <= viewport.width + 1 &&
          b.scroll <= b.width + 1,
      ),
    ).toBe(true);
    expect(await page.evaluate(() => window.stoneStudy.sim.snapshot())).toEqual(
      before,
    );
  }
});
