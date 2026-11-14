import { test, expect } from '@playwright/test';

async function open(page, query = '') {
  await page.clock.install();
  await page.goto(`/?debug&${query}`);
  await expect(page.locator('#field')).toBeVisible();
  await page.waitForFunction(() => window.dust);
}
async function stroke(page, a, b, steps = 15) {
  const rect = await page.locator('#field').boundingBox();
  const p = {
    x: rect.x + (a[0] / 160) * rect.width,
    y: rect.y + (a[1] / 200) * rect.height,
  };
  const q = {
    x: rect.x + (b[0] / 160) * rect.width,
    y: rect.y + (b[1] / 200) * rect.height,
  };
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(q.x, q.y, { steps });
  await page.mouse.up();
}
async function layout(page) {
  await stroke(page, [50, 70], [110, 155]);
  await stroke(page, [96, 140], [38, 168]);
}
async function state(page) {
  return page.evaluate(() => ({
    left: dust.sim.left,
    right: dust.sim.right,
    spill: dust.sim.spill,
    face: dust.sim.grains.length,
    emitted: dust.sim.emitted,
    remaining: dust.sim.remaining,
    steps: dust.sim.steps,
    ridges: dust.sim.ridges.segments.length,
  }));
}

test('blank face spills, controls fit, fast strokes and live widening produce both paths', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= innerHeight &&
        document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const id of [
    'draw',
    'rub',
    'pour',
    'reset',
    'free',
    'challenge',
    'sound',
  ])
    expect(
      (await page.locator(`#${id}`).boundingBox()).height,
    ).toBeGreaterThanOrEqual(44);
  await page.clock.runFor(4000);
  expect((await state(page)).spill).toBeGreaterThan(100);
  await page.locator('#reset').click();
  await page.locator('#pour').click();
  await layout(page);
  await page.locator('#pour').click();
  await page.clock.runFor(5000);
  const before = await state(page);
  expect(before.right).toBeGreaterThan(200);
  expect(before.left).toBe(0);
  await page.locator('#rub').click();
  await stroke(page, [78, 108], [81, 112], 2);
  await page.clock.runFor(5000);
  const after = await state(page);
  expect(after.left).toBeGreaterThan(100);
  expect(after.right).toBeGreaterThan(before.right + 100);
  expect(after.spill).toBeLessThan(10);
  expect(after.emitted).toBe(
    after.left + after.right + after.spill + after.face,
  );
  await page.locator('#pour').click();
  const stopped = await state(page);
  await page.clock.runFor(1000);
  expect((await state(page)).emitted).toBe(stopped.emitted);
  expect((await state(page)).face).toBeLessThan(stopped.face);
  await page.screenshot({ path: test.info().outputPath('live-split.png') });
  expect(errors).toEqual([]);
});

test('full challenge, score, stored best, sharing fallback and repeatable Reset', async ({
  page,
}) => {
  await open(page, 'challenge=first-offering-v2');
  await expect(page.locator('#pour')).toHaveText('Begin');
  await layout(page);
  await page.locator('#rub').click();
  await stroke(page, [78, 109.667], [80.884, 113.752], 5);
  await page.clock.runFor(1000);
  expect((await state(page)).remaining).toBe(4800);
  await page.locator('#pour').click();
  await page.clock.runFor(45500);
  await expect(page.locator('#pour')).toHaveText('Finish');
  await expect(page.locator('#pour')).toBeEnabled();
  const final = await state(page);
  expect(final.emitted).toBe(4800);
  expect(final.left).toBeGreaterThan(1000);
  expect(final.right).toBeGreaterThan(2000);
  expect(final.remaining).toBe(0);
  expect(final.left + final.right + final.spill + final.face).toBe(4800);
  await page.locator('#pour').click();
  await expect(page.locator('#result')).toBeVisible();
  const score = await page.evaluate(() => dust.game.result.score);
  expect(score).toBeGreaterThan(800);
  expect(
    await page.evaluate(() =>
      localStorage.getItem('dust-offering:best:first-offering-v2'),
    ),
  ).toBe(String(score));
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
  await expect(page.locator('#manual-share')).toBeVisible();
  await expect(page.locator('#manual-share')).toHaveValue(
    /challenge=first-offering-v2/,
  );
  await page.screenshot({
    path: test.info().outputPath('challenge-result.png'),
  });
  await page.locator('#again').click();
  expect((await state(page)).remaining).toBe(4800);
  expect((await state(page)).ridges).toBe(0);
  expect((await state(page)).face).toBe(0);
  await page.reload();
  await expect(page.locator('#best')).toHaveText(`Best ${score}`);
  await expect(page.locator('#pour')).toHaveText('Begin');
});

