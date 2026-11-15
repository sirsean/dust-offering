import { expect } from '@playwright/test';

export async function open(page, query = '') {
  await page.clock.install();
  await page.goto(`/?debug&${query}`);
  await expect(page.locator('#field')).toBeVisible();
  await page.waitForFunction(() => window.dust);
  await page.evaluate(() => document.fonts.ready);
}
export async function stroke(page, a, b, steps = 18) {
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
export async function hidden(page, value) {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', { configurable: true, value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, value);
}
export async function state(page) {
  return page.evaluate(() => ({
    emitted: dust.sim.emitted,
    left: dust.sim.left,
    right: dust.sim.right,
    spill: dust.sim.spill,
    face: dust.sim.faceCount,
    retained: dust.sim.grains.length,
    attached: dust.sim.attachedCount,
    ground: dust.sim.grains.filter((g) => g.missed && g.y > 190).length,
    steps: dust.sim.steps,
    remaining: Number.isFinite(dust.sim.remaining) ? dust.sim.remaining : null,
  }));
}
