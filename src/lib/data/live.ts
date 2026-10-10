import { fetchBundle, fetchReport, type EntityBundle, type EntityKey, type EurocontrolSnapshot } from './eurocontrol';

/** Live data wins, but a degraded live response never blanks what the snapshot already has. */
export function mergeBundle(cur: EntityBundle | undefined, live: EntityBundle): EntityBundle {
  if (!cur) return live;
  const pick = <K extends 'traffic' | 'delay' | 'punctuality' | 'co2'>(k: K) => (live[k].length ? live[k] : cur[k]);
  return {
    ...live,
    traffic: pick('traffic'), delay: pick('delay'), punctuality: pick('punctuality'), co2: pick('co2'),
    headline: {
      flights: live.headline.flights ?? cur.headline.flights,
      delayMinutes: live.headline.delayMinutes ?? cur.headline.delayMinutes,
      delayPerFlight: live.headline.delayPerFlight ?? cur.headline.delayPerFlight
    }
  };
}

export type Freshness = 'live' | 'snapshot';
export interface EcState {
  snapshot: EurocontrolSnapshot | null;
  freshness: Partial<Record<EntityKey, Freshness>>;
  reportFreshness: Freshness | null;
  status: 'loading' | 'ready' | 'error';
}

export async function loadEurocontrol(opts: {
  snapshotUrl: string;
  keys: EntityKey[];
  fetchFn?: typeof fetch;
  liveTimeoutMs?: number;
  /** What is already on screen: a refresh only ever adds newer data on top of it. */
  initial?: EcState;
  onUpdate: (s: EcState) => void;
}): Promise<EcState> {
  const f = opts.fetchFn ?? fetch;
  const timeout = opts.liveTimeoutMs ?? 8_000;
  const state: EcState = opts.initial?.snapshot
    ? { snapshot: { ...opts.initial.snapshot, bundles: { ...opts.initial.snapshot.bundles } }, freshness: { ...opts.initial.freshness }, reportFreshness: opts.initial.reportFreshness, status: 'ready' }
    : { snapshot: null, freshness: {}, reportFreshness: null, status: 'loading' };
  const emit = () => opts.onUpdate(state);

  if (!state.snapshot) try {
    const r = await f(opts.snapshotUrl);
    if (!r.ok) throw new Error(`snapshot HTTP ${r.status}`);
    state.snapshot = (await r.json()) as EurocontrolSnapshot;
    for (const k of opts.keys) if (state.snapshot.bundles[k]) state.freshness[k] = 'snapshot';
    if (state.snapshot.report) state.reportFreshness = 'snapshot';
    state.status = 'ready';
    emit();
  } catch (e) {
    console.info('[live] snapshot unavailable', e);
  }

  const ensure = () => (state.snapshot ??= { generatedAt: new Date().toISOString(), bundles: {}, report: null });

  await Promise.all([
    ...opts.keys.map(async (k) => {
      try {
        const live = await fetchBundle(k, f, timeout);
        const cur = state.snapshot?.bundles[k];
        if (cur && live.dataDate < cur.dataDate) return;
        ensure().bundles[k] = mergeBundle(cur, live);
        state.freshness[k] = 'live';
        state.status = 'ready';
        emit();
      } catch (e) {
        console.info(`[live] ${k} live fetch failed; using snapshot`, e);
      }
    }),
    (async () => {
      try {
        const rep = await fetchReport(f, timeout);
        const cur = state.snapshot?.report;
        if (!rep || (cur && rep.date < cur.date)) return;
        ensure().report = rep;
        state.reportFreshness = 'live';
        emit();
      } catch (e) {
        console.info('[live] report live fetch failed', e);
      }
    })()
  ]);

  if (state.status === 'loading') {
    state.status = 'error';
    emit();
  }
  return state;
}
