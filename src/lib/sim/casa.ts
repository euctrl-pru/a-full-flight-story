export interface CasaFlight { id: string; eto: number; etot: number }
export interface Regulation { id: string; start: number; end: number; rate: number }
export interface Allocation { id: string; eto: number; slotIndex: number | null; entry: number; delay: number; ctot: number; regulated: boolean }

export const SLOT_TOLERANCE = { before: 5, after: 10 } as const;
export const withinSlotWindow = (atot: number, ctot: number) => atot >= ctot - SLOT_TOLERANCE.before && atot <= ctot + SLOT_TOLERANCE.after;

export function slotTimes(reg: Regulation): number[] {
  const interval = 60 / reg.rate;
  const n = Math.round(((reg.end - reg.start) * reg.rate) / 60);
  return Array.from({ length: n }, (_, k) => reg.start + k * interval);
}

/**
 * Simplified CASA: flights entering during the regulation are ordered by ETO (first planned,
 * first served [S7]). Slot k covers [start + k·i, start + (k+1)·i). A flight keeps its ETO if its own
 * slot is free; otherwise it takes the next free slot and enters at that slot's start time.
 * Slots continue past `end` if demand overflows. Delays are whole minutes.
 */
export function allocateSlots(flights: CasaFlight[], reg: Regulation): Allocation[] {
  const interval = 60 / reg.rate;
  const inReg = flights
    .filter((f) => f.eto >= reg.start && f.eto < reg.end)
    .sort((a, b) => a.eto - b.eto || a.id.localeCompare(b.id));
  const byId = new Map<string, Allocation>();
  let nextFree = 0;
  for (const f of inReg) {
    const own = Math.floor((f.eto - reg.start) / interval);
    const k = Math.max(own, nextFree);
    const entry = k === own ? f.eto : reg.start + k * interval;
    const delay = Math.round(entry - f.eto);
    nextFree = k + 1;
    byId.set(f.id, { id: f.id, eto: f.eto, slotIndex: k, entry, delay, ctot: f.etot + delay, regulated: true });
  }
  return flights.map((f) => byId.get(f.id) ?? { id: f.id, eto: f.eto, slotIndex: null, entry: f.eto, delay: 0, ctot: f.etot, regulated: false });
}
