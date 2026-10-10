import { describe, it, expect } from 'vitest';
import { ATM_PHASES, phaseIndex, atmPhaseOfEvent, firstChapterOfPhase, phaseClockRanges } from '$lib/story/phases';
import { CHAPTERS } from '$lib/story/chapters';
import { EVENTS } from '$lib/story/flight';
import { SOURCES } from '$lib/story/sources';

describe('ATM phases', () => {
  it('are ordered and cited', () => {
    expect(ATM_PHASES.map((p) => p.id)).toEqual(['strategic', 'pretactical', 'tactical', 'postops']);
    for (const p of ATM_PHASES) {
      expect(p.sources.length).toBeGreaterThan(0);
      for (const s of p.sources) expect(SOURCES[s], `${p.id} → ${s}`).toBeDefined();
      expect(p.color).toBe(`var(--phase-${p.id})`);
    }
  });
  it('every chapter except the cold open has a phase and phases never go backwards', () => {
    expect(CHAPTERS[0].phase).toBeNull();
    const idx = CHAPTERS.slice(1).map((c) => phaseIndex(c.phase!));
    expect(idx.every((i) => i >= 0)).toBe(true);
    for (let i = 1; i < idx.length; i++) expect(idx[i]).toBeGreaterThanOrEqual(idx[i - 1]);
  });
  it('chapter 2 is split so the pre-tactical steps open their own chapter', () => {
    expect(CHAPTERS.find((c) => c.id === 'airspace')!.phase).toBe('strategic');
    const wb = CHAPTERS.find((c) => c.id === 'week-before')!;
    expect(wb.phase).toBe('pretactical');
    expect(wb.steps.map((s) => s.id)).toEqual(['as-military', 'as-pretactical']);
  });
  it('maps flight events to ATM phases', () => {
    expect(atmPhaseOfEvent('filing')).toBe('pretactical');
    expect(atmPhaseOfEvent('ground')).toBe('tactical');
    expect(atmPhaseOfEvent('arrival')).toBe('tactical');
    for (const e of EVENTS) expect(phaseIndex(atmPhaseOfEvent(e.phase))).toBeGreaterThanOrEqual(0);
  });
  it('finds the first chapter of each phase', () => {
    expect(firstChapterOfPhase(CHAPTERS)).toEqual({ strategic: 'strategic', pretactical: 'week-before', tactical: 'twist', postops: 'postops' });
  });
  it('derives contiguous clock ranges ending at 1', () => {
    const r = phaseClockRanges(CHAPTERS);
    expect(r.map((x) => x.id)).toEqual(['strategic', 'pretactical', 'tactical', 'postops']);
    for (let i = 0; i < r.length; i++) {
      expect(r[i].start).toBeLessThan(r[i].end);
      if (i > 0) expect(r[i].start).toBe(r[i - 1].end);
    }
    expect(r.at(-1)!.end).toBe(1);
  });
});
