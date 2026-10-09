import { allocateSlots, type CasaFlight, type Regulation } from '$lib/sim/casa';
import { generateDemand, type DemandConfig } from '$lib/sim/demand';
import { HERO } from './flight';

const hm = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);

/** Illustrative regulation on a Reims sector group, 05:00–09:00 UTC at the ATFCM manual's 28/h [S7]. */
export const REGULATION: Regulation = { id: 'LFEERS10', start: 300, end: 540, rate: 28 };

/** Seed is tuned so FFS101 gets exactly HERO.ctotDelayMin (see Task 8 Step 4). */
export const DEMAND_CONFIG: DemandConfig = { seed: 58, from: 240, to: 600, baseRate: 24, peakRate: 46, peakAt: 360, peakWidth: 60 };

const etot = hm(HERO.std) + HERO.taxiOutMin; // 05:15
export const HERO_CASA: CasaFlight = { id: HERO.callsign, etot, eto: etot + 31 }; // reaches the Reims sector ~31 min after take-off (slot grid makes +27 reachable)

export function scenario(rate = REGULATION.rate) {
  const flights = [...generateDemand(DEMAND_CONFIG), HERO_CASA].sort((a, b) => a.eto - b.eto);
  const allocations = allocateSlots(flights, { ...REGULATION, rate });
  const hero = allocations.find((a) => a.id === HERO.callsign)!;
  return { flights, allocations, hero };
}
