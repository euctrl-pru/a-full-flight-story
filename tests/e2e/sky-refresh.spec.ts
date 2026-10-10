import { test, expect } from '@playwright/test';
import { scrollStepTo } from './helpers';

const ac = (id: string) => ({ id, cs: id, lon: 4.5, lat: 50.9, alt: 35000, trk: 90, gs: 450 });

test('the open page swaps in newer aircraft and ignores older ones', async ({ page }) => {
  await page.clock.install();
  let call = 0;
  await page.route('**/data/sky.json*', (r) => {
    call++;
    const t = new Date(Date.now() - (call === 1 ? 300_000 : call === 2 ? 600_000 : 0)).toISOString(); // 2nd poll is OLDER
    const aircraft = call >= 3 ? [ac('A'), ac('B')] : [ac('A')];
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ fetchedAt: t, source: 'opensky', count: aircraft.length, aircraft }) });
  });
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="0"]');
  const v = page.locator('#cold-open .hero .v');
  await expect(v).toHaveText('1');
  await page.clock.runFor(61_000); // poll 2 → older → ignored
  await expect(v).toHaveText('1');
  await page.clock.runFor(61_000); // poll 3 → newer, 2 aircraft
  await expect(v).toHaveText('2');
  await expect(page.getByTestId('sky-age')).toContainText('OpenSky Network');
});

test('adsb.lol-sourced snapshots are labelled as such', async ({ page }) => {
  await page.route('**/data/sky.json*', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'adsb.lol', count: 1, aircraft: [ac('A')] }) }));
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="0"]');
  await expect(page.getByTestId('sky-age')).toContainText('adsb.lol');
});
