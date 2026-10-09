import { test, expect } from '@playwright/test';
import { scrollStepTo } from './helpers';

test('steps activate on scroll and drive the mission clock', async ({ page }) => {
  await page.goto('/dev/scroll/');
  await scrollStepTo(page, '#two [data-step="1"]');
  await expect(page.getByTestId('graphic-two')).toContainText('step 1');
  const clock = page.getByRole('progressbar');
  await expect(clock).toHaveAttribute('aria-valuetext', 'C2');
  await expect(clock).toHaveAttribute('aria-valuenow', '60');
});

test('scrolling back up re-activates earlier steps', async ({ page }) => {
  await page.goto('/dev/scroll/');
  await scrollStepTo(page, '#two [data-step="2"]');
  await expect(page.getByTestId('graphic-two')).toContainText('step 2');
  await scrollStepTo(page, '#one [data-step="1"]');
  await expect(page.getByTestId('graphic-one')).toContainText('step 1');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'C1');
});

test('deep link lands on the right chapter', async ({ page }) => {
  await page.goto('/dev/scroll/#two');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'C2');
});

test('citation chips link to sources and terms open definitions', async ({ page }) => {
  await page.goto('/dev/scroll/');
  await expect(page.locator('#one .cite').first()).toHaveAttribute('href', /eurocontrol/);
  await page.locator('#one .term button').first().click();
  await expect(page.locator('#one .term [role="tooltip"]').first()).toContainText('Integrated Initial Flight Plan');
});
