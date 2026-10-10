import { describe, it, expect } from 'vitest';
import { makeProjection, lerpProjection, EUROPE_FRAME, ROUTE_FRAME, ROME_FRAME } from '$lib/geo/projection';
import { projectionTransform } from '$lib/geo/map-transform';

const apply = (t: { k: number; tx: number; ty: number; bx: number; by: number }, p: [number, number]) =>
  [t.tx + t.k * (p[0] - t.bx), t.ty + t.k * (p[1] - t.by)];

describe('projectionTransform', () => {
  it('maps the base projection exactly onto any zoomed projection', () => {
    const base = makeProjection(900, 600, EUROPE_FRAME);
    for (const cur of [makeProjection(900, 600, ROUTE_FRAME), lerpProjection(900, 600, ROUTE_FRAME, ROME_FRAME, 0.37)]) {
      const t = projectionTransform(base, cur);
      for (const ll of [[4.48, 50.9], [12.24, 41.8], [-3.7, 40.4], [24.9, 60.2]] as [number, number][]) {
        const [x, y] = apply(t, base(ll)!);
        const [cx, cy] = cur(ll)!;
        expect(x).toBeCloseTo(cx, 6);
        expect(y).toBeCloseTo(cy, 6);
      }
      expect(t.transform).toMatch(/^translate\(.+\) scale\(.+\) translate\(.+\)$/);
    }
  });
});
