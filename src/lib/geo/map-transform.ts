import type { GeoProjection } from 'd3-geo';

/**
 * makeProjection/lerpProjection only differ in scale and translate (same rotation & parallels),
 * so `cur(p) = t_c + (k_c/k_b) * (base(p) - t_b)` exactly — an SVG transform, no re-projection needed.
 */
export function projectionTransform(base: GeoProjection, cur: GeoProjection) {
  const k = cur.scale() / base.scale();
  const [bx, by] = base.translate();
  const [tx, ty] = cur.translate();
  return { k, tx, ty, bx, by, transform: `translate(${tx},${ty}) scale(${k}) translate(${-bx},${-by})` };
}
