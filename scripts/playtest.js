import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await mkdir('artifacts', { recursive: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
async function stroke(a, b, steps = 12) {
  const rect = await page.locator('#field').boundingBox();
  await page.mouse.move(
    rect.x + (a[0] / 160) * rect.width,
    rect.y + (a[1] / 200) * rect.height,
  );
  await page.mouse.down();
  await page.mouse.move(
    rect.x + (b[0] / 160) * rect.width,
    rect.y + (b[1] / 200) * rect.height,
    { steps },
  );
  await page.mouse.up();
}
async function layout() {
  await stroke([50, 70], [110, 155]);
  await stroke([96, 140], [38, 168]);
}
async function state() {
  return page.evaluate(() => ({
    left: dust.sim.left,
    right: dust.sim.right,
    spill: dust.sim.spill,
    face: dust.sim.grains.length,
    emitted: dust.sim.emitted,
    remaining: Number.isFinite(dust.sim.remaining) ? dust.sim.remaining : null,
  }));
}
async function sample(milliseconds) {
  const before = await state();
  await page.waitForTimeout(milliseconds);
  const after = await state();
  const left = after.left - before.left;
  const right = after.right - before.right;
  return {
    left,
    right,
    gapFraction: left / (left + right),
    spill: after.spill - before.spill,
  };
}
const stressOnly = process.argv.includes('--stress-only');
const report = stressOnly
  ? JSON.parse(await readFile('artifacts/playtest-report.json', 'utf8'))
  : {
      date: new Date().toISOString(),
      browser: browser.version(),
      node: process.version,
      viewport: '390 × 844, emulated touch, Linux headless Chromium',
      errors,
    };
try {
  await page.goto(`${base}/?debug`);
  await page.waitForFunction(() => window.dust);
  if (!stressOnly) {
    await page.locator('#pour').click();
    await layout();
    await page.locator('#pour').click();
    await page.waitForTimeout(6000);
    report.beforeCut = await sample(2000);
    await page.locator('#rub').click();
    await stroke([78, 109.667], [80.884, 113.752]);
    await page.waitForTimeout(2500);
    report.smallCut = await sample(4000);
    await stroke([80.884, 113.752], [82.038, 115.386], 4);
    await page.waitForTimeout(2500);
    report.widerCut = await sample(4000);
    assert.ok(report.beforeCut.right > 100 && report.beforeCut.left === 0);
    assert.ok(report.smallCut.left > 40 && report.smallCut.right > 40);
    assert.ok(report.widerCut.gapFraction > report.smallCut.gapFraction + 0.1);
    await page.screenshot({ path: 'artifacts/playtest-free.png' });
    console.log(
      JSON.stringify({
        phase: 'live split',
        small: report.smallCut,
        wider: report.widerCut,
      }),
    );
    await page.locator('#challenge').click();
    await page.locator('#draw').click();
    await layout();
    await page.locator('#rub').click();
    await stroke([78, 109.667], [80.884, 113.752]);
    const started = performance.now();
    await page.locator('#pour').click();
    await page.waitForFunction(() => dust.sim.remaining === 0, null, {
      timeout: 65000,
    });
    report.pourWallSeconds = (performance.now() - started) / 1000;
    await page.waitForFunction(() => dust.game.canFinish, null, {
      timeout: 10000,
    });
    report.challenge = await state();
    assert.equal(report.challenge.emitted, 4800);
    assert.equal(
      report.challenge.left +
        report.challenge.right +
        report.challenge.spill +
        report.challenge.face,
      4800,
    );
    await page.locator('#pour').click();
    report.result = await page.evaluate(() => dust.game.result);
    assert.ok(report.result.score > 800);
    await page.screenshot({ path: 'artifacts/playtest-result.png' });
    console.log(
      JSON.stringify({
        phase: 'challenge',
        seconds: report.pourWallSeconds,
        result: report.result,
      }),
    );
    await page.locator('#result-close').click();
    await page.locator('#free').click();
  }
  const rubButton = await page.locator('#rub').boundingBox();
  await page.evaluate(async () => {
    const { Simulation } = await import('/src/simulation/simulation.js');
    const { fillStressScene } = await import('/src/config/stress-scene.js');
    const sim = new Simulation({ sourceRate: 0 });
    fillStressScene(sim);
    dust.game.sim = sim;
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window.frameTimes = [];
    let last;
    function measure(time) {
      if (last) frameTimes.push(time - last);
      last = time;
      if (frameTimes.length < 300) requestAnimationFrame(measure);
    }
    requestAnimationFrame(measure);
  });
  await page.waitForTimeout(3000);
  report.pilePointerRoundTrips = [];
  for (let i = 0; i < 4; i++) {
    const clickStart = performance.now();
    await page.mouse.click(
      rubButton.x + rubButton.width / 2,
      rubButton.y + rubButton.height / 2,
    );
    report.pilePointerRoundTrips.push(performance.now() - clickStart);
  }
  assert.equal(await page.locator('#rub').getAttribute('aria-pressed'), 'true');
  delete report.pileButtonMilliseconds;
  report.stressDate = new Date().toISOString();
  report.pile = await page.evaluate(() => {
    const sorted = frameTimes.toSorted((a, b) => a - b);
    return {
      grains: dust.sim.grains.length,
      sleeping: dust.sim.grains.filter((g) => g.sleeping).length,
      meanFrameMilliseconds:
        frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length,
      p95FrameMilliseconds: sorted[Math.floor(sorted.length * 0.95)],
      spill: dust.sim.left + dust.sim.right + dust.sim.spill,
    };
  });
  assert.equal(report.pile.grains, 6000);
  assert.equal(report.pile.spill, 0);
  await page.screenshot({ path: 'artifacts/playtest-pile.png' });
  console.log(
    JSON.stringify({
      phase: 'retained pile',
      ...report.pile,
      pointerRoundTrips: report.pilePointerRoundTrips,
    }),
  );
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    'artifacts/playtest-report.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await browser.close();
}
