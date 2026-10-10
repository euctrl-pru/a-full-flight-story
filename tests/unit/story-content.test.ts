import { describe, it, expect } from 'vitest';
import { CHAPTERS, chapter } from '$lib/story/chapters';
import { citedIds, termIds, varIds } from '$lib/story/richtext';
import { ENTITY_KEYS } from '$lib/data/eurocontrol';
import { SOURCES } from '$lib/story/sources';
import { GLOSSARY } from '$lib/story/glossary';

const steps = CHAPTERS.flatMap((c) => c.steps.map((s) => ({ c, s })));

describe('story content', () => {
  it('has unique chapter and step ids', () => {
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
    expect(new Set(steps.map(({ s }) => s.id)).size).toBe(steps.length);
  });
  it('every step cites a source or is flagged illustrative (sources everywhere)', () => {
    for (const { s } of steps) expect(citedIds(s.text).length > 0 || s.illustrative === true, s.id).toBe(true);
  });
  it('every non-illustrative factual step has at least one citation', () => {
    for (const { s } of steps) if (!s.illustrative) expect(citedIds(s.text).length, s.id).toBeGreaterThan(0);
  });
  it('every citation resolves and every term is in the glossary', () => {
    for (const { s } of steps) {
      for (const id of citedIds(s.text)) expect(SOURCES[id], `${s.id} → ${id}`).toBeDefined();
      for (const t of termIds(s.text)) expect(GLOSSARY[t], `${s.id} → {${t}}`).toBeDefined();
    }
  });
  it('mission clock never runs backwards', () => {
    const clocks = steps.map(({ c, s }) => s.clock ?? c.clock);
    for (let i = 1; i < clocks.length; i++) expect(clocks[i], steps[i].s.id).toBeGreaterThanOrEqual(clocks[i - 1]);
  });
  it('mentions no [unverified] research claim', () => {
    for (const { s } of steps) expect(s.text).not.toMatch(/unverified/i);
  });
  it('chapter() throws for unknown ids', () => {
    expect(() => chapter('nope')).toThrow();
  });
});

describe('data tokens in copy', () => {
  it('only uses known token names and arguments', () => {
    for (const { s } of steps) for (const v of varIds(s.text)) {
      if (v.name === 'date') expect(ENTITY_KEYS as readonly string[], s.id).toContain(v.arg);
      else if (v.name === 'live') expect(v.arg, s.id).toBe('report');
      else throw new Error(`${s.id}: unknown token ${v.name}`);
    }
  });
  it('no step claims "yesterday" literally', () => {
    for (const { s } of steps) expect(s.text, s.id).not.toMatch(/\byesterday\b/i);
  });
});
