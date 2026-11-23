import assert from 'node:assert/strict';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const label = process.argv[3] ?? 'candidate';
const options = JSON.parse(process.argv[4] ?? '{}');
const out = `artifacts/gameplay-review/${label}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  recordVideo: {
    dir: `/tmp/dust-offering-feel-${label}`,
    size: { width: 390, height: 844 },
  },
});
const page = await context.newPage();
const video = page.video();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const report = {
  date: new Date().toISOString(),
  label,
  base,
  options,
  browser: browser.version(),
  input:
    'Native emulated touch, real browser time; not a human enjoyment study.',
  gestures: [],
  errors,
};
const started = performance.now();
async function state() {
  return page.evaluate(() => ({
    time: dust.sim.time,
    emitted: dust.sim.emitted,
    left: dust.sim.left,
    right: dust.sim.right,
    retained: dust.sim.grains.length,
    attached: dust.sim.attachedCount,
    missed: dust.sim.spill,
    revealEquivalent: [...dust.sim.discovery.active].reduce(
      (sum, index) => sum + dust.sim.discovery.levels[index],
      0,
    ),
    feedback: dust.sim.brushFeedback ?? null,
    progress: dust.game.discovery ?? null,
  }));
}
try {
  await page.goto(`${base}/pour.html?debug&seed=48`);
  await page.waitForFunction(() => window.dust);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    (options) => Object.assign(dust.sim.config, options),
    options,
  );
  report.configuration = await page.evaluate(() => dust.sim.config);
  await page.evaluate(() => {
    window.gestureEffects = null;
    const sim = dust.sim;
    for (const name of ['brush', 'endBrush']) {
      if (!sim[name]) continue;
      const original = sim[name];
      sim[name] = function (...args) {
        const before = new Map(
          this.grains.map((g) => [g.id, { x: g.x, y: g.y, bond: g.bond }]),
        );
        const result = original.apply(this, args);
        const effect = window.gestureEffects;
        if (effect)
          for (const grain of this.grains) {
            const previous = before.get(grain.id);
            if (!previous) continue;
            if (Math.hypot(grain.x - previous.x, grain.y - previous.y) > 0.01)
              effect.moved.add(grain.id);
            if (previous.bond && !grain.bond) effect.released.add(grain.id);
            if (
              effect.firstHit === null &&
              (effect.moved.size || effect.released.size)
            )
              effect.firstHit = performance.now() - effect.started;
          }
        return result;
      };
    }
  });
  const client = await context.newCDPSession(page);
  const rect = await page.locator('#field').boundingBox();
  const touch = (x, y, id = 1) => ({
    x: rect.x + (x / 160) * rect.width,
    y: rect.y + (y / 200) * rect.height,
    id,
    radiusX: 9,
    radiusY: 9,
    force: 0.5,
  });
  async function swipe(name, points) {
    const before = await state();
    const positions = await page.evaluate(() =>
      dust.sim.grains.map((g) => ({ id: g.id, x: g.x, y: g.y })),
    );
    const wall = performance.now();
    await page.evaluate(() => {
      window.gestureEffects = {
        started: performance.now(),
        firstHit: null,
        moved: new Set(),
        released: new Set(),
      };
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [touch(...points[0])],
    });
    for (const point of points.slice(1)) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [touch(...point)],
      });
      await page.waitForTimeout(30);
    }
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    const moved = await page.evaluate(
      (old) =>
        old.filter((previous) => {
          const grain = dust.sim.grains.find((g) => g.id === previous.id);
          return (
            grain && Math.hypot(grain.x - previous.x, grain.y - previous.y) > 1
          );
        }).length,
      positions,
    );
    const directEffect = await page.evaluate(() => ({
      moved: window.gestureEffects.moved.size,
      released: window.gestureEffects.released.size,
      firstHitMilliseconds: window.gestureEffects.firstHit,
    }));
    report.gestures.push({
      name,
      wallMilliseconds: performance.now() - wall,
      movedDuringGesture: moved,
      directEffect,
      before,
      after: await state(),
    });
  }
  const line = (a, b, n = 24) =>
    Array.from({ length: n + 1 }, (_, i) => [
      a[0] + ((b[0] - a[0]) * i) / n,
      a[1] + ((b[1] - a[1]) * i) / n,
    ]);
  await page.waitForTimeout(1200);
  report.initial = await state();
  await page.screenshot({ path: `${out}/initial.png` });
  await swipe('opening diagonal swipe', line([80, 75], [105, 145]));
  await page.waitForTimeout(6000);
  await swipe('cross the incoming stream', line([60, 105], [110, 120]));
  await page.screenshot({ path: `${out}/early.png` });
  await page.waitForTimeout(8000);
  await swipe('scoop down and left', line([105, 135], [46, 170]));
  await page.screenshot({ path: `${out}/scoop.png` });
  await page.waitForTimeout(5000);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [touch(55, 125, 1), touch(105, 125, 2)],
  });
  for (let i = 1; i <= 20; i++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        touch(55 - i * 0.3, 125 + i * 2, 1),
        touch(105 + i * 0.3, 125 + i * 2, 2),
      ],
    });
    await page.waitForTimeout(35);
  }
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await swipe(
    'slow curve',
    Array.from({ length: 41 }, (_, i) => [
      80 + 28 * Math.cos(Math.PI * 0.2 + (i / 40) * Math.PI * 1.5),
      127 + 28 * Math.sin(Math.PI * 0.2 + (i / 40) * Math.PI * 1.5),
    ]),
  );
  await page.waitForTimeout(4000);
  await page.locator('#pour').click();
  await swipe('paused pour: reshape a deposit', line([80, 140], [115, 168]));
  await page.waitForTimeout(4000);
  if (await page.evaluate(() => Boolean(dust.audio))) {
    await page.locator('#sound').click();
    await page.evaluate(() => {
      const analyser = dust.audio.context.createAnalyser();
      analyser.fftSize = 512;
      dust.audio.master.connect(analyser);
      window.audioPeaks = [];
      const data = new Float32Array(analyser.fftSize);
      window.monitorAudio = true;
      function sample() {
        analyser.getFloatTimeDomainData(data);
        window.audioPeaks.push(Math.max(...data.map(Math.abs)));
        if (window.monitorAudio) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    const pile = await page.evaluate(() => {
      const g = dust.sim.grains.find((g) => g.bond && g.y > 85 && g.y < 155);
      return g ? { x: g.x, y: g.y } : null;
    });
    if (pile)
      await swipe(
        'sound-enabled material sweep',
        line([pile.x, pile.y], [80, 170]),
      );
    await page.waitForTimeout(500);
    report.audio = await page.evaluate(() => {
      window.monitorAudio = false;
      return {
        enabled: dust.audio.enabled,
        brushEvents: dust.audio.brushEvents,
        bowlEvents: dust.audio.bowlEvents,
        signalPeak: Math.max(...window.audioPeaks),
      };
    });
    assert.ok(report.audio.brushEvents > 0);
    assert.ok(report.audio.signalPeak > 0 && report.audio.signalPeak < 0.12);
    await page.locator('#sound').click();
    report.audio.muted = await page.evaluate(
      () => !dust.audio.enabled && dust.audio.context.state === 'suspended',
    );
    assert.equal(report.audio.muted, true);
  }
  report.final = await state();
  assert.equal(
    report.final.emitted,
    report.final.left + report.final.right + report.final.retained,
  );
  assert.deepEqual(errors, []);
  await page.screenshot({ path: `${out}/final.png` });
} finally {
  report.wallSeconds = (performance.now() - started) / 1000;
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  await context.close();
  if (video)
    await rename(await video.path(), `/tmp/dust-offering-${label}-play.webm`);
  await browser.close();
}
console.log(JSON.stringify(report));
