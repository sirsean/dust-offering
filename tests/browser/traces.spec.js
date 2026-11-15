import { test, expect } from '@playwright/test';
import { open, stroke } from './helpers.js';

test('a visible trace remains after lifting, stacks with passes, fades, and clears on Reset', async ({
  page,
}) => {
  await open(page, 'challenge=stone-offering-v6');
  const sample = () =>
    page.evaluate(() => ({
      strength: dust.sim.surface.strengthAt(80.5, 100.5),
      color: [
        ...dust.renderer.ctx.getImageData(
          Math.round(80.5 * dust.renderer.scale),
          Math.round(100.5 * dust.renderer.scale),
          1,
          1,
        ).data,
      ]
        .slice(0, 3)
        .reduce((a, b) => a + b, 0),
      pointers: dust.renderer.brushes.size,
    }));
  await page.clock.runFor(100);
  const hiddenColor = (await sample()).color;
  // Establish uncovered, grease-free stone before testing grease contrast.
  for (let i = 0; i < 3; i++) await stroke(page, [80.5, 60.5], [80.5, 150.5]);
  await page.clock.runFor(90000);
  await page.clock.runFor(100);
  const bare = await sample();
  await stroke(page, [80.5, 60.5], [80.5, 150.5]);
  await page.clock.runFor(150);
  const once = await sample();
  expect(once.pointers).toBe(0);
  expect(once.strength).toBeGreaterThan(0.85);
  expect(once.color).toBeLessThan(bare.color - 25);
  await stroke(page, [80.5, 60.5], [80.5, 150.5]);
  await stroke(page, [80.5, 60.5], [80.5, 150.5]);
  await page.clock.runFor(150);
  const layered = await sample();
  expect(layered.strength).toBeGreaterThan(once.strength * 2.5);
  expect(layered.color).toBeLessThan(once.color - 15);
  await page.screenshot({ path: test.info().outputPath('layered-trace.png') });
  await page.clock.runFor(6000);
  const faded = await sample();
  expect(faded.strength).toBeLessThan(layered.strength * 0.55);
  expect(faded.strength).toBeGreaterThan(layered.strength * 0.45);
  expect(faded.color).toBeGreaterThan(layered.color + 15);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.runFor(100);
  expect((await sample()).color).toBeLessThan(bare.color - 20);
  await page.clock.runFor(24000);
  expect((await sample()).color).toBeGreaterThan(bare.color - 20);
  await page.locator('#reset').click();
  await page.clock.runFor(100);
  expect((await sample()).strength).toBe(0);
  expect((await sample()).color).toBe(hiddenColor);
  expect(await page.evaluate(() => dust.sim.discovery.active.size)).toBe(0);
});

test('brushing reaches the tip, bottom rim and side edges even when the finger ends beyond them', async ({
  page,
}) => {
  await open(page, 'challenge=stone-offering-v6');
  await page.clock.runFor(100);
  const pixel = () =>
    page.evaluate(() =>
      [
        ...dust.renderer.ctx.getImageData(
          Math.round(80 * dust.renderer.scale),
          Math.round(175 * dust.renderer.scale),
          1,
          1,
        ).data,
      ]
        .slice(0, 3)
        .reduce((a, b) => a + b, 0),
    );
  const bare = await pixel();
  await stroke(page, [80, 160], [80, 188], 1);
  await stroke(page, [80, 20], [80, 4], 1);
  await stroke(page, [5, 175], [155, 175], 2);
  await page.clock.runFor(100);
  const field = await page.evaluate(() => ({
    tip: dust.sim.surface.strengthAt(80, 6),
    base: dust.sim.surface.strengthAt(80, 175.9),
    left: dust.sim.surface.strengthAt(2, 175.5),
    right: dust.sim.surface.strengthAt(158, 175.5),
    outside: dust.sim.surface.strengthAt(80, 177),
    bowl: dust.sim.surface.strengthAt(40, 181),
  }));
  expect(field.tip).toBeGreaterThan(0);
  expect(field.base).toBeGreaterThan(0.6);
  expect(field.left).toBeGreaterThan(0);
  expect(field.right).toBeGreaterThan(0);
  expect(field.outside).toBe(0);
  expect(field.bowl).toBe(0);
  expect(Math.abs((await pixel()) - bare)).toBeGreaterThan(10);
  expect(
    await page.evaluate(() => dust.sim.discovery.levelAt(80, 175.9)),
  ).toBeGreaterThan(0.5);
  await page.screenshot({
    path: test.info().outputPath('full-stone-edges.png'),
  });
});

