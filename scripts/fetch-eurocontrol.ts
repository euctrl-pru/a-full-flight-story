import { writeFileSync, mkdirSync } from 'node:fs';
import { fetchSnapshot, trimForSnapshot, ENTITY_KEYS } from '../src/lib/data/eurocontrol.ts';

const snap = await fetchSnapshot(ENTITY_KEYS);
for (const k of Object.keys(snap.bundles) as (keyof typeof snap.bundles)[]) snap.bundles[k] = trimForSnapshot(snap.bundles[k]!);
const ok = Object.keys(snap.bundles);
if (!snap.bundles.network) {
  console.error('network bundle missing — keeping previous snapshot');
  process.exit(1);
}
mkdirSync('static/data', { recursive: true });
const body = JSON.stringify(snap);
writeFileSync('static/data/eurocontrol.json', body);
console.log(`wrote static/data/eurocontrol.json (${(body.length / 1024).toFixed(0)} KiB) bundles=${ok.join(',')} report=${snap.report?.date ?? 'none'}`);
