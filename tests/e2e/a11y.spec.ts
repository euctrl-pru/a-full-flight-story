import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { scrollStepTo } from './helpers';

for (const [path, chapters] of [['/', 'Chapters'], ['/pl/', 'Rozdziały']] as const)
for (const theme of ['dark', 'light'] as const) {
  test(`no serious axe violations (${path} ${theme})`, async ({ page }) => {
    await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await page.goto(path);
    for (const sel of ['#overview', '#cold-open [data-step="1"]', '#phase-tactical', '#twist [data-step="4"]', '#ground [data-step="3"]', '#sources']) {
      await scrollStepTo(page, sel);
      await page.waitForTimeout(1000); // let entrance fades (≤700 ms) settle; axe samples computed opacity
      const r = await new AxeBuilder({ page }).analyze();
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), sel).toEqual([]);
    }
    await page.getByRole('button', { name: chapters }).click();
    const d = await new AxeBuilder({ page }).include('dialog').analyze();
    expect(d.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), 'drawer').toEqual([]);
    await page.keyboard.press('Escape');
  });
}
