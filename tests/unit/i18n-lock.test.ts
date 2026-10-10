import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { hashValue } from '../../scripts/i18n-hash';
import en from '../../messages/en.json';

// Drift guard: i18n.lock.json records, per locale and key, the hash of the English value that
// translation was made from. Rewording English fails here until each locale is retranslated and relocked.
const E = en as Record<string, string>;
const keys = Object.keys(E).filter((k) => k !== '$schema');
const lock = JSON.parse(readFileSync(new URL('../../i18n.lock.json', import.meta.url), 'utf8')) as Record<string, Record<string, string>>;

for (const loc of ['de', 'fr', 'it', 'es', 'pl']) {
  describe(`${loc} English lock`, () => {
    it('was translated from the current English text', () => {
      const stale = keys.filter((k) => lock[loc]?.[k] !== hashValue(E[k]));
      expect(
        stale,
        `English changed (or is unlocked) for ${stale.length} key(s) in ${loc}: ${stale.slice(0, 10).join(', ')}. ` +
          `Retranslate messages/${loc}.json for them, then run \`npm run i18n:lock -- ${loc}\`.`
      ).toEqual([]);
    });
    it('has no lock entries for removed keys', () => {
      expect(Object.keys(lock[loc] ?? {}).filter((k) => !(k in E))).toEqual([]);
    });
  });
}
