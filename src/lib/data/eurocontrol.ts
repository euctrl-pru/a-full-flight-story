import { parseReportHtml, type ReportBlock } from './report';

export const API_BASE = 'https://api-data-app.eurocontrol.int/api';

type Kind = 'network' | 'airport' | 'ansp';
export const ENTITIES = {
  network: { label: 'European network', kind: 'network' as Kind, id: 0 },
  EBBR: { label: 'Brussels (EBBR)', kind: 'airport' as Kind, id: 1 },
  LIRF: { label: 'Rome Fiumicino (LIRF)', kind: 'airport' as Kind, id: 31 },
  skeyes: { label: 'skeyes (Belgium)', kind: 'ansp' as Kind, id: 38 },
  MUAC: { label: 'MUAC (Maastricht UAC)', kind: 'ansp' as Kind, id: 29 },
  DSNA: { label: 'DSNA (France)', kind: 'ansp' as Kind, id: 13 },
  DFS: { label: 'DFS (Germany)', kind: 'ansp' as Kind, id: 11 },
  Skyguide: { label: 'skyguide (Switzerland)', kind: 'ansp' as Kind, id: 39 },
  ENAV: { label: 'ENAV (Italy)', kind: 'ansp' as Kind, id: 16 }
} as const;
export type EntityKey = keyof typeof ENTITIES;
export const ENTITY_KEYS = Object.keys(ENTITIES) as EntityKey[];

export interface SeriesPoint { date: string; value: number }
export interface Series { name: string; chartType: string; dateRange: string | null; share: number | null; points: SeriesPoint[] }
export interface Headline { flights: number | null; delayMinutes: number | null; delayPerFlight: number | null }
export interface EntityBundle {
  key: EntityKey; label: string; syncId: number; dataDate: string;
  traffic: Series[]; delay: Series[]; punctuality: Series[]; co2: Series[]; headline: Headline;
}
export type { ReportBlock };
export interface SituationReport { date: string; title: string; blocks: ReportBlock[] }
export interface EurocontrolSnapshot {
  generatedAt: string;
  bundles: Partial<Record<EntityKey, EntityBundle>>;
  report: SituationReport | null;
}

type Fetch = typeof fetch;
type Json = any; // API payloads are validated by the parsers below

