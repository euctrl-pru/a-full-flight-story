import { test, expect } from '@playwright/test';

test('share and SEO metadata', async ({ page, request }) => {
  await page.goto('/');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/og\.png$/);
  expect((await request.get('/og.png')).status()).toBe(200);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /A Full Flight Story/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://euctrl-pru.github.io/a-full-flight-story/');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /favicon\.svg$/);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld['@type']).toBe('Article');
  expect((await request.get('/robots.txt')).status()).toBe(200);
  expect(await (await request.get('/sitemap.xml')).text()).toContain('https://euctrl-pru.github.io/a-full-flight-story/');
});