test('resize, rotation, mode switches, source protection, hidden recovery and reduced motion preserve rules', async ({
  page,
}) => {
  await open(page);
  await page.locator('#pour').click();
  await layout(page);
  await page.clock.runFor(100);
  // Stop the frame clock as well as emission: Stop pour deliberately leaves
  // already-released grains moving, so comparing their positions during a
  // running resize would test the wrong behavior.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const before = await state(page);
  const grains = await page.evaluate(() => JSON.stringify(dust.sim.grains));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(100);
  expect((await state(page)).ridges).toBe(before.ridges);
  expect(await page.evaluate(() => JSON.stringify(dust.sim.grains))).toBe(
    grains,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await stroke(page, [75, 14], [85, 14]);
  expect((await state(page)).ridges).toBe(before.ridges);
  await stroke(page, [30, 181], [60, 181]);
  expect((await state(page)).ridges).toBe(before.ridges);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const steps = (await state(page)).steps;
  await page.clock.runFor(10000);
  expect((await state(page)).steps).toBe(steps);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(100);
  expect((await state(page)).steps - steps).toBeLessThanOrEqual(7);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => dust.renderer.reducedMotion.matches)).toBe(
    true,
  );
  for (let i = 0; i < 3; i++) {
    await page.locator('#challenge').click();
    await page.locator('#free').click();
  }
  expect((await state(page)).ridges).toBe(0);
  await expect(page.locator('#pour')).toHaveText('Stop pour');
});

test('touch strokes capture, cancellation ends edits, and another touch can draw', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'phone', 'Touch-enabled viewport only');
  await open(page);
  await page.locator('#pour').click();
  const rect = await page.locator('#field').boundingBox();
  const p = (x, y) => ({
    x: rect.x + (x / 160) * rect.width,
    y: rect.y + (y / 200) * rect.height,
    id: 1,
  });
  const client = await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [p(50, 70)],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [p(110, 155)],
  });
  expect(await page.evaluate(() => dust.renderer.brush !== null)).toBe(true);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchCancel',
    touchPoints: [],
  });
  expect(await page.evaluate(() => dust.renderer.brush)).toBe(null);
  const count = (await state(page)).ridges;
  expect(count).toBeGreaterThan(30);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [p(96, 140)],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [p(38, 168)],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  expect((await state(page)).ridges).toBeGreaterThan(count);
});

test('narrow phones, tablets and landscape layouts keep controls and the board on screen', async ({
  page,
}) => {
  await open(page, 'challenge=first-offering-v2');
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
    // ResizeObserver updates the canvas backing store on the browser's next
    // layout delivery, independently of Playwright's accelerated frame clock.
    await expect
      .poll(async () => {
        const bounds = await page.locator('#field').boundingBox();
        return bounds.y + bounds.height;
      })
      .toBeLessThanOrEqual(viewport.height);
    const canvas = await page.locator('#field').boundingBox();
    const controls = await page.locator('.tools').boundingBox();
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(viewport.height);
    expect(controls.y + controls.height).toBeLessThanOrEqual(viewport.height);
  }
});

test('denied local storage still permits play, and sound is an explicit muteable opt-in', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Denied', 'SecurityError');
      },
    }),
  );
  await open(page);
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await layout(page);
  await page.clock.runFor(4000);
  expect((await state(page)).right).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});
