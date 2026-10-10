import { describe, it, expect } from 'vitest';
import { citedIds, termIds, varIds } from '$lib/story/richtext';
import en from '../../messages/en.json';
import de from '../../messages/de.json';
import fr from '../../messages/fr.json';
import it_ from '../../messages/it.json';
import es from '../../messages/es.json';
import pl from '../../messages/pl.json';

const LOCALES = { de, fr, it: it_, es, pl } as Record<string, Record<string, string>>;
const E = en as Record<string, string>;
const keys = Object.keys(E).filter((k) => k !== '$schema');
const params = (s: string) => [...s.matchAll(/(?<!\{)\{([a-zA-Z_][\w]*)\}(?!\})/g)].map((m) => m[1]).sort();
// strings that are legitimately identical across languages (codes, names, acronym expansions with no local term)
const SAME = new Set(['site_title_short', 'ansp_MUAC', 'ansp_DFS', 'ansp_ENAV', 'ansp_DSNA', 'ansp_skeyes', 'ansp_Skyguide', 'ansp_ANA', 'fig_casa_hero_stat']);
// Identical-to-English is fine for short labels: <= 2 words, or no lowercase run of 4+ letters (units min/km aside).
// Prose (3+ words with real words) identical to English still counts as untranslated.
const shortLabel = (v: string) => v.trim().split(/\s+/).length <= 2 || !/[a-z]{4,}/.test(v.replace(/\b(min|km)\b/g, ''));
const sameOk = (k: string, v: string) => SAME.has(k) || /^[A-Z0-9 ·→()\-–./]+$/.test(v) || shortLabel(v) || k.startsWith('gl_') && k.endsWith('_exp');

for (const [loc, M] of Object.entries(LOCALES)) {
  describe(`${loc} parity`, () => {
    it('has exactly the English keys', () => {
      expect(Object.keys(M).filter((k) => k !== '$schema').sort()).toEqual([...keys].sort());
    });
    it('keeps citations, glossary terms and data tokens identical', () => {
      for (const k of keys) {
        expect(citedIds(M[k]).sort(), `${loc}:${k} citations`).toEqual(citedIds(E[k]).sort());
        expect(termIds(M[k]).sort(), `${loc}:${k} terms`).toEqual(termIds(E[k]).sort());
        expect(varIds(M[k]).map((v) => `${v.name}:${v.arg}`).sort(), `${loc}:${k} tokens`).toEqual(varIds(E[k]).map((v) => `${v.name}:${v.arg}`).sort());
      }
    });
    it('keeps message parameters', () => {
      for (const k of keys) expect(params(M[k]), `${loc}:${k}`).toEqual(params(E[k]));
    });
    it('has no untranslated English left', () => {
      const same = keys.filter((k) => M[k] === E[k] && !sameOk(k, E[k]));
      expect(same).toEqual([]);
    });
    it('includes the AI-translation note', () => {
      expect(M.method_ai_note.length).toBeGreaterThan(20);
      expect(M.method_ai_note).not.toBe(E.method_ai_note);
    });
  });
}
