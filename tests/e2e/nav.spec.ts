import { test, expect } from '@playwright/test';
import { scrollStepTo } from './helpers';

test('overview timeline jumps to a chapter', async ({ page }) => {
  await page.goto('/');
  await page.locator('#overview').getByRole('button', { name: 'The flight plan' }).click();
  await expect(page).toHaveURL(/#filing$/);
  await expect(page.locator('#filing')).toBeInViewport();
});


test('drawer lists chapters by phase, jumps, and is keyboard-safe', async ({ page }) => {
  await page.goto('/');
  const open = page.getByRole('button', { name: 'Chapters' });
  await open.click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('heading', { name: 'Tactical', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  await expect(open).toBeFocused();
  await open.click();
  await dlg.getByRole('link', { name: 'The way around' }).click();
  await expect(page).toHaveURL(/#reroute$/);
  await expect(page.locator('.clock .now')).toContainText('Tactical');
});

test('deep links into the real story land on the right chapter', async ({ page }) => {
  for (const id of ['twist', 'reroute', 'postops']) {
    await page.goto(`/#${id}`);
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
  await page.goto('/#twist');
  await expect(page.locator('.clock .now')).toContainText('Tactical');
});

test('the hash follows the chapter in view and survives a reload', async ({ page }) => {
  await page.goto('/');
  await scrollStepTo(page, '#ground [data-step="2"]');
  await expect(page).toHaveURL(/#ground$/);
  await page.reload();
  await expect(page.locator('#ground')).toBeInViewport();
});

test('back to top link at the end', async ({ page }) => {
  await page.goto('/#sources');
  await page.getByRole('link', { name: 'Back to top ↑' }).click();
  await expect(page.locator('#top')).toBeInViewport();
});

test('deep link into a lazily loaded chapter renders its graphic and phase', async ({ page }) => {
  await page.goto('/#enroute');
  await expect(page.locator('#enroute .graphic svg').first()).toBeVisible();
  await expect(page.locator('.clock .now')).toContainText('Tactical');
});
