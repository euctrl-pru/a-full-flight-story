import { describe, it, expect } from 'vitest';
import { dayPhrase, livePhrase, currentYear, fmtDayShort } from '$lib/story/freshness';

const now = new Date('2026-10-10T11:00:00Z');
describe('freshness phrasing', () => {
  it('formats a short day', () => expect(fmtDayShort('2026-10-08')).toBe('Thu 8 Oct'));
  it('says yesterday only when it is yesterday (UTC)', () => {
    expect(dayPhrase('2026-10-09', now)).toBe('yesterday (Fri 9 Oct)');
    expect(dayPhrase('2026-10-08', now)).toBe('on Thu 8 Oct');
    expect(dayPhrase('2026-10-10', now)).toBe('today (Sat 10 Oct)');
  });
  it('falls back to neutral wording without data', () => {
    expect(dayPhrase(null, now)).toBe('on the latest day available');
    expect(dayPhrase(undefined, now)).toBe('on the latest day available');
  });
  it('describes live vs snapshot', () => {
    expect(livePhrase('live')).toBe('fetched live');
    expect(livePhrase('snapshot')).toBe('from the latest snapshot');
    expect(livePhrase(null)).toBe('from the latest snapshot');
  });
  it('derives the current year from the data date, rolling over', () => {
    expect(currentYear('2027-01-02', now)).toBe(2027);
    expect(currentYear(null, now)).toBe(2026);
  });
});
