import { describe, it, expect } from 'vitest';
import { makeProjection, ROUTE_FRAME } from '$lib/geo/projection';
import { loadCountries, regionsFor, ISO } from '$lib/geo/countries';

describe('projection', () => {
  it('fits Europe and puts Rome south-east of Brussels', () => {
    const p = makeProjection(800, 600);
    const [bx, by] = p([4.48, 50.9])!;
    const [rx, ry] = p([12.24, 41.8])!;
    for (const v of [bx, rx]) { expect(v).toBeGreaterThan(0); expect(v).toBeLessThan(800); }
    for (const v of [by, ry]) { expect(v).toBeGreaterThan(0); expect(v).toBeLessThan(600); }
    expect(rx).toBeGreaterThan(bx);
    expect(ry).toBeGreaterThan(by);
  });
  it('route frame zooms in', () => {
    const eu = makeProjection(800, 600);
    const rt = makeProjection(800, 600, ROUTE_FRAME);
    expect(rt.scale()).toBeGreaterThan(eu.scale() * 2);
  });
});

describe('countries', () => {
  it('loads Natural Earth features for the route countries', async () => {
    const fc = await loadCountries();
    const regions = regionsFor(fc, Object.values(ISO));
    expect(regions.map((r) => r.id).sort()).toEqual(Object.values(ISO).sort());
  });
});
