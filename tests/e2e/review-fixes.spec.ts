import { test, expect } from '@playwright/test';
import { scrollStepTo } from './helpers';

test('the phase rail stays visible on phones', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'phone layout');
  await page.goto('/');
  for (const id of ['ground', 'enroute', 'postops', 'filing']) {
    await scrollStepTo(page, `#${id} [data-step="0"]`);
    const w = await page.getByRole('progressbar').evaluate((el) => el.getBoundingClientRect().width);
    expect(w, id).toBeGreaterThan(80);
  }
});

test('jumping from the drawer moves keyboard focus to the chapter heading', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Chapters' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'The way around' }).press('Enter');
  await expect(page.locator('#reroute-title')).toBeFocused();
});

test('jumping from the overview timeline moves focus to the chapter heading', async ({ page }) => {
  await page.goto('/');
  await page.locator('#overview').getByRole('button', { name: 'The flight plan' }).click();
  await expect(page.locator('#filing-title')).toBeFocused();
});

test('the stale-feed warning is legible in the light theme', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  const old = new Date(Date.now() - 45 * 60_000).toISOString();
  await page.route('**/data/sky.json*', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ fetchedAt: old, source: 'opensky', count: 1, aircraft: [{ id: 'a', cs: 'A', lon: 4.5, lat: 50.9, alt: 35000, trk: 90, gs: 450 }] }) }));
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="0"]');
  const ratio = await page.getByTestId('sky-age').evaluate((el) => {
    const lum = (c: string) => { const [r, g, b] = c.match(/\d+/g)!.slice(0, 3).map((v) => { const s = +v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const fg = lum(getComputedStyle(el).color), bg = lum('rgb(249, 249, 247)'); // light --bg
    return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
