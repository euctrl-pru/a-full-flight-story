import { describe, it, expect } from 'vitest';
import { fmtInt, fmtHm, doyLabel, roundedTopBar, nearestIndex, fmtDate } from '$lib/viz/chart-utils';
import { altitudeBin, CAUSES, CAUSE_COLOR, ANSP_COLOR } from '$lib/viz/palette';

describe('chart utils', () => {
  it('formats', () => {
    expect(fmtInt(37034)).toBe('37,034');
    expect(fmtHm(322)).toBe('05:22');
    expect(fmtHm(1440 + 5)).toBe('00:05');
    expect(doyLabel(1)).toBe('1 Jan');
    expect(doyLabel(182)).toBe('1 Jul');
    expect(fmtDate('2026-10-08')).toBe('8 Oct 2026');
  });
  it('rounded bar keeps baseline square and clamps radius', () => {
    expect(roundedTopBar(0, 10, 20, 30, 4)).toBe('M0,40V14Q0,10 4,10H16Q20,10 20,14V40Z');
    expect(roundedTopBar(0, 10, 4, 1, 4)).toBe('M0,11V11Q0,10 1,10H3Q4,10 4,11V11Z');
  });
  it('nearestIndex', () => {
    expect(nearestIndex([0, 10, 20], 14)).toBe(1);
    expect(nearestIndex([0, 10, 20], 16)).toBe(2);
    expect(nearestIndex([0, 10, 20], -5)).toBe(0);
  });
  it('palette maps fixed entities to fixed slots', () => {
    expect(CAUSES.map((c) => CAUSE_COLOR[c])).toEqual(['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)']);
    expect(ANSP_COLOR.MUAC).toBe('var(--series-2)');
    expect(altitudeBin(500)).toBe(0);
    expect(altitudeBin(39000)).toBe(4);
  });
});
