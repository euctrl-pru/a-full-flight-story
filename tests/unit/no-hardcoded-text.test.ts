import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'node:fs';

const files = globSync('src/{lib,routes}/**/*.svelte').filter((f) => !f.includes('/dev/'));
// attribute literals that reach readers (aria-label, title, label, subtitle, detail) and text nodes of 3+ words
const ATTR = /\b(?:aria-label|title|label|subtitle|detail|caption)="([A-Z][^"{}]*\s[^"{}]*)"/g;
const TEXT = />\s*([A-Z][a-z]+(?:\s+[a-zA-Z’'-]+){2,})\s*</g;
// Proper names and codes that are the same in every locale (organisation names, flight and airport codes).
const ALLOW = [/^FFS101/, /^EBBR/, /^LIRF/, /^Belgium Slot Coordination$/];

describe('no hard-coded English in components', () => {
  it('routes all reader-facing text through messages', () => {
    const hits: string[] = [];
    for (const f of files) {
      const s = readFileSync(f, 'utf8').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
      for (const re of [ATTR, TEXT]) for (const m of s.matchAll(re)) if (!ALLOW.some((a) => a.test(m[1]))) hits.push(`${f}: ${m[1]}`);
    }
    expect(hits).toEqual([]);
  });
});
