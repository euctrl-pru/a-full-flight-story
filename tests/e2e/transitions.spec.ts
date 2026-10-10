import { test, expect } from '@playwright/test';
import { scrollStepTo } from './helpers';

test('graphic swaps cross-fade (both present mid-transition, one after)', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  await page.goto('/');
  await scrollStepTo(page, '#strategic [data-step="2"]');
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const g = document.querySelector('#strategic .graphic')!;
    (window as any).__maxSwaps = 0;
    new MutationObserver(() => {
      (window as any).__maxSwaps = Math.max((window as any).__maxSwaps, g.querySelectorAll('.swap').length);
    }).observe(g, { childList: true, subtree: true });
  });
  await scrollStepTo(page, '#strategic [data-step="3"]');
  await expect(page.locator('#strategic .graphic .swap')).toHaveCount(1, { timeout: 2000 });
  expect(await page.evaluate(() => (window as any).__maxSwaps)).toBe(2); // old and new coexisted while cross-fading
});

test('bars grow from the baseline', async ({ page }) => {
  await page.goto('/');
  await scrollStepTo(page, '#twist [data-step="0"]');
  const bar = page.locator('#twist .casa svg path').first();
  const early = await bar.getAttribute('d');
  await page.waitForTimeout(1200);
  expect(await bar.getAttribute('d')).not.toBe(early);
});

test('reduced motion: no swap overlap, bars at final height immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await scrollStepTo(page, '#strategic [data-step="3"]');
  await expect(page.locator('#strategic .graphic .swap')).toHaveCount(1);
  await scrollStepTo(page, '#twist [data-step="0"]');
  const bar = page.locator('#twist .casa svg path').first();
  await expect(bar).toBeVisible();
  const a = await bar.getAttribute('d');
  await page.waitForTimeout(700);
  expect(await bar.getAttribute('d')).toBe(a);
});

test('chapter titles reveal on entry', async ({ page }) => {
  await page.goto('/');
  await page.locator('#reroute .head').scrollIntoViewIfNeeded();
  await expect(page.locator('#reroute .head')).toHaveClass(/revealed/);
});
