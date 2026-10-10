// Records, per translated locale, the hash of each English value the translation was made from.
// Usage: npm run i18n:lock -- [locale...]   (no args = all locales)
// Run it only after the named locales have been retranslated to match the current English.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { hashValue } from './i18n-hash';

const ALL = ['de', 'fr', 'it', 'es', 'pl'];
const LOCK = new URL('../i18n.lock.json', import.meta.url);
const en = JSON.parse(readFileSync(new URL('../messages/en.json', import.meta.url), 'utf8')) as Record<string, string>;
const args = process.argv.slice(2);
const bad = args.filter((a) => !ALL.includes(a));
if (bad.length) {
  console.error(`Unknown locale(s): ${bad.join(', ')}. Expected: ${ALL.join(', ')}`);
  process.exit(1);
}
const targets = args.length ? args : ALL;

const lock: Record<string, Record<string, string>> = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : {};
const keys = Object.keys(en).filter((k) => k !== '$schema').sort();
for (const loc of targets) lock[loc] = Object.fromEntries(keys.map((k) => [k, hashValue(en[k])]));

const sorted = Object.fromEntries(Object.keys(lock).sort().map((l) => [l, Object.fromEntries(Object.entries(lock[l]).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))]));
writeFileSync(LOCK, JSON.stringify(sorted, null, 2) + '\n');
console.log(`Locked ${targets.join(', ')} (${keys.length} keys each)`);
