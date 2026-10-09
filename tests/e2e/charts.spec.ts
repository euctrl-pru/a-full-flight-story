import { test, expect } from '@playwright/test';

test('chart gallery renders from the snapshot with hover tooltips and tables', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dev/charts/');
  const line = page.getByRole('img', { name: 'Daily flights by year' });
  await expect(line).toBeVisible();
  const box = (await line.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await expect(page.getByRole('status').first()).toBeVisible();
  await expect(page.getByText('◌ Snapshot').first()).toBeVisible();
  await page.getByText('Show data table').first().click();
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'screenshots/charts.png', fullPage: true });
});

test('story visualizations render and the CASA slider recomputes delay', async ({ page }) => {
  await page.goto('/dev/charts/');
  await expect(page.getByLabel('ICAO flight plan for FFS101')).toContainText('(FPL-FFS101-IS');
  const stat = page.locator('.casa .stat');
  const before = await stat.textContent();
  await page.locator('.casa input[type=range]').fill('56');
  await expect(stat).not.toHaveText(before!);
  await expect(page.getByRole('img', { name: /turnaround and A-CDM/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Vertical profile/ })).toBeVisible();
  await expect(page.locator('.charges .row')).toHaveCount(3);
  await expect(page.getByRole('img', { name: /Which stakeholder/ })).toBeVisible();
  await page.screenshot({ path: 'screenshots/story-viz.png', fullPage: true });
});
