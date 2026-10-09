import { test, expect } from '@playwright/test';
import { scrollStepTo, mockEurocontrolLive, trackErrors } from './helpers';

test('EUROCONTROL down → snapshot badges, no errors', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  const errors = trackErrors(page);
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="1"]');
  await expect(page.locator('#cold-open .fresh')).toHaveText(/Snapshot/);
  expect(errors.filter((e) => !e.includes('net::ERR_FAILED'))).toEqual([]);
});

test('EUROCONTROL newer than snapshot → live badge', async ({ page }) => {
  await mockEurocontrolLive(page);
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="1"]');
  await expect(page.locator('#cold-open .fresh')).toHaveText(/Live/);
});

test('slow API (beyond 8 s timeout) still shows the snapshot', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', async (r) => { await new Promise((res) => setTimeout(res, 12_000)); await r.abort(); });
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="1"]');
  await expect(page.locator('#cold-open .fresh')).toHaveText(/Snapshot/, { timeout: 5_000 });
});

test('empty sky snapshot → honest empty state', async ({ page }) => {
  await page.route('**/data/sky.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'none', count: 0, aircraft: [] }) }));
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="0"]');
  await expect(page.getByTestId('sky-empty')).toBeVisible();
});

test('stale sky snapshot → says how old it is', async ({ page }) => {
  const old = new Date(Date.now() - 3 * 86_400_000).toISOString();
  await page.route('**/data/sky.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ fetchedAt: old, source: 'opensky', count: 1, aircraft: [{ id: 'a', cs: 'TEST1', lon: 4.5, lat: 50.9, alt: 35000, trk: 90, gs: 450 }] }) }));
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="0"]');
  await expect(page.locator('#cold-open .hud')).toContainText('3 days ago');
  await expect(page.locator('#cold-open .hud')).toContainText('may be paused');
});
