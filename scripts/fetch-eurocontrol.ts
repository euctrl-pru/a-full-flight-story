import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { fetchSnapshot, trimForSnapshot, mergeSnapshots, ENTITY_KEYS, type EurocontrolSnapshot } from '../src/lib/data/eurocontrol.ts';

const OUT = 'static/data/eurocontrol.json';
const snap = await fetchSnapshot(ENTITY_KEYS);
for (const k of Object.keys(snap.bundles) as (keyof typeof snap.bundles)[]) snap.bundles[k] = trimForSnapshot(snap.bundles[k]!);
const fetched = Object.keys(snap.bundles);
if (fetched.length === 0) {
  console.error('no bundles fetched — keeping previous snapshot');
  process.exit(1);
}
const prev: EurocontrolSnapshot | null = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;
const merged = mergeSnapshots(prev, snap);
mkdirSync('static/data', { recursive: true });
const body = JSON.stringify(merged);
writeFileSync(OUT, body);
const kept = Object.keys(merged.bundles).filter((k) => !fetched.includes(k));
console.log(`wrote ${OUT} (${(body.length / 1024).toFixed(0)} KiB) fetched=${fetched.join(',')} kept-previous=${kept.join(',') || 'none'} report=${merged.report?.date ?? 'none'}`);
