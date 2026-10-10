import { describe, it, expect } from 'vitest';
import { timeScale, hoursFromEobt, scaleHours, phaseSpans, EOBT_ISO, CHAPTER_ANCHORS } from '$lib/story/timescale';
import { EVENTS } from '$lib/story/flight';
import { CHAPTERS } from '$lib/story/chapters';

describe('signed-log time scale', () => {
  it('puts EOBT at 0 and is symmetric', () => {
    expect(timeScale(EOBT_ISO)).toBe(0);
    expect(scaleHours(24)).toBeCloseTo(-scaleHours(-24), 12);
    expect(hoursFromEobt('2026-07-10T07:00:00Z')).toBe(2);
  });
  it('is monotonic over the hero timeline', () => {
    const xs = EVENTS.map((e) => timeScale(e.at));
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1]);
  });
  it('phase spans are contiguous and ascending', () => {
    const s = phaseSpans();
    expect(s.map((x) => x.id)).toEqual(['strategic', 'pretactical', 'tactical', 'postops']);
    for (let i = 1; i < s.length; i++) expect(s[i].from).toBe(s[i - 1].to);
    for (const x of s) expect(x.to).toBeGreaterThan(x.from);
  });
  it('anchors chapters to existing events', () => {
    for (const [ch, ev] of Object.entries(CHAPTER_ANCHORS)) {
      expect(CHAPTERS.some((c) => c.id === ch), ch).toBe(true);
      expect(EVENTS.some((e) => e.id === ev), ev).toBe(true);
    }
  });
});
