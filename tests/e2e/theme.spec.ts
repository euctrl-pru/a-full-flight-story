import { test, expect } from '@playwright/test';

test('sky canvas redraws with the new theme ramp after toggling', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  await page.goto('/');
  const canvas = page.locator('#cold-open canvas');
  await expect(canvas).toHaveAttribute('data-drawn-theme', 'dark');
  await page.getByRole('button', { name: /Switch to light theme/ }).click();
  await expect(canvas).toHaveAttribute('data-drawn-theme', 'light');
});
