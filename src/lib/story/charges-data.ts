import type { ChargeZone } from '$lib/sim/charges';
import { msg } from '$lib/i18n/msg';
import { ISO } from '$lib/geo/countries';

/** Global unit rates (EUR) applicable to October 2026 flights, CRCO [S34]. */
export const ZONES: ChargeZone[] = [
  { id: 'BELU', get label() { return msg('zone_BELU'); }, isos: [ISO.BE, ISO.LU], unitRateEur: 116.65, source: 'S34' },
  { id: 'FR', get label() { return msg('zone_FR'); }, isos: [ISO.FR], unitRateEur: 79.58, source: 'S34' },
  { id: 'DE', get label() { return msg('zone_DE'); }, isos: [ISO.DE], unitRateEur: 97.89, source: 'S34' },
  { id: 'CH', get label() { return msg('zone_CH'); }, isos: [ISO.CH], unitRateEur: 167.12, source: 'S34' },
  { id: 'IT', get label() { return msg('zone_IT'); }, isos: [ISO.IT], unitRateEur: 73.71, source: 'S34' }
];
