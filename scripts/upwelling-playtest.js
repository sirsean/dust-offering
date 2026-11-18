import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chooseStroke } from '../src/lab/policy.js';
import { createGoal, evaluateGoal } from '../src/lab/goals.js';
import { seededRandom } from '../src/simulation/random.js';
import { upwelling } from '../src/config/upwelling.js';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';
const directory =
  process.argv.find((v) => v.startsWith('--output='))?.slice(9) ??
  'artifacts/upwelling/browser';
const goals = process.argv.includes('--extended')
  ? ['gather', 'paths']
  : ['level', 'clear', 'gather', 'paths'];
const budget = process.argv.includes('--extended') ? 48 : 24;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage(),
  errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const report = {
  config: upwelling,
  gestureBudget: budget,
  policy:
    'One geometric stroke at a time; exact circular zones and coarse density predictions. No future emission knowledge.',
  date: new Date().toISOString(),
  browser: browser.version(),
  description:
    'Linux headless Chromium, native emulated touch, 390 × 844 DPR 2. Planning uses read-only snapshots outside the page; every action uses actual touch events. Not human/device testing.',
  scenes: [],
  errors,
};
function summary(values) {
  const sorted = values.toSorted((a, b) => a - b);
  return {
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    p95: sorted[Math.floor(sorted.length * 0.95)],
  };
}
async function frameSample() {
  const value = await page.evaluate(async () => {
    const frames = [],
      start = performance.now(),
      simStart = window.stoneStudy.sim.time;
    let last;
    await new Promise((resolve) => {
      function tick(t) {
        if (last !== undefined) frames.push(t - last);
        last = t;
        if (frames.length >= 180) resolve();
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    return {
      frames,
      wallSeconds: (performance.now() - start) / 1000,
      simulatedSeconds: window.stoneStudy.sim.time - simStart,
    };
  });
  return { ...value, frames: summary(value.frames) };
}
async function snapshot() {
  return page.evaluate(() => ({
    grains: window.stoneStudy.sim.snapshot(),
    config: window.stoneStudy.sim.config,
    emitted: window.stoneStudy.sim.emitted,
    remaining: window.stoneStudy.sim.remaining,
  }));
}
try {
  const client = await context.newCDPSession(page);
  for (const type of goals) {
    await page.goto(`${base}/lab.html?debug&seed=48&goal=${type}`);
    await page.waitForFunction(() => window.stoneStudy);
    await page.evaluate(() => document.fonts.ready);
    const goal = createGoal(type, 48),
      random = seededRandom(48),
      scene = { type, actions: [] };
    await page.screenshot({ path: `${directory}/${type}-entry.png` });
    scene.entryPerformance = await frameSample();
    await page.evaluate(() => {
      while (window.stoneStudy.sim.time < 40) window.stoneStudy.sim.step();
    });
    scene.initial = evaluateGoal(await snapshot(), goal);
    await page.screenshot({ path: `${directory}/${type}-before.png` });
    await page.evaluate(() => {
      window.stoneBrushWork = [];
      for (const name of ['brush', 'endBrush']) {
        const sim = window.stoneStudy.sim,
          original = sim[name];
        sim[name] = function (...args) {
          const start = performance.now();
          const result = original.apply(this, args);
          window.stoneBrushWork.push(performance.now() - start);
          return result;
        };
      }
    });
    const rect = await page.locator('#field').boundingBox();
    const point = (x, y, id = 1) => ({
      x: rect.x + (Math.max(0.1, Math.min(159.9, x)) / 160) * rect.width,
      y: rect.y + (Math.max(0.1, Math.min(199.9, y)) / 200) * rect.height,
      id,
    });
    for (let i = 0; i < budget; i++) {
      const sim = await snapshot(),
        stroke = chooseStroke(sim, goal, 'purposeful', random, i);
      if (!stroke) break;
      const before = evaluateGoal(sim, goal).fit;
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [point(stroke.a.x, stroke.a.y)],
      });
      for (let j = 1; j <= 10; j++) {
        const t = j / 10;
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            point(
              stroke.a.x + (stroke.b.x - stroke.a.x) * t,
              stroke.a.y + (stroke.b.y - stroke.a.y) * t,
            ),
          ],
        });
        await page.waitForTimeout(45);
      }
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await page.waitForTimeout(160);
      const after = await snapshot();
      assert.equal(after.emitted, after.grains.length);
      assert.equal(after.emitted, 3600);
      scene.actions.push({
        ...stroke,
        before,
        after: evaluateGoal(after, goal).fit,
      });
      if (evaluateGoal(after, goal).complete) {
        await page.waitForTimeout(700);
        if (evaluateGoal(await snapshot(), goal).complete) break;
      }
    }
    scene.final = evaluateGoal(await snapshot(), goal);
    scene.brushWorkMilliseconds = summary(
      await page.evaluate(() => window.stoneBrushWork),
    );
    scene.finalPerformance = await frameSample();
    scene.final = evaluateGoal(await snapshot(), goal);
    await page.screenshot({ path: `${directory}/${type}-after.png` });
    await page.locator('#guide').click();
    await page.screenshot({ path: `${directory}/${type}-without-guide.png` });
    report.scenes.push(scene);
    console.log(JSON.stringify(scene));
  }
  assert.deepEqual(errors, []);
  await writeFile(
    `${directory}/report.json`,
    `${JSON.stringify(report, null, 2)}\n`,
  );
} finally {
  await browser.close();
}
