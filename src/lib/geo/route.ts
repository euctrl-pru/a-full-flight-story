import { geoDistance, geoInterpolate, geoContains } from 'd3-geo';

export type LonLat = [number, number];
export const EARTH_KM = 6371.0088;
export interface Span<T extends string = string> { id: T; startKm: number; endKm: number }

export const distKm = (a: LonLat, b: LonLat) => geoDistance(a, b) * EARTH_KM;

export function cumulativeKm(route: LonLat[]): number[] {
  const out = [0];
  for (let i = 1; i < route.length; i++) out.push(out[i - 1] + distKm(route[i - 1], route[i]));
  return out;
}
export const routeLengthKm = (route: LonLat[]) => cumulativeKm(route).at(-1)!;

const rad = Math.PI / 180;
export function bearing(a: LonLat, b: LonLat): number {
  const [l1, p1] = [a[0] * rad, a[1] * rad];
  const [l2, p2] = [b[0] * rad, b[1] * rad];
  const y = Math.sin(l2 - l1) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(l2 - l1);
  return (Math.atan2(y, x) / rad + 360) % 360;
}

export function pointAtKm(route: LonLat[], d: number): { lonlat: LonLat; bearing: number } {
  const cum = cumulativeKm(route);
  const total = cum.at(-1)!;
  const dd = Math.min(Math.max(d, 0), total);
  let i = 1;
  while (i < cum.length - 1 && cum[i] < dd) i++;
  const a = route[i - 1], b = route[i];
  const segLen = cum[i] - cum[i - 1] || 1;
  const f = (dd - cum[i - 1]) / segLen;
  const interp = geoInterpolate(a, b);
  const p = interp(f) as LonLat;
  const ahead = interp(Math.min(1, f + 1e-3)) as LonLat;
  const behind = interp(Math.max(0, f - 1e-3)) as LonLat;
  return { lonlat: p, bearing: bearing(f >= 1 ? behind : p, f >= 1 ? p : ahead) };
}

export function sampleRoute(route: LonLat[], stepKm = 5): { d: number; p: LonLat }[] {
  const total = routeLengthKm(route);
  const out: { d: number; p: LonLat }[] = [];
  for (let d = 0; d < total; d += stepKm) out.push({ d, p: pointAtKm(route, d).lonlat });
  return out;
}

export function mergeSamples<T extends string>(samples: { d: number; id: T | null }[], totalKm: number, minKm = 15): Span<T>[] {
  const firstId = samples.find((s) => s.id !== null)?.id ?? null;
  if (firstId === null) return [];
  let prev: T = firstId;
  const filled = samples.map((s) => ({ d: s.d, id: (prev = s.id ?? prev) }));
  const spans: Span<T>[] = [];
  for (const s of filled) {
    const last = spans.at(-1);
    if (last && last.id === s.id) continue;
    if (last) last.endKm = s.d;
    spans.push({ id: s.id, startKm: spans.length ? s.d : 0, endKm: totalKm });
  }
  // 1) collapse short flickers A-x-A into A
  for (let i = 1; i < spans.length - 1; ) {
    const s = spans[i];
    if (s.endKm - s.startKm < minKm && spans[i - 1].id === spans[i + 1].id) {
      spans[i - 1].endKm = spans[i + 1].endKm;
      spans.splice(i, 2);
      i = Math.max(1, i - 1);
    } else i++;
  }
  // 2) absorb remaining short interior spans into the previous one (first and last spans are kept)
  const out: Span<T>[] = [];
  spans.forEach((s, i) => {
    const last = out.at(-1);
    const shortInterior = i > 0 && i < spans.length - 1 && s.endKm - s.startKm < minKm;
    if (last && (last.id === s.id || shortInterior)) last.endKm = s.endKm;
    else out.push({ ...s });
  });
  return out;
}

export function spansByRegion(route: LonLat[], regions: { id: string; feature: GeoJSON.Feature | GeoJSON.Geometry }[], stepKm = 5): Span[] {
  const samples = sampleRoute(route, stepKm).map(({ d, p }) => ({
    d,
    id: regions.find((r) => geoContains(r.feature as GeoJSON.Feature, p))?.id ?? null
  }));
  return mergeSamples(samples, routeLengthKm(route));
}

export function sliceRoute(route: LonLat[], fromKm: number, toKm: number): LonLat[] {
  const cum = cumulativeKm(route);
  const out: LonLat[] = [pointAtKm(route, fromKm).lonlat];
  for (let i = 1; i < route.length - 1; i++) if (cum[i] > fromKm && cum[i] < toKm) out.push(route[i]);
  out.push(pointAtKm(route, toKm).lonlat);
  return out;
}
