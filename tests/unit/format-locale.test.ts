import { describe, it, expect } from 'vitest';
import { withLocale } from '$lib/i18n/msg';
import { fmtInt, fmtDate, fmtDateTime, doyLabel } from '$lib/viz/chart-utils';
import { fmtDayShort, dayPhrase } from '$lib/story/freshness';

const now = new Date('2026-10-10T11:00:00Z');
describe('locale-aware formatting', () => {
  it('keeps English output unchanged', () => withLocale('en', () => {
    expect(fmtInt(37034)).toBe('37,034');
    expect(fmtDate('2026-10-08')).toBe('8 Oct 2026');
    expect(fmtDayShort('2026-10-08')).toBe('Thu 8 Oct');
    expect(doyLabel(182)).toBe('1 Jul');
  }));
  it('formats German, French and Polish numbers and dates natively', () => {
    expect(withLocale('de', () => fmtInt(37034))).toBe(new Intl.NumberFormat('de').format(37034));
    expect(withLocale('de', () => fmtDate('2026-10-08'))).toMatch(/Okt/);
    expect(withLocale('fr', () => fmtDayShort('2026-10-08'))).toMatch(/oct/);
    expect(withLocale('pl', () => fmtInt(37034))).toBe(new Intl.NumberFormat('pl').format(37034));
  });
  it('formats UTC date-times per locale', () => {
    expect(withLocale('en', () => fmtDateTime('2026-10-08T11:05:00Z'))).toBe('8 Oct 2026, 11:05');
    expect(withLocale('de', () => fmtDateTime('2026-10-08T11:05:00Z'))).toBe(new Intl.DateTimeFormat('de', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date('2026-10-08T11:05:00Z')));
  });
  it('freshness phrases come from the active locale’s messages', () => {
    expect(withLocale('en', () => dayPhrase('2026-10-09', now))).toBe('yesterday (Fri 9 Oct)');
    expect(withLocale('en', () => dayPhrase(null, now))).toBe('on the latest day available');
  });
});
