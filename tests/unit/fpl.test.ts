import { describe, it, expect } from 'vitest';
import { fplCoord, buildFpl, HERO_FPL } from '$lib/story/fpl';

describe('fplCoord', () => {
  it('formats ICAO lat/long to the nearest minute', () => {
    expect(fplCoord([6.13, 49.61])).toBe('4937N00608E');
    expect(fplCoord([12.2389, 41.8003])).toBe('4148N01214E');
    expect(fplCoord([-0.999, 49.9999])).toBe('5000N00100W');
  });
});

describe('buildFpl', () => {
  it('wraps items in ICAO FPL syntax and records spans', () => {
    const f = buildFpl([[{ item: '7', label: 'id', value: 'FFS101' }, { item: '8', label: 'rules', value: 'IS' }], [{ item: '13', label: 'dep', value: 'EBBR0500' }]]);
    expect(f.text).toBe('(FPL-FFS101-IS\n-EBBR0500)');
    for (const s of f.spans) expect(f.text.slice(s.start, s.end)).toBe({ '7': 'FFS101', '8': 'IS', '13': 'EBBR0500' }[s.item]);
  });
  it('hero FPL contains every main item exactly once', () => {
    const items = HERO_FPL.spans.map((s) => s.item);
    expect(items).toEqual(['7', '8', '9', '10', '13', '15', '16', '18']);
    expect(HERO_FPL.text.startsWith('(FPL-FFS101-IS')).toBe(true);
    expect(HERO_FPL.text).toContain('DOF/260710');
    expect(HERO_FPL.text.endsWith(')')).toBe(true);
  });
});
