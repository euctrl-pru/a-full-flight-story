import { describe, it, expect } from 'vitest';
import { statSync } from 'node:fs';
import { loadCountries, ISO } from '$lib/geo/countries';

describe('europe topology', () => {
  it('is within budget and contains every route country', async () => {
    expect(statSync('src/lib/geo/europe.topo.json').size).toBeLessThanOrEqual(120 * 1024);
    const ids = new Set((await loadCountries()).features.map((f) => String(f.id)));
    for (const iso of Object.values(ISO)) expect(ids.has(iso), iso).toBe(true);
  });
});
