import { test, expect } from '@playwright/test';
import { scrollStepTo } from './helpers';

test('top bar shows four labelled phase segments and the current phase', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  await page.goto('/');
  await expect(page.locator('.clock .seg')).toHaveCount(4);
  await scrollStepTo(page, '#twist [data-step="0"]');
  await expect(page.locator('.clock .now')).toContainText('Tactical');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', /Tactical/);
  await scrollStepTo(page, '#filing [data-step="0"]');
  await expect(page.locator('.clock .now')).toContainText('Pre-tactical');
});

test('chapters show a phase pill in the phase colour', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#strategic .phase-pill')).toHaveText('Strategic');
  await expect(page.locator('#postops .phase-pill')).toHaveText('Post-operations');
  await expect(page.locator('#cold-open .phase-pill')).toHaveCount(0);
});
