import { describe, it, expect } from 'vitest';
import { lerpProjection, makeProjection, EUROPE_FRAME, ROUTE_FRAME } from '$lib/geo/projection';
import { sliceRoute, routeLengthKm, type LonLat } from '$lib/geo/route';
import { MILITARY_AREAS, REGULATED_SECTOR } from '$lib/story/airspace';
import { geoArea } from 'd3-geo';

describe('lerpProjection', () => {
  it('matches the endpoints', () => {
    const a = makeProjection(800, 600, EUROPE_FRAME), b = makeProjection(800, 600, ROUTE_FRAME);
    expect(lerpProjection(800, 600, EUROPE_FRAME, ROUTE_FRAME, 0).scale()).toBeCloseTo(a.scale(), 6);
    expect(lerpProjection(800, 600, EUROPE_FRAME, ROUTE_FRAME, 1).scale()).toBeCloseTo(b.scale(), 6);
    const mid = lerpProjection(800, 600, EUROPE_FRAME, ROUTE_FRAME, 0.5).scale();
    expect(mid).toBeGreaterThan(a.scale());
    expect(mid).toBeLessThan(b.scale());
  });
});

describe('sliceRoute', () => {
  const r: LonLat[] = [[0, 0], [1, 0], [2, 0]];
  it('returns a sub-line with interpolated ends and inner vertices', () => {
    const L = routeLengthKm(r);
    const s = sliceRoute(r, L * 0.25, L * 0.75);
    expect(s[0][0]).toBeCloseTo(0.5, 4);
    expect(s[1]).toEqual([1, 0]);
    expect(s.at(-1)![0]).toBeCloseTo(1.5, 4);
  });
});

describe('airspace features', () => {
  it('are small, correctly wound polygons (area < 1% of sphere)', () => {
    for (const f of [...MILITARY_AREAS, REGULATED_SECTOR]) expect(geoArea(f)).toBeLessThan(0.01 * 4 * Math.PI);
  });
});
