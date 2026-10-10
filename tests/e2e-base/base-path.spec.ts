import { test, expect } from '@playwright/test';

const BASE = '/a-full-flight-story';
const LOCALES = ['en', 'de', 'fr', 'it', 'es', 'pl'];

for (const loc of LOCALES) {
  test(`${loc} loads under ${BASE}/ with no failed same-origin requests`, async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const bad: string[] = [];
    // External hosts (EUROCONTROL API, tiles, etc.) are not ours to judge: abort them.
    await page.route((url) => url.origin !== origin, (r) => r.abort());
    page.on('response', (r) => {
      if (new URL(r.url()).origin === origin && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
    });

    const path = loc === 'en' ? `${BASE}/` : `${BASE}/${loc}/`;
    const res = await page.goto(path, { waitUntil: 'networkidle' });
    expect(res!.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', loc);

    // Scroll through so lazily mounted chapters fetch their data/geo/assets too.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 2) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    await page.waitForLoadState('networkidle');
    expect(bad).toEqual([]);
  });
}
