import { test, expect } from '@playwright/test';

test('every locale page renders with its lang attribute', async ({ page }) => {
  for (const [path, lang] of [['/', 'en'], ['/de/', 'de'], ['/fr/', 'fr'], ['/it/', 'it'], ['/es/', 'es'], ['/pl/', 'pl']]) {
    const res = await page.goto(path);
    expect(res!.status(), path).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
  }
});

test('unsupported locale segments are not pages', async ({ page }) => {
  expect((await page.goto('/xx/'))!.status()).toBe(404);
  expect((await page.goto('/en/'))!.status()).toBe(404);
});
