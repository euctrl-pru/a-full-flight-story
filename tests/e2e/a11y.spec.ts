import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { scrollStepTo } from './helpers';

for (const theme of ['dark', 'light'] as const) {
  test(`no serious axe violations (${theme})`, async ({ page }) => {
    await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await page.goto('/');
    for (const sel of ['#cold-open [data-step="1"]', '#twist [data-step="4"]', '#ground [data-step="3"]', '#sources']) {
      await scrollStepTo(page, sel);
      const r = await new AxeBuilder({ page }).analyze();
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), sel).toEqual([]);
    }
  });
}
