import { test, expect } from '@playwright/test';
import { walkStory } from './helpers';

test('no horizontal overflow at any step', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  await page.goto('/');
  await walkStory(page, async (id, i) => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${id} step ${i}`).toBeLessThanOrEqual(0);
  });
});

test('charts redraw on resize', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/');
  const svg = page.getByRole('img', { name: 'Daily flights in the European network by year' });
  await page.locator('#strategic [data-step="3"]').scrollIntoViewIfNeeded();
  await page.evaluate(() => { const el = document.querySelector('#strategic [data-step="3"]')!; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3); });
  const w1 = Number(await svg.getAttribute('width'));
  await page.setViewportSize({ width: 1000, height: 800 });
  await expect.poll(async () => Number(await svg.getAttribute('width'))).toBeLessThan(w1);
});

test('reduced motion shows final numbers immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  await page.goto('/');
  await page.evaluate(() => { const el = document.querySelector('#cold-open [data-step="1"]')!; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3); });
  const v = page.locator('#cold-open .hero .v');
  await expect(v).not.toHaveText('—');
  const first = await v.textContent();
  await page.waitForTimeout(300);
  expect(await v.textContent()).toBe(first); // no count-up animation
});