export function apiUrl(path: string, params: Record<string, string | number> = {}): string {
  const u = new URL(`${API_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  return u.toString();
}

async function getJson(url: string, f: Fetch, timeoutMs: number): Promise<Json> {
  const r = await f(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

const day = (iso: string) => String(iso).slice(0, 10);
const round = (v: number) => Math.round(v * 1e4) / 1e4;

function list(json: Json): Json[] {
  if (!json || !Array.isArray(json.data)) throw new Error('Unexpected API payload: missing data[]');
  return json.data;
}

export function parseSync(json: Json): { id: number; date: string } {
  const [first] = list(json);
  if (!first) throw new Error('No sync found for entity');
  if (typeof first.id !== 'number' || typeof first.syncDate !== 'string') throw new Error('Malformed sync');
  return { id: first.id, date: day(first.syncDate) };
}

export function parseCharts(json: Json): Series[] {
  return list(json).map((c: Json) => ({
    name: String(c.name ?? ''),
    chartType: String(c.chartType ?? ''),
    dateRange: c.dateRange ?? null,
    share: typeof c.share === 'number' ? c.share : null,
    points: (Array.isArray(c.data) ? c.data : [])
      .filter((p: Json) => typeof p?.value === 'number' && Number.isFinite(p.value) && typeof p.date === 'string')
      .map((p: Json) => ({ date: day(p.date), value: round(p.value) }))
  }));
}

function pick(rows: Json[], rel: 'traffic' | 'delay', networkType: string): number | null {
  const r = rows.find((x) => x?.[rel]?.rankingCategory === 'network' && x.networkType === networkType && x.dateRange === 'DY');
  const v = r?.value;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function parseHeadline(trafficNetworks: Json, delayNetworks: Json): Headline {
  const t = list(trafficNetworks), d = list(delayNetworks);
  return { flights: pick(t, 'traffic', 'total'), delayMinutes: pick(d, 'delay', 'total'), delayPerFlight: pick(d, 'delay', 'avg') };
}

export function findSeries(series: Series[], q: { chartType?: string; dateRange?: string | null; name?: string | RegExp }) {
  return series.find(
    (s) =>
      (q.chartType === undefined || s.chartType === q.chartType) &&
      (q.dateRange === undefined || s.dateRange === q.dateRange) &&
      (q.name === undefined || (typeof q.name === 'string' ? s.name === q.name : q.name.test(s.name)))
  );
}

function syncParams(key: EntityKey): Record<string, string | number> {
  const e = ENTITIES[key];
  const base = { 'order[syncDate]': 'desc', itemsPerPage: 1 };
  if (e.kind === 'network') return { ...base, dataType: 'network-wide' };
  if (e.kind === 'airport') return { ...base, 'airport.id': e.id };
  return { ...base, 'airNavigationServiceProvider.id': e.id };
}

export async function fetchBundle(key: EntityKey, f: Fetch = fetch, timeoutMs = 15_000): Promise<EntityBundle> {
  const sync = parseSync(await getJson(apiUrl('syncs', syncParams(key)), f, timeoutMs));
  const charts = (p: string) => getJson(apiUrl(p, { 'sync.id': sync.id, itemsPerPage: 100 }), f, timeoutMs).then(parseCharts);
  const [traffic, delay, punctuality, co2, tn, dn] = await Promise.all([
    charts('traffic_charts'),
    charts('delay_charts'),
    charts('punctualities_charts'),
    charts('co2_charts'),
    getJson(apiUrl('traffic_networks', { 'traffic.sync.id': sync.id, itemsPerPage: 50 }), f, timeoutMs),
    getJson(apiUrl('delay_networks', { 'delay.sync.id': sync.id, itemsPerPage: 50 }), f, timeoutMs)
  ]);
  return { key, label: ENTITIES[key].label, syncId: sync.id, dataDate: sync.date, traffic, delay, punctuality, co2, headline: parseHeadline(tn, dn) };
}

export async function fetchReport(f: Fetch = fetch, timeoutMs = 15_000): Promise<SituationReport | null> {
  const [r] = list(await getJson(apiUrl('situation_reports', { 'order[date]': 'desc', itemsPerPage: 1, active: 'true' }), f, timeoutMs));
  if (!r) return null;
  return { date: day(r.date), title: String(r.title ?? ''), blocks: parseReportHtml(String(r.content ?? '')) };
}

export async function fetchSnapshot(keys: EntityKey[] = ENTITY_KEYS, f: Fetch = fetch): Promise<EurocontrolSnapshot> {
  const results = await Promise.allSettled(keys.map((k) => fetchBundle(k, f)));
  const bundles: EurocontrolSnapshot['bundles'] = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') bundles[keys[i]] = r.value;
    else console.warn(`[eurocontrol] ${keys[i]} failed: ${r.reason}`);
  });
  const report = await fetchReport(f).catch((e) => (console.warn(`[eurocontrol] report failed: ${e}`), null));
  return { generatedAt: new Date().toISOString(), bundles, report };
}

/** Snapshot-only trim: keep the series the story draws (prior-year comparisons and weekly variants dropped). */
export function trimForSnapshot(b: EntityBundle): EntityBundle {
  return {
    ...b,
    traffic: b.traffic.filter((s) => (s.chartType === 'daily_evolution' && s.name !== '2020') || s.chartType === 'forecast'),
    delay: b.delay.filter((s) => s.chartType === 'category_evolution' && (s.dateRange === 'DY' || s.dateRange === 'Y2D') && !/\b20\d\d\b/.test(s.name))
  };
}

/** Build-time merge: entities (and the report) the new fetch missed keep their previous values. */
export function mergeSnapshots(prev: EurocontrolSnapshot | null, next: EurocontrolSnapshot): EurocontrolSnapshot {
  if (!prev) return next;
  return { generatedAt: next.generatedAt, bundles: { ...prev.bundles, ...next.bundles }, report: next.report ?? prev.report };
}
