import { fetchBundle, fetchReport, type EntityKey, type EurocontrolSnapshot } from './eurocontrol';

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
  onUpdate: (s: EcState) => void;
}): Promise<EcState> {
  const f = opts.fetchFn ?? fetch;
  const timeout = opts.liveTimeoutMs ?? 8_000;
  const state: EcState = { snapshot: null, freshness: {}, reportFreshness: null, status: 'loading' };
  const emit = () => opts.onUpdate(state);

  try {
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
        ensure().bundles[k] = live;
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
