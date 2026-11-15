import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const directory = process.argv[3] ?? 'artifacts/fine-dust';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const report = {
  date: new Date().toISOString(),
  base,
  browser: browser.version(),
  viewport: '390 × 844, DPR 2, headless Chromium, emulated touch',
  phases: [],
  errors,
};
await mkdir(directory, { recursive: true });
function summary(values) {
  const ordered = values.toSorted((a, b) => a - b);
  return {
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    p95: ordered[Math.floor(ordered.length * 0.95)],
  };
}
try {
  await page.goto(`${base}/?debug&seed=48`);
  await page.waitForFunction(() => window.dust);
  await page.evaluate(() => document.fonts.ready);
  report.config = await page.evaluate(() => dust.sim.config);
  async function measure(label) {
    const result = await page.evaluate(async () => {
      const sim = dust.sim,
        renderer = dust.renderer;
      const steps = [],
        draws = [],
        frames = [];
      const originalStep = sim.step,
        originalDraw = renderer.draw;
      sim.step = function () {
        const start = performance.now();
        originalStep.call(this);
        steps.push(performance.now() - start);
      };
      renderer.draw = function (...args) {
        const start = performance.now();
        originalDraw.apply(this, args);
        draws.push(performance.now() - start);
      };
      const wallStart = performance.now(),
        simStart = sim.time;
      let previous;
      await new Promise((resolve) => {
        function frame(time) {
          if (previous !== undefined) frames.push(time - previous);
          previous = time;
          if (frames.length >= 180) resolve();
          else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
      sim.step = originalStep;
      renderer.draw = originalDraw;
      return {
        frames,
        steps,
        draws,
        wallSeconds: (performance.now() - wallStart) / 1000,
        simulationSeconds: sim.time - simStart,
        retained: sim.grains.length,
        emitted: sim.emitted,
        left: sim.left,
        right: sim.right,
        attached: sim.attachedCount,
        missed: sim.spill,
        released: sim.brushFeedback.releasedTotal ?? 0,
      };
    });
    assert.equal(result.emitted, result.left + result.right + result.retained);
    const value = {
      label,
      ...result,
      frames: summary(result.frames),
      steps: summary(result.steps),
      draws: summary(result.draws),
    };
    report.phases.push(value);
    console.log(JSON.stringify(value));
    await page.screenshot({ path: `${directory}/${label}.png` });
  }
  await measure('entry');
  await page.evaluate(() => {
    const start = performance.now();
    while (dust.sim.time < 120) dust.sim.step();
    window.preparationMilliseconds = performance.now() - start;
  });
  report.advanceTo120Milliseconds = await page.evaluate(
    () => window.preparationMilliseconds,
  );
  await measure('two-minute-pour');
  await page.evaluate(async () => {
    const { Simulation } = await import('/src/simulation/simulation.js');
    const { fillStressScene } = await import('/src/config/stress-scene.js');
    const sim = new Simulation({ sourceRate: 0 });
    fillStressScene(sim);
    dust.game.sim = sim;
  });
  await measure('full-retained');
  const before = await page.evaluate(() => dust.sim.emitted);
  const rect = await page.locator('#field').boundingBox();
  const client = await context.newCDPSession(page);
  const brushWork = [];
  for (const method of ['edit', 'endBrush']) {
    const original = await page.evaluate((method) => {
      const game = dust.game,
        original = game[method];
      window.dustBrushWork ??= [];
      game[method] = function (...args) {
        const start = performance.now();
        const result = original.apply(this, args);
        window.dustBrushWork.push(performance.now() - start);
        return result;
      };
      return Boolean(original);
    }, method);
    assert.equal(original, true);
  }
  function point(x, y, id) {
    return {
      x: rect.x + (x / 160) * rect.width,
      y: rect.y + (y / 200) * rect.height,
      id,
    };
  }
  const start = performance.now();
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [point(65, 90, 1), point(95, 90, 2)],
  });
  for (let i = 1; i <= 12; i++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        point(65 - (15 * i) / 12, 90 + (55 * i) / 12, 1),
        point(95 + (15 * i) / 12, 90 + (55 * i) / 12, 2),
      ],
    });
    await page.waitForTimeout(50);
  }
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  report.twoFingerWallMilliseconds = performance.now() - start;
  brushWork.push(...(await page.evaluate(() => window.dustBrushWork)));
  report.brushWorkMilliseconds = summary(brushWork);
  await measure('full-brushed');
  assert.equal(await page.evaluate(() => dust.sim.emitted), before);
  assert.ok(report.phases.at(-1).released > 0);
  assert.deepEqual(errors, []);
  await writeFile(
    `${directory}/report.json`,
    `${JSON.stringify(report, null, 2)}\n`,
  );
} finally {
  await browser.close();
}
