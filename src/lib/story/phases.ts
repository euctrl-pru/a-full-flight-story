import type { AtmPhase, ChapterDef } from './types';
import type { Phase } from './flight';

export interface PhaseDef { id: AtmPhase; label: string; horizon: string; decides: string; sources: string[]; color: string }

/** ATFCM phases (research §1–2, §9; ATFCM Operations Manual [S8]). */
export const ATM_PHASES: PhaseDef[] = [
  { id: 'strategic', label: 'Strategic', horizon: '~18 months to ~1 week before', decides: 'Airport slots, airline schedules, the route network and how much capacity each piece of sky will offer.', sources: ['S8', 'S21', 'S25'], color: 'var(--phase-strategic)' },
  { id: 'pretactical', label: 'Pre-tactical', horizon: 'D−6 to D−1', decides: 'Each day’s demand against capacity, military airspace bookings and the next day’s flow plan.', sources: ['S8', 'S19'], color: 'var(--phase-pretactical)' },
  { id: 'tactical', label: 'Tactical', horizon: 'Day of operation', decides: 'Regulations and take-off slots, reroutes, the airport turnaround and every control hand-over.', sources: ['S7', 'S13'], color: 'var(--phase-tactical)' },
  { id: 'postops', label: 'Post-operations', horizon: 'After the flight', decides: 'Delay attribution, route-charge billing, performance review and lessons for the next season.', sources: ['S8', 'S32', 'S37'], color: 'var(--phase-postops)' }
];

export const phaseIndex = (id: AtmPhase) => ATM_PHASES.findIndex((p) => p.id === id);
export function phaseOf(id: AtmPhase): PhaseDef {
  const p = ATM_PHASES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown phase ${id}`);
  return p;
}

export function atmPhaseOfEvent(p: Phase): AtmPhase {
  switch (p) {
    case 'strategic': return 'strategic';
    case 'pretactical': case 'filing': return 'pretactical';
    case 'postops': return 'postops';
    default: return 'tactical';
  }
}

export function firstChapterOfPhase(chapters: ChapterDef[]): Record<AtmPhase, string> {
  const out = {} as Record<AtmPhase, string>;
  for (const c of chapters) if (c.phase && !(c.phase in out)) out[c.phase] = c.id;
  return out;
}

export function phaseClockRanges(chapters: ChapterDef[]) {
  const starts = ATM_PHASES.map((p) => {
    const clocks = chapters.filter((c) => c.phase === p.id).flatMap((c) => c.steps.map((s) => s.clock ?? c.clock));
    return { id: p.id, start: Math.min(...clocks) };
  });
  return starts.map((s, i) => ({ id: s.id, start: s.start, end: starts[i + 1]?.start ?? 1 }));
}
