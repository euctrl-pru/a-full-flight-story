import { describe, it, expect } from 'vitest';
import { dayOfYear, yearOfSeries, stackByName } from '$lib/data/series';

describe('series helpers', () => {
  it('dayOfYear is 1-based UTC', () => {
    expect(dayOfYear('2026-01-01')).toBe(1);
    expect(dayOfYear('2026-12-31')).toBe(365);
    expect(dayOfYear('2024-12-31')).toBe(366);
  });
  it('yearOfSeries reads a year from the name', () => {
    expect(yearOfSeries({ name: '2019', chartType: '', dateRange: null, share: null, points: [] })).toBe(2019);
    expect(yearOfSeries({ name: "% of delayed flights >15' 2025", chartType: '', dateRange: null, share: null, points: [] })).toBe(2025);
    expect(yearOfSeries({ name: 'Weather', chartType: '', dateRange: null, share: null, points: [] })).toBeNull();
  });
  it('stackByName aligns dates and fills gaps with 0', () => {
    const mk = (name: string, pts: [string, number][]) => ({ name, chartType: 'c', dateRange: 'Y2D', share: null, points: pts.map(([date, value]) => ({ date, value })) });
    const rows = stackByName([mk('A', [['2026-01-01', 1], ['2026-01-02', 2]]), mk('B', [['2026-01-02', 5]])], ['A', 'B']);
    expect(rows).toEqual([
      { date: '2026-01-01', values: { A: 1, B: 0 } },
      { date: '2026-01-02', values: { A: 2, B: 5 } }
    ]);
  });
});
