import { test, expect } from '@playwright/test';
import { scrollStepTo } from './helpers';

test('sky canvas redraws with the new theme ramp after toggling', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="0"]'); // graphics mount when near the viewport
  const canvas = page.locator('#cold-open canvas');
  await expect(canvas).toHaveAttribute('data-drawn-theme', 'dark');
  await page.getByRole('button', { name: /Switch to light theme/ }).click();
  await expect(canvas).toHaveAttribute('data-drawn-theme', 'light');
});
