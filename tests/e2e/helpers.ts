import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

export async function scrollStepTo(page: Page, selector: string, frac = 0.3) {
  await page.evaluate(([sel, f]) => {
    const el = document.querySelector(sel as string)!;
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * (f as number));
  }, [selector, frac]);
}

export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  return errors;
}

/** Visit every step of every chapter in order. */
export async function walkStory(page: Page, onStep?: (chapterId: string, i: number) => Promise<void>) {
  const chapters = await page.locator('section.chapter').evaluateAll((els) => els.map((e) => ({ id: e.id, n: e.querySelectorAll('[data-step]').length })));
  for (const c of chapters) {
    for (let i = 0; i < c.n; i++) {
      await scrollStepTo(page, `#${c.id} [data-step="${i}"]`);
      await page.waitForFunction(([id, idx]) => document.getElementById(id as string)?.dataset.activeStep === String(idx), [c.id, i]);
      await onStep?.(c.id, i);
    }
  }
}

const fx = (f: string) => readFileSync(`tests/fixtures/eurocontrol/${f}`, 'utf8');

/** Serve fixture data from the live API, stamped with a newer sync date so the page upgrades to "Live". */
export async function mockEurocontrolLive(page: Page, date = '2099-01-01') {
  await page.route('https://api-data-app.eurocontrol.int/api/**', (route) => {
    const u = new URL(route.request().url());
    const body: Record<string, string> = {
      '/api/syncs': JSON.stringify({ data: [{ id: 1, syncDate: `${date}T00:00:00+00:00` }] }),
      '/api/traffic_charts': fx('traffic_charts-network.json'),
      '/api/delay_charts': fx('delay_charts-network.json'),
      '/api/punctualities_charts': fx('punctualities_charts-network.json'),
      '/api/co2_charts': fx('co2_charts-network.json'),
      '/api/traffic_networks': fx('traffic_networks-network.json'),
      '/api/delay_networks': fx('delay_networks-network.json'),
      '/api/situation_reports': fx('situation_reports.json')
    };
    return route.fulfill({ status: 200, contentType: 'application/json', body: body[u.pathname] ?? '{"data":[]}' });
  });
}
