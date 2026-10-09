import { base } from '$app/paths';
import { loadEurocontrol, type EcState } from './live';
import { ENTITY_KEYS, type EntityKey } from './eurocontrol';
import type { SkySnapshot } from './sky';

export const ec: EcState = $state({ snapshot: null, freshness: {}, reportFreshness: null, status: 'loading' });
export const sky: { snap: SkySnapshot | null; status: 'loading' | 'ready' | 'error' } = $state({ snap: null, status: 'loading' });

let started = false;
export function startLoading() {
  if (started || typeof window === 'undefined') return;
  started = true;
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
  fetch(`${base}/data/sky.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`sky HTTP ${r.status}`))))
    .then((s: SkySnapshot) => { sky.snap = s; sky.status = 'ready'; })
    .catch((e) => { console.info('[sky] unavailable', e); sky.status = 'error'; });
}

export const bundle = (key: EntityKey) => ec.snapshot?.bundles[key];
