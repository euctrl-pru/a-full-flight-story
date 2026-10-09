import { describe, it, expect } from 'vitest';
import { weightFactor, distanceFactor, zoneCharge, routeCharges } from '$lib/sim/charges';
import { ZONES } from '$lib/story/charges-data';
import { ISO } from '$lib/geo/countries';

describe('CRCO formula [S32][S33]', () => {
  it('weight factor for an A320neo (79 t) is 1.26', () => expect(weightFactor(79)).toBe(1.26));
  it('distance factor is km/100 to two decimals', () => expect(distanceFactor(172)).toBe(1.72));
  it('reproduces the research worked example per zone', () => {
    expect(zoneCharge(172, 79, 116.65)).toBeCloseTo(252.8, 2);
    expect(zoneCharge(248, 79, 79.58)).toBeCloseTo(248.67, 2);
    expect(zoneCharge(206, 79, 167.12)).toBeCloseTo(433.78, 2);
    expect(zoneCharge(506, 79, 73.71)).toBeCloseTo(469.95, 1);
  });
});

describe('routeCharges', () => {
  const spans = [
    { id: ISO.BE, startKm: 0, endKm: 150 }, { id: ISO.LU, startKm: 150, endKm: 192 },
    { id: ISO.FR, startKm: 192, endKm: 440 }, { id: ISO.CH, startKm: 440, endKm: 646 },
    { id: ISO.IT, startKm: 646, endKm: 1172 }
  ];
  it('groups Belgium and Luxembourg and deducts 20 km at each end', () => {
    const r = routeCharges(spans, ZONES, 79);
    expect(r.map((z) => z.zone.id)).toEqual(['BELU', 'FR', 'CH', 'IT']);
    expect(r[0]).toMatchObject({ km: 192, chargeableKm: 172 });
    expect(r[3]).toMatchObject({ km: 526, chargeableKm: 506 });
    const total = r.reduce((s, z) => s + z.charge, 0);
    expect(total).toBeGreaterThan(1395);
    expect(total).toBeLessThan(1415); // research: ≈ €1,400
  });
  it('Switzerland: ~18% of distance, ~31% of the bill (research §7a)', () => {
    const r = routeCharges(spans, ZONES, 79);
    const ch = r.find((z) => z.zone.id === 'CH')!;
    const total = r.reduce((s, z) => s + z.charge, 0);
    expect(ch.km / 1172).toBeCloseTo(0.18, 1);
    expect(ch.charge / total).toBeCloseTo(0.31, 1);
  });
  it('ignores spans outside any zone and never goes negative', () => {
    const r = routeCharges([{ id: ISO.BE, startKm: 0, endKm: 10 }, { id: '999', startKm: 10, endKm: 50 }], ZONES, 79);
    expect(r).toHaveLength(1);
    expect(r[0].chargeableKm).toBe(0);
    expect(r[0].charge).toBe(0);
  });
});

describe('story copy agrees with the computed charges', () => {
  it('Switzerland distance and bill shares in the en-route copy match the planned-route calculation', async () => {
    const { loadCountries } = await import('$lib/geo/countries');
    const { countrySpans, ROUTE_PLANNED, HERO } = await import('$lib/story/flight');
    const { chapter } = await import('$lib/story/chapters');
    const r = routeCharges(await countrySpans(ROUTE_PLANNED, await loadCountries()), ZONES, HERO.mtowT);
    const ch = r.find((z) => z.zone.id === 'CH')!;
    const km = r.reduce((s, z) => s + z.km, 0), eur = r.reduce((s, z) => s + z.charge, 0);
    const text = chapter('enroute').steps.find((s) => s.id === 'er-switzerland')!.text;
    expect(text).toContain(`about ${Math.round((ch.km / km) * 100)}% of the distance`);
    expect(text).toContain(`about ${Math.round((ch.charge / eur) * 100)}% of the bill`);
  });
});