test('an actual finger stroke guides falling material downhill while allowing it to drift', async ({
  page,
}) => {
  await open(page, 'challenge=stone-offering-v6');
  const seed = () =>
    page.evaluate(() => {
      dust.sim.config.stoneAdhesionRate = 0;
      dust.sim.config.sandAdhesionRate = 0;
      dust.sim.addGrain(70, 80, 0, 12);
      dust.sim.emitted++;
    });
  await seed();
  await page.clock.runFor(4000);
  const bare = await page.evaluate(() => ({
    x: dust.sim.grains[0].x,
    y: dust.sim.grains[0].y,
  }));
  await page.locator('#reset').click();
  for (let i = 0; i < 3; i++) await stroke(page, [65, 70], [105, 150]);
  await seed();
  await page.clock.runFor(4000);
  const guided = await page.evaluate(() => ({
    x: dust.sim.grains[0].x,
    y: dust.sim.grains[0].y,
    bond: dust.sim.grains[0].bond,
  }));
  expect(bare.x).toBe(70);
  expect(guided.x).toBeGreaterThan(bare.x + 20);
  expect(guided.y).toBeGreaterThan(130);
  expect(guided.bond).toBe(null);
  expect(Math.abs(guided.x - (65 + (guided.y - 70) / 2))).toBeGreaterThan(0.5);
});

test('two fingers leave independent traces, one can lift while the other continues, and Reset cancels both', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'phone', 'Touch-enabled viewport only');
  await open(page, 'challenge=stone-offering-v6');
  const rect = await page.locator('#field').boundingBox();
  const p = (x, y, id) => ({
    x: rect.x + (x / 160) * rect.width,
    y: rect.y + (y / 200) * rect.height,
    id,
  });
  const client = await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [p(62, 75, 1), p(98, 75, 2)],
  });
  expect(await page.evaluate(() => dust.renderer.brushes.size)).toBe(2);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [p(55, 135, 1), p(105, 135, 2)],
  });
  await page.clock.runFor(100);
  const branches = await page.evaluate(() => ({
    left: dust.sim.surface.strengthAt(59, 100),
    right: dust.sim.surface.strengthAt(101, 100),
    middle: dust.sim.surface.strengthAt(80, 100),
    leftReveal: dust.sim.discovery.levelAt(59, 100),
    rightReveal: dust.sim.discovery.levelAt(101, 100),
    middleReveal: dust.sim.discovery.levelAt(80, 100),
  }));
  expect(branches.left).toBeGreaterThan(0.8);
  expect(branches.right).toBeGreaterThan(0.8);
  expect(branches.middle).toBe(0);
  expect(branches.leftReveal).toBeGreaterThan(0.5);
  expect(branches.rightReveal).toBeGreaterThan(0.5);
  expect(branches.middleReveal).toBe(0);
  await page.screenshot({
    path: test.info().outputPath('two-finger-traces.png'),
  });
  // CDP's nonempty touchEnd list identifies the finger being lifted.
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [p(55, 135, 1)],
  });
  expect(await page.evaluate(() => dust.renderer.brushes.size)).toBe(1);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [p(100, 150, 2)],
  });
  await page.clock.runFor(100);
  // Chrome can coalesce touch moves until its next compositor frame.
  await expect
    .poll(() => page.evaluate(() => dust.sim.surface.strengthAt(101.7, 145)))
    .toBeGreaterThan(0.5);
  expect(await page.evaluate(() => dust.sim.surface.strengthAt(80, 140))).toBe(
    0,
  );
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [p(58, 130, 3), p(100, 150, 2)],
  });
  expect(await page.evaluate(() => dust.renderer.brushes.size)).toBe(2);
  await page.evaluate(() => document.querySelector('#reset').click());
  expect(await page.evaluate(() => dust.renderer.brushes.size)).toBe(0);
  expect(
    await page.evaluate(() => dust.sim.surface.snapshot().cells.length),
  ).toBe(0);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [p(56, 135, 3), p(96, 155, 2)],
  });
  expect(
    await page.evaluate(() => dust.sim.surface.snapshot().cells.length),
  ).toBe(0);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
});

test('overlapping fingers add stickiness, and cancelling one does not cancel the other', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'phone', 'Touch-enabled viewport only');
  await open(page, 'challenge=stone-offering-v6');
  const rect = await page.locator('#field').boundingBox();
  const p = (x, y, id) => ({
    x: rect.x + (x / 160) * rect.width,
    y: rect.y + (y / 200) * rect.height,
    id,
  });
  const client = await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [p(79, 100, 1)],
  });
  const once = await page.evaluate(() =>
    dust.sim.surface.strengthAt(80.5, 100.5),
  );
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [p(79, 100, 1), p(82, 100, 2)],
  });
  expect(
    await page.evaluate(() => dust.sim.surface.strengthAt(80.5, 100.5)),
  ).toBeGreaterThan(once * 1.5);
  await page.evaluate(() => {
    const id = [...dust.renderer.brushes.keys()][0];
    document
      .querySelector('#field')
      .dispatchEvent(
        new PointerEvent('pointercancel', { pointerId: id, bubbles: true }),
      );
  });
  expect(await page.evaluate(() => dust.renderer.brushes.size)).toBe(1);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [p(79, 100, 1), p(90, 130, 2)],
  });
  await page.clock.runFor(100);
  await expect
    .poll(() => page.evaluate(() => dust.sim.surface.strengthAt(88, 122)))
    .toBeGreaterThan(0.5);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  expect(await page.evaluate(() => dust.renderer.brushes.size)).toBe(0);
  expect(
    await page.evaluate(() => dust.sim.surface.strengthAt(80.5, 100.5)),
  ).toBeGreaterThan(once);
});
