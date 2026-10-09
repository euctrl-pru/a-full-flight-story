import { describe, it, expect } from 'vitest';
import { HERO, EVENTS, ACDM, TURNAROUND, ROUTE_PLANNED, ROUTE_REROUTED, altitudeAtKm, anspFor, countrySpans, anspSpans, minutesOfDay } from '$lib/story/flight';
import { routeLengthKm } from '$lib/geo/route';
import { loadCountries, ISO } from '$lib/geo/countries';

// slot tolerance −5/+10 [S7]; the reusable helper arrives with CASA in Task 8
const withinSlotWindow = (atot: number, ctot: number) => atot >= ctot - 5 && atot <= ctot + 10;

const hm = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);

describe('timeline', () => {
  it('is chronological with unique ids and cited or illustrative', () => {
    const t = EVENTS.map((e) => Date.parse(e.at));
    expect([...t].sort((a, b) => a - b)).toEqual(t);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
    for (const e of EVENTS) expect(e.sources.length).toBeGreaterThan(0);
  });
  it('A-CDM times are consistent with the slot rules (research §4b, §5)', () => {
    expect(hm(ACDM.ctotPlanned) - (hm(ACDM.eobt) + HERO.taxiOutMin)).toBe(HERO.ctotDelayMin);
    expect(hm(ACDM.ctotFinal) - (hm(ACDM.eobt) + HERO.taxiOutMin)).toBe(HERO.rerouteCtotDelayMin);
    expect(withinSlotWindow(hm(ACDM.atot), hm(ACDM.ctotFinal))).toBe(true);
    expect(hm(ACDM.tsat)).toBeGreaterThanOrEqual(hm(ACDM.tobt));
    expect(hm(ACDM.ttot)).toBe(hm(ACDM.ctotFinal));
    expect(hm(ACDM.aibt)).toBeGreaterThan(hm(ACDM.aldt));
    expect(hm(ACDM.aibt) - hm(ACDM.sta)).toBeLessThanOrEqual(15); // on time by the 15-min definition
  });
  it('SAM is sent at EOBT−2h (research §4b)', () => {
    const sam = EVENTS.find((e) => e.msg === 'SAM')!;
    expect(minutesOfDay(sam.at)).toBe(hm(ACDM.eobt) - 120);
  });
  it('turnaround tasks finish before off-block', () => {
    for (const t of TURNAROUND) {
      expect(hm(t.end)).toBeGreaterThan(hm(t.start));
      expect(hm(t.end)).toBeLessThanOrEqual(hm(ACDM.aobt));
    }
  });
});

describe('routes', () => {
  it('planned route ≈ great circle; reroute is longer', () => {
    const p = routeLengthKm(ROUTE_PLANNED), r = routeLengthKm(ROUTE_REROUTED);
    expect(p).toBeGreaterThan(1172);
    expect(p).toBeLessThan(1260);
    expect(r).toBeGreaterThan(p);
  });
  it('profile climbs, cruises and descends', () => {
    const L = 1200;
    expect(altitudeAtKm(0, L)).toBe(0);
    expect(altitudeAtKm(L / 2, L)).toBe(HERO.cruiseFt);
    expect(altitudeAtKm(50, L)).toBeLessThan(HERO.cruiseFt);
    expect(altitudeAtKm(L, L)).toBe(0);
  });
  it('MUAC owns Benelux airspace above FL245 (research §6)', () => {
    expect(anspFor(ISO.BE, 30000)).toBe('MUAC');
    expect(anspFor(ISO.BE, 10000)).toBe('skeyes');
    expect(anspFor(ISO.FR, 36000)).toBe('DSNA');
    expect(anspFor('999', 36000)).toBeNull();
  });
  it('planned route crosses BE → FR → CH → IT and ANSPs in research order', async () => {
    const fc = await loadCountries();
    const c = (await countrySpans(ROUTE_PLANNED, fc)).map((s) => s.id);
    expect(c[0]).toBe(ISO.BE);
    expect(c.at(-1)).toBe(ISO.IT);
    expect(c.indexOf(ISO.FR)).toBeGreaterThan(0);
    expect(c.indexOf(ISO.CH)).toBeGreaterThan(c.indexOf(ISO.FR));
    expect(anspSpans(ROUTE_PLANNED, fc).map((s) => s.id)).toEqual(['skeyes', 'MUAC', 'DSNA', 'Skyguide', 'ENAV']);
  });
  it('reroute swaps DSNA for DFS', async () => {
    const fc = await loadCountries();
    expect(anspSpans(ROUTE_REROUTED, fc).map((s) => s.id)).toEqual(['skeyes', 'MUAC', 'DFS', 'Skyguide', 'ENAV']);
  });
});
