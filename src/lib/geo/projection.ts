import { geoConicConformal, type GeoProjection } from 'd3-geo';

export const EUROPE_FRAME: GeoJSON.MultiPoint = { type: 'MultiPoint', coordinates: [[-11, 35], [32, 35], [38, 61], [-14, 61]] };
export const ROUTE_FRAME: GeoJSON.MultiPoint = { type: 'MultiPoint', coordinates: [[2.5, 51.6], [13.8, 51.6], [13.8, 41.2], [2.5, 41.2]] };

export function makeProjection(width: number, height: number, frame: GeoJSON.GeoJsonObject = EUROPE_FRAME, pad = 24): GeoProjection {
  const w = Math.max(width, pad * 2 + 1), h = Math.max(height, pad * 2 + 1);
  return geoConicConformal().parallels([40, 58]).rotate([-10, 0]).fitExtent([[pad, pad], [w - pad, h - pad]], frame as any);
}

export function lerpProjection(width: number, height: number, from: GeoJSON.GeoJsonObject, to: GeoJSON.GeoJsonObject, t: number): GeoProjection {
  const a = makeProjection(width, height, from), b = makeProjection(width, height, to);
  const k = Math.max(0, Math.min(1, t));
  // log-scale interpolation gives a perceptually even zoom
  const scale = Math.exp(Math.log(a.scale()) * (1 - k) + Math.log(b.scale()) * k);
  // interpolate the geographic point shown at the viewport centre
  const ca = a.invert!([width / 2, height / 2])!, cb = b.invert!([width / 2, height / 2])!;
  const c: [number, number] = [ca[0] * (1 - k) + cb[0] * k, ca[1] * (1 - k) + cb[1] * k];
  const p = geoConicConformal().parallels([40, 58]).rotate([-10, 0]).scale(scale).translate([0, 0]);
  const [cx, cy] = p(c)!;
  return p.translate([width / 2 - cx, height / 2 - cy]);
}

export const ROME_FRAME: GeoJSON.MultiPoint = { type: 'MultiPoint', coordinates: [[10.4, 43.4], [13.4, 43.4], [13.4, 41.3], [10.4, 41.3]] };
