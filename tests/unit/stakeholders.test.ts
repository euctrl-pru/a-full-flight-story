import { describe, it, expect } from 'vitest';
import { ACTORS, PHASES, matrix } from '$lib/story/stakeholders';
import { EVENTS } from '$lib/story/flight';

describe('stakeholder matrix', () => {
  it('every event actor and phase is known', () => {
    const actors = new Set(ACTORS.map((a) => a.id)), phases = new Set(PHASES.map((p) => p.id));
    for (const e of EVENTS) { expect(actors.has(e.actor), e.id).toBe(true); expect(phases.has(e.phase), e.id).toBe(true); }
  });
  it('accounts for every event exactly once', () => {
    expect(matrix(EVENTS).reduce((s, c) => s + c.events.length, 0)).toBe(EVENTS.length);
  });
  it('every actor appears at least once in the hero timeline', () => {
    const seen = new Set(EVENTS.map((e) => e.actor));
    for (const a of ACTORS) expect(seen.has(a.id), a.id).toBe(true);
  });
});
