import { describe, it, expect } from 'vitest';
import { parseOpenSky, parseAdsbLol, makeSnapshot, adsbLolTiles, minutesAgo, ageLabel, EUROPE_BBOX, newerSky, fetchAdsbLolTiles } from '$lib/data/sky';

const os = {
  time: 1791559444,
  states: [
    ['39de4f', 'TVF56MG ', 'France', 1, 1, 6.8016, 56.0225, 11887.2, false, 240.65, 22.23, 0, null, 11940.54, '2556', false, 0],
    ['aaaaaa', 'GND1    ', 'France', 1, 1, 4.48, 50.9, 30, true, 5, 90, 0, null, 30, null, false, 0],
    ['bbbbbb', null, 'Italy', 1, 1, null, null, 9000, false, 200, 10, 0, null, 9000, null, false, 0],
    ['cccccc', 'NOALT', 'Italy', 1, 1, 12, 42, null, false, 200, 10, 0, null, null, null, false, 0]
  ]
};

describe('parseOpenSky', () => {
  it('keeps airborne positioned aircraft and converts units', () => {
    expect(parseOpenSky(os)).toEqual([{ id: '39de4f', cs: 'TVF56MG', lon: 6.8016, lat: 56.0225, alt: 39000, trk: 22, gs: 468 }]);
  });
  it('tolerates null states', () => {
    expect(parseOpenSky({ time: 1, states: null })).toEqual([]);
  });
});

describe('parseAdsbLol', () => {
  it('skips ground and unpositioned aircraft', () => {
    const j = { ac: [
      { hex: '4ca802', flight: 'RYR42MV ', lat: 50.1, lon: 4.2, alt_baro: 35000, track: 182.4, gs: 419.8 },
      { hex: 'x1', flight: 'G', lat: 50, lon: 4, alt_baro: 'ground', track: 0, gs: 0 },
      { hex: 'x2', alt_baro: 10000 }
    ] };
    expect(parseAdsbLol(j)).toEqual([{ id: '4ca802', cs: 'RYR42MV', lon: 4.2, lat: 50.1, alt: 35000, trk: 182, gs: 420 }]);
  });
});

describe('makeSnapshot', () => {
  it('dedupes by id, filters to Europe and rounds', () => {
    const a = { id: 'a', cs: 'A', lon: 4.123456, lat: 50.987654, alt: 35049, trk: 10, gs: 400 };
    const out = makeSnapshot('opensky', [a, { ...a }, { ...a, id: 'far', lon: -80 }], '2026-10-09T15:00:00Z');
    expect(out).toEqual({ fetchedAt: '2026-10-09T15:00:00Z', source: 'opensky', count: 1, aircraft: [{ ...a, lon: 4.123, lat: 50.988, alt: 35000 }] });
  });
});

describe('tiles and age', () => {
  it('covers the bbox with tile centres inside it', () => {
    const t = adsbLolTiles(EUROPE_BBOX);
    expect(t.length).toBeGreaterThanOrEqual(20);
    for (const p of t) {
      expect(p.lat).toBeGreaterThanOrEqual(EUROPE_BBOX.lamin);
      expect(p.lon).toBeLessThanOrEqual(EUROPE_BBOX.lomax);
    }
  });
  it('formats age honestly', () => {
    const now = Date.parse('2026-10-09T15:00:00Z');
    expect(minutesAgo('2026-10-09T14:47:00Z', now)).toBe(13);
    expect(ageLabel('2026-10-09T14:47:00Z', now)).toBe('13 min ago');
    expect(ageLabel('2026-10-09T11:30:00Z', now)).toBe('3 h 30 min ago');
    expect(ageLabel('2026-10-07T15:00:00Z', now)).toBe('2 days ago');
  });
});


describe('newerSky', () => {
  const snap = (fetchedAt: string, count = 1) => ({ fetchedAt, source: 'opensky' as const, count, aircraft: [] });
  it('accepts a newer, well-formed snapshot', () => {
    expect(newerSky(snap('2026-10-10T10:00:00Z'), snap('2026-10-10T10:10:00Z'))).toBe(true);
    expect(newerSky(null, snap('2026-10-10T10:10:00Z'))).toBe(true);
  });
  it('rejects older, equal, empty or malformed payloads', () => {
    const cur = snap('2026-10-10T10:10:00Z');
    expect(newerSky(cur, snap('2026-10-10T10:00:00Z'))).toBe(false);
    expect(newerSky(cur, snap('2026-10-10T10:10:00Z'))).toBe(false);
    expect(newerSky(cur, snap('2026-10-10T10:20:00Z', 0))).toBe(false);
    expect(newerSky(cur, { nope: true })).toBe(false);
    expect(newerSky(cur, null)).toBe(false);
  });
});

describe('fetchAdsbLolTiles', () => {
  it('keeps going when one tile throws', async () => {
    let n = 0;
    const f = (async () => {
      n++;
      if (n === 2) throw new TypeError('network');
      return new Response(JSON.stringify({ ac: [{ hex: `h${n}`, flight: 'X', lat: 50, lon: 4, alt_baro: 30000, track: 0, gs: 400 }] }));
    }) as typeof fetch;
    const r = await fetchAdsbLolTiles(f, [{ lat: 1, lon: 1 }, { lat: 2, lon: 2 }, { lat: 3, lon: 3 }], 0);
    expect(r).toMatchObject({ ok: 2, failed: 1 });
    expect(r.aircraft.map((a) => a.id)).toEqual(['h1', 'h3']);
  });
});
