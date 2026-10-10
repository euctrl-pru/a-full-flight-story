import type { AtmPhase, ChapterDef } from './types';
import type { Phase } from './flight';

import { msg } from '$lib/i18n/msg';

export interface PhaseDef { id: AtmPhase; label: string; horizon: string; decides: string; sources: string[]; color: string }

const atmPhase = (id: AtmPhase, sources: string[], color: string): PhaseDef => ({
  id, sources, color,
  get label() { return msg(`ph_${id}_label`); },
  get horizon() { return msg(`ph_${id}_horizon`); },
  get decides() { return msg(`ph_${id}_decides`); }
});

/** ATFCM phases (research §1–2, §9; ATFCM Operations Manual [S8]). */
export const ATM_PHASES: PhaseDef[] = [
  atmPhase('strategic', ['S8', 'S21', 'S25'], 'var(--phase-strategic)'),
  atmPhase('pretactical', ['S8', 'S19'], 'var(--phase-pretactical)'),
  atmPhase('tactical', ['S7', 'S13'], 'var(--phase-tactical)'),
  atmPhase('postops', ['S8', 'S32', 'S37'], 'var(--phase-postops)')
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
