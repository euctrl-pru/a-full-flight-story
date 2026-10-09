import type { Span } from '$lib/geo/route';

export interface ChargeZone { id: string; label: string; isos: string[]; unitRateEur: number; source: string }
export interface ZoneCharge { zone: ChargeZone; km: number; chargeableKm: number; dFactor: number; charge: number }

const r2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
export const weightFactor = (mtowT: number) => r2(Math.sqrt(mtowT / 50));
export const distanceFactor = (km: number) => r2(km / 100);
export const zoneCharge = (km: number, mtowT: number, rate: number) => r2(rate * distanceFactor(km) * weightFactor(mtowT));

export function routeCharges(spans: Span[], zones: ChargeZone[], mtowT: number): ZoneCharge[] {
  const zoneOf = (iso: string) => zones.find((z) => z.isos.includes(iso));
  const order: ChargeZone[] = [];
  const km = new Map<string, number>();
  for (const s of spans) {
    const z = zoneOf(s.id);
    if (!z) continue;
    if (!km.has(z.id)) order.push(z);
    km.set(z.id, (km.get(z.id) ?? 0) + (s.endKm - s.startKm));
  }
  const first = spans.length ? zoneOf(spans[0].id)?.id : undefined;
  const last = spans.length ? zoneOf(spans[spans.length - 1].id)?.id : undefined;
  return order.map((zone) => {
    const k = Math.round(km.get(zone.id)!);
    const deduct = (zone.id === first ? 20 : 0) + (zone.id === last ? 20 : 0);
    const chargeableKm = Math.max(0, k - deduct);
    return { zone, km: k, chargeableKm, dFactor: distanceFactor(chargeableKm), charge: zoneCharge(chargeableKm, mtowT, zone.unitRateEur) };
  });
}
