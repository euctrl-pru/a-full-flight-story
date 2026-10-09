import { test, expect, type Page } from '@playwright/test';

/** Put the top of `selector` at `frac` of the viewport height (above scrollama's 0.6 offset line). */
async function scrollStepTo(page: Page, selector: string, frac = 0.3) {
  await page.evaluate(([sel, f]) => {
    const el = document.querySelector(sel as string)!;
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * (f as number));
  }, [selector, frac]);
}

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
