import { test, expect } from '@playwright/test';

test('overview timeline jumps to a chapter', async ({ page }) => {
  await page.goto('/');
  await page.locator('#overview').getByRole('button', { name: 'The flight plan' }).click();
  await expect(page).toHaveURL(/#filing$/);
  await expect(page.locator('#filing')).toBeInViewport();
});
