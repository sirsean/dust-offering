import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await mkdir('artifacts', { recursive: true });
async function stroke(a, b, steps = 18) {
  const rect = await page.locator('#field').boundingBox();
  await page.mouse.move(
    rect.x + (a[0] / 160) * rect.width,
    rect.y + (a[1] / 200) * rect.height,
  );
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await page.mouse.move(
      rect.x + ((a[0] + (b[0] - a[0]) * t) / 160) * rect.width,
      rect.y + ((a[1] + (b[1] - a[1]) * t) / 200) * rect.height,
    );
    await page.waitForTimeout(40);
  }
  await page.mouse.up();
}
async function state() {
  return page.evaluate(() => ({
    emitted: dust.sim.emitted,
    left: dust.sim.left,
    right: dust.sim.right,
    retained: dust.sim.grains.length,
    face: dust.sim.faceCount,
    attached: dust.sim.attachedCount,
    stone: dust.sim.grains.filter((g) => g.bond === 'stone').length,
    sand: dust.sim.grains.filter((g) => g.bond === 'sand').length,
    ground: dust.sim.spill,
    restingGround: dust.sim.grains.filter((g) => g.missed && g.sleeping).length,
    remaining: Number.isFinite(dust.sim.remaining) ? dust.sim.remaining : null,
  }));
}
const stressOnly = process.argv.includes('--stress-only');
const report = stressOnly
  ? JSON.parse(await readFile('artifacts/stone-playtest-report.json', 'utf8'))
  : {
      date: new Date().toISOString(),
      revision: '0.3.0 / stone-offering-v2',
      browser: browser.version(),
      node: process.version,
      viewport: '390 × 844, Linux headless Chromium, emulated touch',
      errors,
    };
