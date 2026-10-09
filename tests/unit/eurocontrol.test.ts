import { describe, it, expect } from 'vitest';
import syncEbbr from '../fixtures/eurocontrol/sync-ebbr.json';
import syncEmpty from '../fixtures/eurocontrol/sync-empty.json';
import trafficCharts from '../fixtures/eurocontrol/traffic_charts-network.json';
import delayCharts from '../fixtures/eurocontrol/delay_charts-network.json';
import trafficNet from '../fixtures/eurocontrol/traffic_networks-network.json';
import delayNet from '../fixtures/eurocontrol/delay_networks-network.json';
import {
  apiUrl, parseSync, parseCharts, parseHeadline, findSeries, fetchBundle, ENTITIES
} from '$lib/data/eurocontrol';

describe('apiUrl', () => {
  it('encodes bracket params', () => {
    expect(apiUrl('syncs', { 'order[syncDate]': 'desc', 'airport.id': 1 })).toBe(
      'https://api-data-app.eurocontrol.int/api/syncs?order%5BsyncDate%5D=desc&airport.id=1'
    );
  });
});

describe('parseSync', () => {
  it('returns id and date', () => {
    const s = parseSync(syncEbbr);
    expect(s.id).toBeTypeOf('number');
    expect(s.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('throws on empty result', () => {
    expect(() => parseSync(syncEmpty)).toThrow(/no sync/i);
  });
  it('throws on malformed payload', () => {
    expect(() => parseSync({ nope: true })).toThrow();
  });
});

describe('parseCharts', () => {
  it('normalises traffic series', () => {
    const s = parseCharts(trafficCharts);
    const names = s.filter((x) => x.chartType === 'daily_evolution').map((x) => x.name);
    expect(names).toContain('2019');
    for (const x of s) for (const p of x.points) {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(p.value)).toBe(true);
    }
  });
  it('keeps delay cause categories', () => {
    const s = parseCharts(delayCharts);
    const y2d = s.filter((x) => x.chartType === 'category_evolution' && x.dateRange === 'Y2D').map((x) => x.name);
    expect(y2d).toEqual(expect.arrayContaining(['Aerodrome capacity', 'Capacity/Staffing (ATC)', 'Disruptions (ATC)', 'Weather', 'Other']));
  });
  it('drops non-finite values', () => {
    const s = parseCharts({ data: [{ chartType: 'x', name: 'n', data: [{ date: '2026-01-01T00:00:00+00:00', value: null }, { date: '2026-01-02T00:00:00+00:00', value: 3 }] }] });
    expect(s[0].points).toEqual([{ date: '2026-01-02', value: 3 }]);
  });
});

describe('parseHeadline', () => {
  it('reads yesterday flights and delay', () => {
    const h = parseHeadline(trafficNet, delayNet);
    expect(h.flights).toBeGreaterThan(10000);
    expect(h.delayMinutes).not.toBeNull();
  });
  it('returns nulls when rows are missing', () => {
    expect(parseHeadline({ data: [] }, { data: [] })).toEqual({ flights: null, delayMinutes: null, delayPerFlight: null });
  });
});

describe('findSeries', () => {
  it('matches by chartType, dateRange and name regex', () => {
    const s = parseCharts(delayCharts);
    expect(findSeries(s, { chartType: 'category_evolution', dateRange: 'Y2D', name: /^Weather$/ })?.points.length).toBeGreaterThan(30);
  });
});

describe('fetchBundle', () => {
  it('assembles a bundle with an injected fetch', async () => {
    const f = (async (url: string) => {
      const u = new URL(url);
      const map: Record<string, unknown> = {
        '/api/syncs': { data: [{ id: 7, syncDate: '2026-10-08T00:00:00+00:00' }] },
        '/api/traffic_charts': trafficCharts,
        '/api/delay_charts': delayCharts,
        '/api/punctualities_charts': { data: [] },
        '/api/co2_charts': { data: [] },
        '/api/traffic_networks': trafficNet,
        '/api/delay_networks': delayNet
      };
      return new Response(JSON.stringify(map[u.pathname] ?? {}), { status: 200 });
    }) as typeof fetch;
    const b = await fetchBundle('network', f);
    expect(b).toMatchObject({ key: 'network', label: ENTITIES.network.label, syncId: 7, dataDate: '2026-10-08' });
    expect(b.traffic.length).toBeGreaterThan(0);
    expect(b.headline.flights).toBeGreaterThan(0);
  });
  it('rejects on HTTP errors', async () => {
    const f = (async () => new Response('x', { status: 503 })) as typeof fetch;
    await expect(fetchBundle('EBBR', f)).rejects.toThrow(/503/);
  });
});

describe('trimForSnapshot', () => {
  it('keeps only the series the story draws', async () => {
    const { trimForSnapshot } = await import('$lib/data/eurocontrol');
    const b = {
      key: 'network' as const, label: 'n', syncId: 1, dataDate: '2026-10-08',
      traffic: parseCharts(trafficCharts), delay: parseCharts(delayCharts), punctuality: [], co2: [],
      headline: { flights: 1, delayMinutes: 1, delayPerFlight: 1 }
    };
    const t = trimForSnapshot(b);
    expect(new Set(t.traffic.map((s) => s.chartType))).toEqual(new Set(['daily_evolution', 'forecast']));
    expect(t.traffic.some((s) => s.name === '2020')).toBe(false);
    expect(t.delay.every((s) => s.chartType === 'category_evolution' && (s.dateRange === 'DY' || s.dateRange === 'Y2D'))).toBe(true);
    expect(t.delay.some((s) => /2025/.test(s.name))).toBe(false);
    expect(t.delay.length).toBe(10);
    expect(t.headline).toEqual(b.headline);
  });
});
