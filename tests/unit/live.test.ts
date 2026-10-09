import { describe, it, expect, vi } from 'vitest';
import { loadEurocontrol, type EcState } from '$lib/data/live';
import type { EurocontrolSnapshot, EntityBundle } from '$lib/data/eurocontrol';

const bundle = (key: 'network' | 'EBBR', dataDate: string, flights: number): EntityBundle => ({
  key, label: key, syncId: 1, dataDate, traffic: [], delay: [], punctuality: [], co2: [],
  headline: { flights, delayMinutes: 0, delayPerFlight: 0 }
});
const snapshot: EurocontrolSnapshot = {
  generatedAt: '2026-10-09T00:00:00Z',
  bundles: { network: bundle('network', '2026-10-07', 100), EBBR: bundle('EBBR', '2026-10-07', 10) },
  report: { date: '2026-10-06', title: 'W40', blocks: [] }
};

function fakeFetch(opts: { snapshot?: unknown; liveDate?: string | null; liveFail?: boolean }) {
  return (async (url: string) => {
    if (url.endsWith('/data/eurocontrol.json')) {
      return opts.snapshot === undefined ? new Response('nf', { status: 404 }) : new Response(JSON.stringify(opts.snapshot));
    }
    if (opts.liveFail) throw new TypeError('Failed to fetch');
    const u = new URL(url);
    if (u.pathname === '/api/syncs') return new Response(JSON.stringify({ data: [{ id: 9, syncDate: `${opts.liveDate}T00:00:00+00:00` }] }));
    if (u.pathname === '/api/traffic_networks')
      return new Response(JSON.stringify({ data: [{ traffic: { rankingCategory: 'network' }, networkType: 'total', dateRange: 'DY', value: 999 }] }));
    if (u.pathname === '/api/situation_reports')
      return new Response(JSON.stringify({ data: [{ date: '2026-10-13T00:00:00+00:00', title: 'W41', content: '<p>x</p>' }] }));
    return new Response(JSON.stringify({ data: [] }));
  }) as typeof fetch;
}

const run = (f: typeof fetch) => {
  const updates: EcState[] = [];
  const p = loadEurocontrol({ snapshotUrl: '/data/eurocontrol.json', keys: ['network', 'EBBR'], fetchFn: f, onUpdate: (s) => updates.push(structuredClone(s)) });
  return { p, updates };
};

describe('loadEurocontrol', () => {
  it('emits the snapshot first, then upgrades to newer live data', async () => {
    const { p, updates } = run(fakeFetch({ snapshot, liveDate: '2026-10-08' }));
    const final = await p;
    expect(updates[0].status).toBe('ready');
    expect(updates[0].freshness).toEqual({ network: 'snapshot', EBBR: 'snapshot' });
    expect(final.freshness).toEqual({ network: 'live', EBBR: 'live' });
    expect(final.snapshot!.bundles.network!.headline.flights).toBe(999);
    expect(final.reportFreshness).toBe('live');
    expect(final.snapshot!.report!.title).toBe('W41');
  });

  it('keeps the snapshot when live fails, without throwing', async () => {
    const warn = vi.spyOn(console, 'error');
    const { p } = run(fakeFetch({ snapshot, liveFail: true }));
    const final = await p;
    expect(final.status).toBe('ready');
    expect(final.freshness).toEqual({ network: 'snapshot', EBBR: 'snapshot' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('ignores live data that is older than the snapshot', async () => {
    const { p } = run(fakeFetch({ snapshot, liveDate: '2026-10-01' }));
    const final = await p;
    expect(final.freshness.network).toBe('snapshot');
    expect(final.snapshot!.bundles.network!.headline.flights).toBe(100);
  });

  it('uses live data when the snapshot is missing', async () => {
    const { p } = run(fakeFetch({ liveDate: '2026-10-08' }));
    const final = await p;
    expect(final.status).toBe('ready');
    expect(final.freshness.network).toBe('live');
  });

  it('reports error when both are unavailable', async () => {
    const { p } = run(fakeFetch({ liveFail: true }));
    expect((await p).status).toBe('error');
  });
});

describe('degraded live responses', () => {
  it('keeps snapshot series and headline fields that a newer live bundle lacks', async () => {
    const series = [{ name: '2026', chartType: 'daily_evolution', dateRange: null, share: null, points: [{ date: '2026-10-07', value: 1 }] }];
    const snap: EurocontrolSnapshot = {
      generatedAt: 'x', report: null,
      bundles: { network: { ...bundle('network', '2026-10-07', 100), traffic: series, delay: series } }
    };
    const f = (async (url: string) => {
      if (url.endsWith('/data/eurocontrol.json')) return new Response(JSON.stringify(snap));
      const u = new URL(url);
      if (u.pathname === '/api/syncs') return new Response(JSON.stringify({ data: [{ id: 9, syncDate: '2026-10-08T00:00:00+00:00' }] }));
      if (u.pathname === '/api/delay_charts') return new Response(JSON.stringify({ data: [{ chartType: 'category_evolution', dateRange: 'DY', name: 'Weather', data: [{ date: '2026-10-08T00:00:00+00:00', value: 5 }] }] }));
      return new Response(JSON.stringify({ data: [] })); // empty traffic, no headline rows
    }) as typeof fetch;
    const final = await loadEurocontrol({ snapshotUrl: '/data/eurocontrol.json', keys: ['network'], fetchFn: f, onUpdate: () => {} });
    const b = final.snapshot!.bundles.network!;
    expect(final.freshness.network).toBe('live');
    expect(b.dataDate).toBe('2026-10-08');
    expect(b.traffic).toEqual(series); // live had none → keep snapshot's
    expect(b.delay[0].name).toBe('Weather'); // live had some → use live
    expect(b.headline.flights).toBe(100); // live null → keep snapshot's
  });
});
