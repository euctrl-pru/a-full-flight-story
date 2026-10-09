import { test, expect } from '@playwright/test';
import { walkStory, trackErrors } from './helpers';

test('walks every step with no errors; every step and figure is sourced', async ({ page }, info) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort()); // deterministic: snapshot path
  const errors = trackErrors(page);
  await page.goto('/');
  await walkStory(page, async (id, i) => {
    const card = page.locator(`#${id} [data-step="${i}"] .card`);
    await expect(card.locator('.cite, .badge').first()).toBeVisible();
    const graphic = page.locator(`#${id} .graphic`);
    await expect(graphic.locator('.source').first()).toBeVisible();
    await page.screenshot({ path: `screenshots/${info.project.name}/${id}-${i}.png` });
  });
  await expect(page.locator('#sources li').first()).toBeVisible();
  // aborted live fetches surface as console.info, never console.error
  expect(errors.filter((e) => !e.includes('net::ERR_FAILED'))).toEqual([]);
});
