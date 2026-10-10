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

test('switcher goes to the same chapter in another language', async ({ page }) => {
  await page.goto('/#reroute');
  await page.getByRole('button', { name: /Language|EN/ }).click();
  await page.getByRole('link', { name: 'Deutsch' }).click();
  await expect(page).toHaveURL(/\/de\/#reroute$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#reroute')).toBeInViewport();
});

test('French browsers get a dismissible hint on the English page only', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'fr-FR' });
  const page = await ctx.newPage();
  await page.goto('/');
  const hint = page.getByTestId('language-hint');
  await expect(hint).toBeVisible();
  await hint.getByRole('button', { name: 'Non' }).click();
  await expect(hint).toBeHidden();
  await page.reload();
  await expect(page.getByTestId('language-hint')).toBeHidden();
  await page.goto('/fr/');
  await expect(page.getByTestId('language-hint')).toHaveCount(0);
  await ctx.close();
});

test('pages advertise their alternates', async ({ page }) => {
  await page.goto('/de/');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(7); // 6 locales + x-default
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://euctrl-pru.github.io/a-full-flight-story/de/');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'de_DE');
});