try {
  await page.goto(`${base}/?debug`);
  await page.waitForFunction(() => window.dust);
  if (!stressOnly) {
    await page.waitForTimeout(25000);
    report.beforeBrush = await state();
    await page.screenshot({ path: 'artifacts/stone-before.png' });
    assert.ok(
      report.beforeBrush.attached > 60 &&
        report.beforeBrush.sand > report.beforeBrush.stone,
    );
    await page.locator('#pour').click();
    report.pausedEmitted = (await state()).emitted;
    await stroke([78, 28], [90, 115]);
    report.afterBrush = await state();
    assert.ok(report.afterBrush.attached < report.beforeBrush.attached);
    assert.equal(report.afterBrush.emitted, report.pausedEmitted);
    await page.waitForTimeout(16000);
    report.rested = await state();
    assert.ok(report.rested.attached > 0 && report.rested.restingGround > 20);
    assert.equal(
      report.rested.emitted,
      report.rested.left + report.rested.right + report.rested.retained,
    );
    await page.screenshot({ path: 'artifacts/stone-after.png' });
    console.log(
      JSON.stringify({
        phase: 'slow sand and one brush',
        before: report.beforeBrush,
        after: report.afterBrush,
        rested: report.rested,
      }),
    );
    await page.locator('#reset').click();
    await page.locator('#pour').click();
    const rect = await page.locator('#field').boundingBox();
    const point = (x, y, id) => ({
      x: rect.x + (x / 160) * rect.width,
      y: rect.y + (y / 200) * rect.height,
      id,
    });
    const touch = await context.newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [point(62, 70, 1), point(98, 70, 2)],
    });
    report.traceContacts = await page.evaluate(
      () => dust.renderer.brushes.size,
    );
    assert.equal(report.traceContacts, 2);
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [point(55, 140, 1), point(105, 140, 2)],
    });
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    const traces = () =>
      page.evaluate(() => ({
        left: dust.sim.surface.strengthAt(59, 100),
        right: dust.sim.surface.strengthAt(101, 100),
        middle: dust.sim.surface.strengthAt(80, 100),
        contacts: dust.renderer.brushes.size,
      }));
    report.twoFingerTraces = await traces();
    assert.ok(
      report.twoFingerTraces.left > 0.8 && report.twoFingerTraces.right > 0.8,
    );
    assert.equal(report.twoFingerTraces.middle, 0);
    assert.equal(report.twoFingerTraces.contacts, 0);
    await page.screenshot({ path: 'artifacts/stone-traces.png' });
    await stroke([62, 70], [55, 140]);
    await stroke([62, 70], [55, 140]);
    report.layeredTraces = await traces();
    assert.ok(report.layeredTraces.left > report.twoFingerTraces.left * 2.5);
    await page.screenshot({ path: 'artifacts/stone-layered-traces.png' });
    await page.waitForTimeout(6000);
    report.decayedTraces = await traces();
    assert.ok(report.decayedTraces.left < report.layeredTraces.left * 0.9);
    console.log(
      JSON.stringify({
        phase: 'two fingers, layering and decay',
        once: report.twoFingerTraces,
        layered: report.layeredTraces,
        afterSixSeconds: report.decayedTraces,
      }),
    );
    await page.locator('#challenge').click();
    await page.locator('#pour').click();
    const started = performance.now();
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(10000);
      await stroke([80, 28], [80, 65], 12);
      console.log(
        JSON.stringify({
          phase: 'gentle challenge shaping',
          state: await state(),
        }),
      );
    }
    await page.waitForFunction(() => dust.sim.remaining === 0, null, {
      timeout: 60000,
    });
    report.pourWallSeconds = (performance.now() - started) / 1000;
    await page.waitForFunction(() => dust.game.canFinish, null, {
      timeout: 25000,
    });
    report.challenge = await state();
    assert.equal(report.challenge.emitted, 960);
    assert.equal(
      report.challenge.left +
        report.challenge.right +
        report.challenge.retained,
      960,
    );
    await page.locator('#pour').click();
    report.result = await page.evaluate(() => dust.game.result);
    await page.screenshot({ path: 'artifacts/stone-result.png' });
    console.log(
      JSON.stringify({
        phase: 'new challenge complete',
        seconds: report.pourWallSeconds,
        result: report.result,
      }),
    );
    await page.locator('#result-close').click();
    await page.locator('#free').click();
  }
  await page.evaluate(async () => {
    const { Simulation } = await import('/src/simulation/simulation.js');
    const { fillStressScene } = await import('/src/config/stress-scene.js');
    const sim = new Simulation({ sourceRate: 0 });
    fillStressScene(sim);
    dust.game.sim = sim;
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    window.frameTimes = [];
    let last;
    function track(t) {
      if (last) frameTimes.push(t - last);
      last = t;
      if (frameTimes.length < 400) requestAnimationFrame(track);
    }
    requestAnimationFrame(track);
  });
  await page.waitForTimeout(3000);
  report.fullFaceFrames = await page.evaluate(() => {
    const sorted = frameTimes.toSorted((a, b) => a - b);
    return {
      retained: dust.sim.grains.length,
      meanMilliseconds:
        frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length,
      p95Milliseconds: sorted[Math.floor(sorted.length * 0.95)],
    };
  });
  assert.equal(report.fullFaceFrames.retained, 6000);
  const rect = await page.locator('#field').boundingBox();
  const start = performance.now();
  await page.mouse.move(
    rect.x + (80 / 160) * rect.width,
    rect.y + (110 / 200) * rect.height,
  );
  await page.mouse.down();
  await page.mouse.up();
  report.brushPointerMilliseconds = performance.now() - start;
  report.stressAfterBrush = await state();
  assert.ok(report.stressAfterBrush.attached < 6000);
  assert.equal(
    report.stressAfterBrush.left +
      report.stressAfterBrush.right +
      report.stressAfterBrush.retained,
    6000,
  );
  await page.screenshot({ path: 'artifacts/stone-stress.png' });
  report.stressDate = new Date().toISOString();
  console.log(
    JSON.stringify({
      phase: 'full retained stone',
      frames: report.fullFaceFrames,
      pointer: report.brushPointerMilliseconds,
      after: report.stressAfterBrush,
    }),
  );
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    'artifacts/stone-playtest-report.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await browser.close();
}
