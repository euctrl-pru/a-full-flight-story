import { geoConicConformal, type GeoProjection } from 'd3-geo';

export const EUROPE_FRAME: GeoJSON.MultiPoint = { type: 'MultiPoint', coordinates: [[-11, 35], [32, 35], [38, 61], [-14, 61]] };
export const ROUTE_FRAME: GeoJSON.MultiPoint = { type: 'MultiPoint', coordinates: [[2.5, 51.6], [13.8, 51.6], [13.8, 41.2], [2.5, 41.2]] };

export function makeProjection(width: number, height: number, frame: GeoJSON.GeoJsonObject = EUROPE_FRAME, pad = 24): GeoProjection {
  const w = Math.max(width, pad * 2 + 1), h = Math.max(height, pad * 2 + 1);
  return geoConicConformal().parallels([40, 58]).rotate([-10, 0]).fitExtent([[pad, pad], [w - pad, h - pad]], frame as any);
}
