import { base } from '$app/paths';
import { loadEurocontrol, type EcState } from './live';
import { ENTITY_KEYS, type EntityKey } from './eurocontrol';
import { newerSky, type SkySnapshot } from './sky';

export const ec: EcState = $state({ snapshot: null, freshness: {}, reportFreshness: null, status: 'loading' });
export const sky: { snap: SkySnapshot | null; status: 'loading' | 'ready' | 'error' } = $state({ snap: null, status: 'loading' });

let lastEc = 0;
function refreshEurocontrol() {
  lastEc = Date.now();
  loadEurocontrol({
    snapshotUrl: `${base}/data/eurocontrol.json`,
    keys: ENTITY_KEYS,
    onUpdate: (s) => {
      ec.snapshot = s.snapshot ? { ...s.snapshot, bundles: { ...s.snapshot.bundles } } : null;
      ec.freshness = { ...s.freshness };
      ec.reportFreshness = s.reportFreshness;
      ec.status = s.status;
    }
  });
}

async function pollSky() {
  try {
    const r = await fetch(`${base}/data/sky.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`sky HTTP ${r.status}`);
    const next: unknown = await r.json();
    if (newerSky(sky.snap, next)) sky.snap = next;
    sky.status = sky.snap ? 'ready' : 'error';
  } catch (e) {
    console.info('[sky] poll failed', e);
    if (!sky.snap) sky.status = 'error';
  }
}

let timer: ReturnType<typeof setInterval> | null = null;
export function startPolling() {
  const tick = () => { if (document.visibilityState === 'visible') pollSky(); };
  timer ??= setInterval(tick, 60_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    pollSky();
    if (Date.now() - lastEc > 15 * 60_000) refreshEurocontrol();
  });
}

let started = false;
export function startLoading() {
  if (started || typeof window === 'undefined') return;
  started = true;
  refreshEurocontrol();
  pollSky();
  startPolling();
}

export const bundle = (key: EntityKey) => ec.snapshot?.bundles[key];
