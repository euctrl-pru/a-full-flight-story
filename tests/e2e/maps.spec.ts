import { test, expect } from '@playwright/test';

test('maps render countries, aircraft and the ANSP-coloured route', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dev/maps/');
  await expect(page.locator('path.country').first()).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('text.lbl', { hasText: 'MUAC' })).toBeVisible();
  await expect(page.locator('path.route.ghost')).toHaveCount(1);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'screenshots/maps.png', fullPage: true });
});
