import { test, expect } from '@playwright/test';
import { open, hidden } from './helpers.js';

test('fine disks retain their subpixel area, move cleanly and survive a display resize', async ({
  page,
}) => {
  await open(page, 'challenge=stone-offering-v8');
  await hidden(page, true);
  const check = () =>
    page.evaluate(() => {
      const renderer = dust.renderer;
      renderer.draw(dust.sim, 'challenge');
      const layer = renderer.dustLayer;
      const pixels = layer.pixels;
      let area = 0,
        occupied = 0;
      for (let i = 3; i < pixels.data.length; i += 4) {
        area += pixels.data[i] / 255;
        if (pixels.data[i]) occupied++;
      }
      return {
        area,
        occupied,
        expected: Math.PI * (dust.sim.config.grainRadius * renderer.scale) ** 2,
        radius: dust.sim.config.grainRadius,
        x: dust.sim.grains[0].x,
        y: dust.sim.grains[0].y,
      };
    });
  await page.evaluate(() => {
    dust.sim.addGrain(80.5, 110.5);
    dust.sim.emitted++;
    dust.sim.remaining--;
  });
  const before = await check();
  expect(before.radius).toBe(0.13);
  expect(before.area).toBeGreaterThan(before.expected * 0.8);
  expect(before.area).toBeLessThan(before.expected * 1.2);
  expect(before.occupied).toBeLessThanOrEqual(9);
  await page.evaluate(() => {
    dust.sim.grains[0].x = 95.5;
    dust.sim.grains[0].y = 120.5;
  });
  const moved = await check();
  expect(moved.area).toBeGreaterThan(moved.expected * 0.8);
  expect(moved.area).toBeLessThan(moved.expected * 1.2);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(100);
  const resized = await check();
  expect(resized.x).toBe(95.5);
  expect(resized.y).toBe(120.5);
  expect(resized.area).toBeGreaterThan(resized.expected * 0.75);
  expect(resized.area).toBeLessThan(resized.expected * 1.25);
});
