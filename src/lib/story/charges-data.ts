import type { ChargeZone } from '$lib/sim/charges';
import { ISO } from '$lib/geo/countries';

/** Global unit rates (EUR) applicable to October 2026 flights, CRCO [S34]. */
export const ZONES: ChargeZone[] = [
  { id: 'BELU', label: 'Belgium–Luxembourg', isos: [ISO.BE, ISO.LU], unitRateEur: 116.65, source: 'S34' },
  { id: 'FR', label: 'France', isos: [ISO.FR], unitRateEur: 79.58, source: 'S34' },
  { id: 'DE', label: 'Germany', isos: [ISO.DE], unitRateEur: 97.89, source: 'S34' },
  { id: 'CH', label: 'Switzerland', isos: [ISO.CH], unitRateEur: 167.12, source: 'S34' },
  { id: 'IT', label: 'Italy', isos: [ISO.IT], unitRateEur: 73.71, source: 'S34' }
];
