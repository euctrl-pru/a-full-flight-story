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

test('a divider introduces each phase with horizon, actors and a citation', async ({ page }) => {
  await page.goto('/');
  for (const id of ['strategic', 'pretactical', 'tactical', 'postops']) await expect(page.locator(`#phase-${id}`)).toHaveCount(1);
  const d = page.locator('#phase-pretactical');
  await d.scrollIntoViewIfNeeded();
  await expect(d.getByRole('heading', { level: 2 })).toHaveText('Pre-tactical');
  await expect(d).toContainText('D−6 to D−1');
  await expect(d.locator('.chip').first()).toBeVisible();
  await expect(d.locator('.cite').first()).toBeVisible();
  await expect(page.locator('.clock .now')).toContainText('Pre-tactical');
  // divider sits immediately before the phase's first chapter
  expect(await d.evaluate((el) => el.nextElementSibling?.id)).toBe('week-before');
});
