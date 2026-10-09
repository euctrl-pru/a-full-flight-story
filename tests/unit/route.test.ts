import { describe, it, expect } from 'vitest';
import { distKm, routeLengthKm, pointAtKm, bearing, mergeSamples, spansByRegion, type LonLat } from '$lib/geo/route';

const EBBR: LonLat = [4.484444, 50.901389];
const LIRF: LonLat = [12.238889, 41.800278];

describe('distances', () => {
  it('EBBR–LIRF great circle ≈ 1172 km (research §0)', () => {
    expect(distKm(EBBR, LIRF)).toBeGreaterThan(1165);
    expect(distKm(EBBR, LIRF)).toBeLessThan(1180);
  });
  it('route length sums segments', () => {
    const mid: LonLat = [8, 46];
    expect(routeLengthKm([EBBR, mid, LIRF])).toBeCloseTo(distKm(EBBR, mid) + distKm(mid, LIRF), 6);
  });
});

describe('pointAtKm', () => {
  const r: LonLat[] = [[0, 0], [2, 0], [2, 2]];
  const L = routeLengthKm(r);
  it('clamps to endpoints', () => {
    expect(pointAtKm(r, -5).lonlat[0]).toBeCloseTo(0, 6);
    expect(pointAtKm(r, -5).lonlat[1]).toBeCloseTo(0, 6);
    expect(pointAtKm(r, L + 5).lonlat[0]).toBeCloseTo(2, 6);
    expect(pointAtKm(r, L + 5).lonlat[1]).toBeCloseTo(2, 6);
  });
  it('interpolates within segments and reports heading', () => {
    const p = pointAtKm(r, distKm([0, 0], [1, 0]));
    expect(p.lonlat[0]).toBeCloseTo(1, 4);
    expect(p.bearing).toBeCloseTo(90, 0);
    const north = pointAtKm(r, L - 1).bearing;
    expect(Math.min(north, 360 - north)).toBeLessThan(0.5);
  });
  it('bearing south-east from Brussels to Rome', () => {
    const b = bearing(EBBR, LIRF);
    expect(b).toBeGreaterThan(120);
    expect(b).toBeLessThan(160);
  });
});

describe('mergeSamples', () => {
  it('fills gaps, merges runs and absorbs short flickers', () => {
    const s = [
      { d: 0, id: null }, { d: 10, id: 'A' }, { d: 20, id: null }, { d: 30, id: 'B' },
      { d: 40, id: 'C' }, { d: 45, id: 'B' }, { d: 60, id: 'B' }, { d: 90, id: 'D' }
    ] as { d: number; id: string | null }[];
    expect(mergeSamples(s, 100, 15)).toEqual([
      { id: 'A', startKm: 0, endKm: 30 },
      { id: 'B', startKm: 30, endKm: 90 },
      { id: 'D', startKm: 90, endKm: 100 }
    ]);
  });
});

describe('spansByRegion', () => {
  // d3-geo: exterior rings clockwise (north, east, south, west)
  const box = (x0: number, x1: number): GeoJSON.Polygon => ({ type: 'Polygon', coordinates: [[[x0, 0], [x0, 1], [x1, 1], [x1, 0], [x0, 0]]] });
  it('assigns contiguous spans and lets gaps inherit the previous region', () => {
    const route: LonLat[] = [[0.1, 0.5], [2.9, 0.5]];
    const spans = spansByRegion(route, [{ id: 'A', feature: box(0, 1) }, { id: 'B', feature: box(2, 3) }]);
    expect(spans.map((s) => s.id)).toEqual(['A', 'B']);
    expect(spans[0].startKm).toBe(0);
    expect(spans[0].endKm).toBe(spans[1].startKm);
    expect(spans[1].startKm).toBeGreaterThan(210); // lon 2.0 is reached at ≈211 km; samples every 5 km
    expect(spans[1].startKm).toBeLessThan(217);
    expect(spans[1].endKm).toBeCloseTo(routeLengthKm(route), 6);
  });
});
