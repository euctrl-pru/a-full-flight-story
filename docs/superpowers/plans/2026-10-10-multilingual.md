# Multilingual Versions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the story in German, French, Italian, Spanish and Polish at `/a-full-flight-story/{de,fr,it,es,pl}/` (English unchanged at the root), with Paraglide messages, a language switcher, a browser-language hint, localized formatting and SEO alternates.

**Architecture:** Paraglide JS 2 compiles `messages/{locale}.json` into typed message functions. Content modules (`chapters.ts`, `glossary.ts`, `phases.ts`, `stakeholders.ts`, `flight.ts`) keep structure in code and expose their human-readable fields as **getters** that read the active locale's message, so existing components keep working. A single optional-param route `src/routes/[[locale=locale]]` pre-renders one page per locale; the page `load` pins the locale with `overwriteGetLocale` (no URL strategy — our site lives under `/a-full-flight-story`, which Paraglide's URL strategy doesn't account for). Story rich text moves to a brace-free token syntax so Paraglide never mistakes it for message variables.

**Tech Stack:** SvelteKit ^2.70, Svelte ^5.57, `@inlang/paraglide-js@^2.27`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-10-multilingual-design.md` (approved). Earlier specs' rules still apply.

## Global Constraints

- Locales: `en` (base, no URL prefix), `de`, `fr`, `it`, `es`, `pl`. Language names in their own language: English, Deutsch, Français, Italiano, Español, Polski.
- Sources everywhere in every locale: each translated step keeps exactly the English step's citations, glossary terms and data tokens.
- Source titles and publisher names stay in their original language. Glossary acronyms (IFPS, CTOT, ANSP …) stay; expansions/definitions are translated.
- Each non-English locale's "Sources & method" includes the AI-translation note (translated): "This version was translated from the English original with AI assistance."
- No automatic redirects; the browser hint appears only on the English page.
- Never render third-party text with `{@html}`; the JSON-LD exception stays (our own constants, `<` escaped).
- 390 px without horizontal scroll in every locale; initial JS ≤ 250 KB gzip on `/` and `/de/`.
- Language links are full page loads (`data-sveltekit-reload`) — message calls aren't reactive to a client-side locale change.
- Commits: brief subject (+ body when needed), **no Claude co-author / "Generated with" lines**. Pushing/deploying needs Quinten's go-ahead.
- npm: `npm_config_cache=/private/tmp/claude-501/npm-cache` if `~/.npm` gives EACCES.

## Review Focus

1. **Switching language from inside the page** (client-side navigation would keep old strings) → the new page shows the new language everywhere and keeps the `#chapter`. Pinned in Task 6 (`i18n.spec.ts` "switcher").
2. **Browser preferences that list English first** (e.g. `['en-GB', 'de']`) → no hint; `['nl', 'fr']` → French hint. Pinned in Task 6 (`hint.test.ts`).
3. **Deep link into a localized chapter** (`/de/#twist`) → German page, Tactical phase label in German, correct chapter. Pinned in Task 8 (`i18n.spec.ts`).
4. **A future English copy change** → every locale's parity test fails until updated. Pinned in Task 7 (`i18n-parity.test.ts`).
5. **Long German/Polish strings in tight UI** (top bar, timeline labels, drawer, chart labels) at 390 px → no horizontal overflow, nothing clipped. Pinned in Task 8 (German responsive walk + visual review of all locales).

---

## File Structure

```
project.inlang/settings.json                 (new)  inlang project: locales, message-format plugin, messages/{locale}.json
messages/{en,de,fr,it,es,pl}.json            (new)  all human-readable text
src/lib/paraglide/                           (generated, git-ignored) compiled messages + runtime
src/params/locale.ts                         (new)  route matcher: non-base locales only
src/routes/[[locale=locale]]/+page.svelte    (moved from src/routes/+page.svelte)
src/routes/[[locale=locale]]/+page.ts        (new)  entries() + pin locale
src/hooks.server.ts                          (new)  <html lang> per locale
src/app.html                                 (modify) lang="%lang%"
src/lib/i18n/msg.ts                          (new)  msg(key, params), keyOf(id), withLocale(locale, fn), intlLocale()
src/lib/i18n/hint.ts                         (new)  preferredSupported(languages)
src/lib/i18n/locales.ts                      (new)  LOCALES meta (code, native name), localeHref()
scripts/extract-messages.ts                  (new, one-off) writes messages/en.json from the current English modules
src/lib/story/richtext.ts                    (modify) [[TERM]], [[TERM|label]], [[name:arg]]
src/lib/story/{chapters,glossary,phases,stakeholders,flight}.ts (modify) getters reading messages
src/lib/viz/chart-utils.ts, src/lib/story/freshness.ts          (modify) Intl by locale; freshness messages
src/lib/viz/palette.ts                       (modify) cause labels via messages
src/lib/ui/LanguageMenu.svelte, LanguageHint.svelte             (new)
src/lib/ui/ui-strings.ts                     (delete; replaced by messages)
static/sitemap.xml                           (modify) six URLs + alternates
tests/unit/{richtext,i18n-msg,hint,i18n-parity,no-hardcoded-text,format-locale}.test.ts
tests/e2e/i18n.spec.ts
```

---

### Task 1: Brace-free rich-text token syntax

**Files:**
- Modify: `src/lib/story/richtext.ts`, `src/lib/story/chapters.ts`, `src/routes/dev/scroll/+page.svelte`, `tests/unit/richtext.test.ts`, `tests/unit/story-content.test.ts` (only if it hard-codes the old syntax)

**Interfaces:**
- Produces: tokens `[[TERM]]`, `[[TERM|label]]` (glossary), `[[name:arg]]` (data tokens, e.g. `[[date:network]]`, `[[live:report]]`). Citations unchanged (`[S7]`, `[S1, D-eurocontrol]`). `parseRich`, `citedIds`, `termIds`, `varIds` keep their signatures and return shapes.

- [ ] **Step 1: Rewrite the rich-text tests to the new syntax (they fail against the old parser)** — in `tests/unit/richtext.test.ts` replace every `{IFPS}` with `[[IFPS]]`, `{CTOT|a slot}` with `[[CTOT|a slot]]`, `{TOBT}` with `[[TOBT]]`, `{{date:network}}` with `[[date:network]]`, `{{live:report}}` with `[[live:report]]`, `{{date:EBBR}}` with `[[date:EBBR]]`; and add:
```ts
describe('brace-free syntax', () => {
  it('leaves curly braces as plain text (safe inside Paraglide messages)', () => {
    expect(parseRich('a {x} b')).toEqual([{ kind: 'text', text: 'a {x} b' }]);
  });
  it('does not confuse a term with a citation or a data token', () => {
    expect(parseRich('[[CTOT]] [S7] [[date:network]]')).toEqual([
      { kind: 'term', id: 'CTOT', text: 'CTOT' }, { kind: 'text', text: ' ' },
      { kind: 'cite', ids: ['S7'] }, { kind: 'text', text: ' ' },
      { kind: 'var', name: 'date', arg: 'network' }
    ]);
  });
});
```
- [ ] **Step 2: Run** `npx vitest run tests/unit/richtext.test.ts` → FAIL.
- [ ] **Step 3: Implement** — in `src/lib/story/richtext.ts` replace `TOKEN` and the match handling:
```ts
const TOKEN = new RegExp(
  String.raw`\[\[([a-z]+):([A-Za-z0-9-]+)\]\]|\[\[([A-Za-z0-9-]+)(?:\|([^\]]+))?\]\]|\*\*(.+?)\*\*|\*(.+?)\*|\[(${ID}(?:\s*,\s*${ID})*)\]`,
  'g'
);
```
```ts
    if (m[1] !== undefined) runs.push({ kind: 'var', name: m[1], arg: m[2] });
    else if (m[3] !== undefined) runs.push({ kind: 'term', id: m[3], text: m[4] ?? m[3] });
    else if (m[5] !== undefined) runs.push({ kind: 'strong', text: m[5] });
    else if (m[6] !== undefined) runs.push({ kind: 'em', text: m[6] });
    else runs.push({ kind: 'cite', ids: m[7].split(',').map((x) => x.trim()) });
```
Update the doc comment on `StepDef.text` in `types.ts` to the new syntax. Convert the copy mechanically:
```bash
node -e '
const fs=require("fs");
for (const f of ["src/lib/story/chapters.ts","src/routes/dev/scroll/+page.svelte"]) {
  let s=fs.readFileSync(f,"utf8");
  s=s.replace(/\{\{([a-z]+):([A-Za-z0-9-]+)\}\}/g,"[[$1:$2]]").replace(/\{([A-Z][A-Za-z0-9-]*)(\|[^}]+)?\}/g,(m,id,l)=>`[[${id}${l??""}]]`);
  fs.writeFileSync(f,s);
}'
grep -c "\[\[" src/lib/story/chapters.ts
```
(The dev page's `{IFPS}` lives inside a JS template string, so the same replacement applies.)
- [ ] **Step 4: Run** `npx vitest run && npm run check && npx playwright test tests/e2e/scroll.spec.ts tests/e2e/story.spec.ts` → PASS (terms still render as glossary buttons; data tokens still resolve).
- [ ] **Step 5: Commit** `git add -A src tests && git commit -m "refactor: brace-free rich-text tokens ([[TERM]], [[name:arg]])"`

---

### Task 2: Paraglide setup and per-locale routes

**Files:**
- Create: `project.inlang/settings.json`, `messages/en.json` (seed), `messages/{de,fr,it,es,pl}.json` (seed), `src/params/locale.ts`, `src/routes/[[locale=locale]]/+page.ts`, `src/hooks.server.ts`, `src/lib/i18n/msg.ts`, `src/lib/i18n/locales.ts`
- Move: `src/routes/+page.svelte` → `src/routes/[[locale=locale]]/+page.svelte`
- Modify: `vite.config.ts`, `package.json` (scripts), `.gitignore`, `src/app.html`
- Test: `tests/unit/i18n-msg.test.ts`, `tests/e2e/i18n.spec.ts`

**Interfaces:**
- Produces:
  - `type Locale = 'en' | 'de' | 'fr' | 'it' | 'es' | 'pl'` (from `$lib/paraglide/runtime`), `locales`, `baseLocale`, `getLocale()`, `overwriteGetLocale(fn)`, `isLocale(x)`.
  - `msg(key: string, params?: Record<string, unknown>): string` (throws on unknown key), `keyOf(id: string): string` (non-alphanumerics → `_`), `withLocale<T>(l: Locale, fn: () => T): T` (tests), `intlLocale(l?: Locale): string` (`en` → `en-GB`, others identity).
  - `LOCALES: { code: Locale; name: string }[]`, `localeHref(l: Locale): string` (`${base}/` for en, `${base}/${l}/` otherwise).

- [ ] **Step 1: Install and configure**
```bash
npm i -D @inlang/paraglide-js@^2.27
```
`project.inlang/settings.json`
```json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "baseLocale": "en",
  "locales": ["en", "de", "fr", "it", "es", "pl"],
  "modules": ["https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/dist/index.js"],
  "plugin.inlang.messageFormat": { "pathPattern": "./messages/{locale}.json" }
}
```
`vite.config.ts`
```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide', strategy: ['globalVariable', 'baseLocale'] }),
    sveltekit()
  ],
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' }
});
```
`package.json` scripts — add `"i18n": "paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide --strategy globalVariable baseLocale"` and prefix `check`, `test`, `build` with it: `"check": "npm run i18n && svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"`, `"test": "npm run i18n && vitest run"`, `"build": "npm run i18n && vite build"`. `.gitignore`: add `src/lib/paraglide`.
Seed `messages/en.json`: `{ "$schema": "https://inlang.com/schema/inlang-message-format", "site_title": "A Full Flight Story" }`; seed the five other files with the same `$schema` and `"site_title"` translated: de "Ein ganzer Flug", fr "Histoire d’un vol", it "Storia di un volo", es "La historia de un vuelo", pl "Historia jednego lotu".
If `npx paraglide-js compile --help` shows a different flag spelling for strategy, use it; the vite plugin config is the source of truth.

- [ ] **Step 2: Failing tests**

`tests/unit/i18n-msg.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { msg, keyOf, withLocale, intlLocale } from '$lib/i18n/msg';
import { localeHref, LOCALES } from '$lib/i18n/locales';

describe('i18n helpers', () => {
  it('looks up messages in the active locale', () => {
    expect(withLocale('en', () => msg('site_title'))).toBe('A Full Flight Story');
    expect(withLocale('de', () => msg('site_title'))).toBe('Ein ganzer Flug');
  });
  it('throws on unknown keys', () => expect(() => msg('nope_nope')).toThrow(/Missing message/));
  it('keys ids safely', () => expect(keyOf('A-CDM')).toBe('A_CDM'));
  it('maps Intl locales', () => { expect(intlLocale('en')).toBe('en-GB'); expect(intlLocale('pl')).toBe('pl'); });
  it('lists six locales with native names and builds hrefs', () => {
    expect(LOCALES.map((l) => l.name)).toEqual(['English', 'Deutsch', 'Français', 'Italiano', 'Español', 'Polski']);
    expect(localeHref('en')).toBe('/');
    expect(localeHref('fr')).toBe('/fr/');
  });
});
```
`tests/e2e/i18n.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test('every locale page renders with its lang attribute', async ({ page }) => {
  for (const [path, lang] of [['/', 'en'], ['/de/', 'de'], ['/fr/', 'fr'], ['/it/', 'it'], ['/es/', 'es'], ['/pl/', 'pl']]) {
    const res = await page.goto(path);
    expect(res!.status(), path).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
  }
});

test('unsupported locale segments are not pages', async ({ page }) => {
  expect((await page.goto('/xx/'))!.status()).toBe(404);
  expect((await page.goto('/en/'))!.status()).toBe(404);
});
```
- [ ] **Step 3: Run** `npm test -- tests/unit/i18n-msg.test.ts` and `npx playwright test tests/e2e/i18n.spec.ts` → FAIL.
- [ ] **Step 4: Implement**

`src/lib/i18n/msg.ts`
```ts
import { m } from '$lib/paraglide/messages.js';
import { getLocale, overwriteGetLocale, type Locale } from '$lib/paraglide/runtime.js';

type MsgFn = (params?: Record<string, unknown>) => string;
const table = m as unknown as Record<string, MsgFn>;

export function msg(key: string, params?: Record<string, unknown>): string {
  const fn = table[key];
  if (typeof fn !== 'function') throw new Error(`Missing message ${key}`);
  return fn(params ?? {});
}
export const has = (key: string) => typeof table[key] === 'function';
export const keyOf = (id: string) => id.replace(/[^A-Za-z0-9]/g, '_');
export const intlLocale = (l: Locale = getLocale()) => (l === 'en' ? 'en-GB' : l);

/** Run `fn` with the locale pinned (tests and build-time code). */
export function withLocale<T>(l: Locale, fn: () => T): T {
  overwriteGetLocale(() => l);
  try { return fn(); } finally { overwriteGetLocale(() => 'en'); }
}
```
`src/lib/i18n/locales.ts`
```ts
import { base } from '$app/paths';
import type { Locale } from '$lib/paraglide/runtime.js';
export const LOCALES: { code: Locale; name: string }[] = [
  { code: 'en', name: 'English' }, { code: 'de', name: 'Deutsch' }, { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' }, { code: 'es', name: 'Español' }, { code: 'pl', name: 'Polski' }
];
export const localeHref = (l: Locale) => (l === 'en' ? `${base}/` : `${base}/${l}/`);
```
(`$app/paths` resolves in Vitest via the SvelteKit plugin; `base` is `''` in tests.)

`src/params/locale.ts`
```ts
import type { ParamMatcher } from '@sveltejs/kit';
import { isLocale, baseLocale } from '$lib/paraglide/runtime.js';
/** Only the non-base locales get a URL prefix; English lives at the root. */
export const match: ParamMatcher = (p) => isLocale(p) && p !== baseLocale;
```
`src/routes/[[locale=locale]]/+page.ts`
```ts
import { locales, baseLocale, overwriteGetLocale, type Locale } from '$lib/paraglide/runtime.js';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => locales.filter((l) => l !== baseLocale).map((locale) => ({ locale }));

export const load: PageLoad = ({ params }) => {
  const locale = (params.locale ?? baseLocale) as Locale;
  overwriteGetLocale(() => locale); // SvelteKit prerenders one page at a time (prerender.concurrency = 1)
  return { locale };
};
```
Move the page: `git mv src/routes/+page.svelte 'src/routes/[[locale=locale]]/+page.svelte'`; in it, replace the `<h1>` text with `{msg('site_title')}` (import `msg`).

`src/hooks.server.ts`
```ts
import type { Handle } from '@sveltejs/kit';
import { base } from '$app/paths';
import { isLocale, baseLocale } from '$lib/paraglide/runtime.js';

export const handle: Handle = ({ event, resolve }) => {
  const seg = event.url.pathname.slice(base.length).split('/')[1] ?? '';
  const lang = isLocale(seg) ? seg : baseLocale;
  return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
};
```
`src/app.html`: `<html lang="%lang%" data-theme="dark">`.

- [ ] **Step 5: Run** `npm test && npm run check && npx playwright test tests/e2e/i18n.spec.ts tests/e2e/smoke.spec.ts tests/e2e/story.spec.ts` → PASS (English unchanged; five more prerendered pages).
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: Paraglide setup with a pre-rendered page per locale"`

---

### Task 3: Story content into messages (getters keep components unchanged)

**Files:**
- Create: `scripts/extract-messages.ts` (one-off), full `messages/en.json`
- Modify: `src/lib/story/chapters.ts`, `glossary.ts`, `phases.ts`, `stakeholders.ts`, `flight.ts` (EVENTS labels, TURNAROUND labels, ANSP_LABEL)
- Test: `tests/unit/i18n-content.test.ts`

**Interfaces:**
- Consumes: `msg`, `keyOf`, `withLocale` (Task 2).
- Produces: message keys
  - `ch_<id>_kicker`, `ch_<id>_title`, `ch_<id>_clock` (chapter id via `keyOf`), `step_<id>` (step text)
  - `gl_<TERM>_exp`, `gl_<TERM>_def`
  - `ph_<id>_label`, `ph_<id>_horizon`, `ph_<id>_decides`
  - `ac_<id>_label`, `ac_<id>_role`
  - `ev_<id>`, `tt_<id>`, `ansp_<key>`
- Object shapes unchanged: `ChapterDef.kicker/title/clockLabel`, `StepDef.text`, `GlossaryEntry.expansion/definition`, `PhaseDef.label/horizon/decides`, `ACTORS[i].label/role`, `FlightEvent.label`, `TurnTask.label`, `ANSP_LABEL[key]` — now locale-aware getters.

- [ ] **Step 1: Extract the current English** — `scripts/extract-messages.ts`:
```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { CHAPTERS } from '../src/lib/story/chapters.ts';
import { GLOSSARY } from '../src/lib/story/glossary.ts';
import { ATM_PHASES } from '../src/lib/story/phases.ts';
import { ACTORS } from '../src/lib/story/stakeholders.ts';
import { EVENTS, TURNAROUND, ANSP_LABEL } from '../src/lib/story/flight.ts';

const k = (id: string) => id.replace(/[^A-Za-z0-9]/g, '_');
const en = JSON.parse(readFileSync('messages/en.json', 'utf8'));
for (const c of CHAPTERS) {
  en[`ch_${k(c.id)}_kicker`] = c.kicker; en[`ch_${k(c.id)}_title`] = c.title; en[`ch_${k(c.id)}_clock`] = c.clockLabel;
  for (const s of c.steps) en[`step_${k(s.id)}`] = s.text;
}
for (const [id, g] of Object.entries(GLOSSARY)) { en[`gl_${k(id)}_exp`] = g.expansion; en[`gl_${k(id)}_def`] = g.definition; }
for (const p of ATM_PHASES) { en[`ph_${p.id}_label`] = p.label; en[`ph_${p.id}_horizon`] = p.horizon; en[`ph_${p.id}_decides`] = p.decides; }
for (const a of ACTORS) { en[`ac_${k(a.id)}_label`] = a.label; en[`ac_${k(a.id)}_role`] = a.role; }
for (const e of EVENTS) en[`ev_${k(e.id)}`] = e.label;
for (const t of TURNAROUND) en[`tt_${k(t.id)}`] = t.label;
for (const [key, label] of Object.entries(ANSP_LABEL)) en[`ansp_${k(key)}`] = label;
writeFileSync('messages/en.json', JSON.stringify(en, null, 2) + '\n');
console.log(`messages/en.json: ${Object.keys(en).length - 1} messages`);
```
Run it **before** changing the modules: `npx tsx scripts/extract-messages.ts` → prints the count (≈ 300). Commit the generated `messages/en.json` together with the module changes below.

- [ ] **Step 2: Failing test** — `tests/unit/i18n-content.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { withLocale } from '$lib/i18n/msg';
import { CHAPTERS } from '$lib/story/chapters';
import { GLOSSARY } from '$lib/story/glossary';
import { ATM_PHASES } from '$lib/story/phases';
import { ACTORS } from '$lib/story/stakeholders';
import { EVENTS, TURNAROUND, ANSP_LABEL } from '$lib/story/flight';
import en from '../../messages/en.json';

describe('content reads from messages', () => {
  it('English getters return exactly the extracted English', () => {
    withLocale('en', () => {
      expect(CHAPTERS[0].title).toBe(en.ch_cold_open_title);
      expect(CHAPTERS[1].steps[0].text).toBe(en.step_st_schedule);
      expect(GLOSSARY['A-CDM'].definition).toBe(en.gl_A_CDM_def);
      expect(ATM_PHASES[2].label).toBe(en.ph_tactical_label);
      expect(ACTORS[0].role).toBe(en.ac_airline_role);
      expect(EVENTS.find((e) => e.id === 'sam')!.label).toBe(en.ev_sam);
      expect(TURNAROUND[0].label).toBe(en.tt_crew);
      expect(ANSP_LABEL.MUAC).toBe(en.ansp_MUAC);
    });
  });
  it('getters follow the active locale', () => {
    const de = withLocale('de', () => CHAPTERS[0].title);
    expect(typeof de).toBe('string');
  });
});
```
- [ ] **Step 3: Run** `npm test -- tests/unit/i18n-content.test.ts` → FAIL (modules still return literals; `de` lacks the keys → also fails until Step 4 copies English into the other locales as placeholders).
- [ ] **Step 4: Implement getters**

Copy English into the other locales as temporary placeholders so every key exists (Task 7 replaces them):
```bash
node -e 'const fs=require("fs");const en=JSON.parse(fs.readFileSync("messages/en.json"));for(const l of ["de","fr","it","es","pl"]){const f=`messages/${l}.json`;const cur=JSON.parse(fs.readFileSync(f));fs.writeFileSync(f,JSON.stringify({...en,...cur},null,2)+"\n")}'
```
`chapters.ts` — keep ids/structure; text via getters. Replace the literal objects with a builder:
```ts
import { msg, keyOf } from '$lib/i18n/msg';
type StepSpec = { id: string; illustrative?: boolean; clock?: number };
type ChapterSpec = { id: string; clock: number; phase: AtmPhase | null; steps: StepSpec[] };
const step = (s: StepSpec): StepDef => ({ ...s, get text() { return msg(`step_${keyOf(s.id)}`); } });
const chapterOf = (c: ChapterSpec): ChapterDef => ({
  id: c.id, clock: c.clock, phase: c.phase, steps: c.steps.map(step),
  get kicker() { return msg(`ch_${keyOf(c.id)}_kicker`); },
  get title() { return msg(`ch_${keyOf(c.id)}_title`); },
  get clockLabel() { return msg(`ch_${keyOf(c.id)}_clock`); }
});
export const CHAPTERS: ChapterDef[] = ([
  { id: 'cold-open', clock: 0, phase: null, steps: [{ id: 'co-sky' }, { id: 'co-yesterday' }, { id: 'co-hero', illustrative: true }] },
  /* …every chapter: copy id/clock/phase and each step's id/illustrative/clock from the current file; drop kicker/title/clockLabel/text … */
] as ChapterSpec[]).map(chapterOf);
```
(Write the full list from the current file: 13 chapters, 52 steps; `illustrative` and `clock` values must stay identical — `story-content.test.ts` checks clocks and illustrative flags.)

`glossary.ts` — keep the `g(term, sources)` table keyed by acronym:
```ts
import { msg, keyOf } from '$lib/i18n/msg';
const g = (term: string, sources: string[]): GlossaryEntry => ({
  term, sources,
  get expansion() { return msg(`gl_${keyOf(term)}_exp`); },
  get definition() { return msg(`gl_${keyOf(term)}_def`); }
});
export const GLOSSARY: Record<string, GlossaryEntry> = {
  NM: g('NM', ['S20', 'S2']),
  /* …every entry: keep only term + sources … */
};
```
`phases.ts` — same pattern for `label/horizon/decides` (`ph_<id>_*`), keeping `id/sources/color`.
`stakeholders.ts` — `label/role` via `ac_<id>_*`; `PHASES` labels in that file reuse `ph_<id>_label` for ATM-like labels only if identical in English; otherwise add `sp_<id>` keys (strategic, pretactical, filing, tactical, ground, departure, enroute, arrival, postops) via the extraction script (extend Step 1 with `for (const p of PHASES) en[\`sp_${p.id}\`] = p.label;` and import `PHASES`).
`flight.ts` — `EVENTS` entries get `get label() { return msg(\`ev_${keyOf(id)}\`); }`; `TURNAROUND` likewise (`tt_`); `ANSP_LABEL` becomes:
```ts
const ANSP_KEYS: AnspKey[] = ['skeyes', 'MUAC', 'ANA', 'DSNA', 'DFS', 'Skyguide', 'ENAV'];
export const ANSP_LABEL = Object.defineProperties({} as Record<AnspKey, string>,
  Object.fromEntries(ANSP_KEYS.map((k) => [k, { enumerable: true, get: () => msg(`ansp_${k}`) }])));
```
Note `EVENTS` is sorted at module load using `at` only — unaffected.

- [ ] **Step 5: Run** `npm test && npm run check && npx playwright test tests/e2e/story.spec.ts tests/e2e/phase.spec.ts` → PASS (English site identical).
- [ ] **Step 6: Commit** `git add -A && git commit -m "refactor: story content reads from Paraglide messages"`

---

### Task 4: Component and UI strings into messages

**Files:**
- Modify: every component with user-facing literals — `src/routes/[[locale=locale]]/+page.svelte`, `src/lib/ui/*.svelte`, `src/lib/viz/*.svelte`, `src/lib/chapters/*.svelte` (incl. `C11Sources.svelte`), `src/lib/viz/palette.ts` (cause labels), `messages/*.json`
- Delete: `src/lib/ui/ui-strings.ts`
- Test: `tests/unit/no-hardcoded-text.test.ts`

**Interfaces:**
- Consumes: `msg`. Produces: UI keys (prefix `ui_`), figure keys (`fig_`), cause labels (`cause_<slug>`), method/intro (`intro_`, `method_`).

- [ ] **Step 1: Failing lint-style test** — `tests/unit/no-hardcoded-text.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const files = globSync('src/{lib,routes}/**/*.svelte').filter((f) => !f.includes('/dev/'));
// attribute literals that reach readers (aria-label, title, label, subtitle, detail) and text nodes of 2+ words
const ATTR = /\b(?:aria-label|title|label|subtitle|detail|caption)="([A-Z][^"{}]*\s[^"{}]*)"/g;
const TEXT = />\s*([A-Z][a-z]+(?:\s+[a-zA-Z’'-]+){2,})\s*</g;
const ALLOW = [/^FFS101/, /^EBBR/, /^LIRF/];

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
```
(Node ≥22 has `fs.globSync`; the project runs Node 24.)
- [ ] **Step 2: Run** `npm test -- tests/unit/no-hardcoded-text.test.ts` → FAIL listing every literal.
- [ ] **Step 3: Move strings.** For each hit (and the strings in `ui-strings.ts`, the `<svelte:head>` title/description, intro paragraphs, `C11Sources` method bullets and headings, `SourceLine` "Source:", "data to", "Illustrative (fictional flight FFS101)", `FreshnessBadge` "● Live"/"◌ Snapshot" and its titles, `DataTable` "Show data table"/"Showing the first…", chart `label=` aria strings, `CasaQueue`/`AcdmTimeline`/`ChargesBar`/`ProfileChart`/`StakeholderMatrix`/`FplAnatomy` text, `OverviewTimeline` tick labels and aria-label, `PhaseDivider` "Phase {n} of 4", `ChapterDrawer`, `MissionClock`, `ThemeToggle` aria-label, `Term`/`Cite` aria text, HeroNumber labels in chapter components, Figure titles/subtitles/details/table captions/column labels) add a key to `messages/en.json` and replace the literal with `msg('key')` / `msg('key', { … })`. Parameterised strings use Paraglide variables, e.g.:
```json
"ui_chapter_of": "Chapter {n} of {total}",
"ui_sky_from": "Aircraft positions from {age} · {source}",
"ui_phase_of": "Phase {n} of 4",
"fig_atfm_yesterday_title": "ATFM delay in the European network, {when}"
```
Cause labels: in `palette.ts` replace `CAUSE_LABEL`/`CAUSE_SHORT` literals with getters over `cause_<slug>_label`/`cause_<slug>_short` (`slug` = `keyOf(cause)` lower-cased). Delete `ui-strings.ts` and replace `UI.x` usages with `msg('ui_x', …)`. Then re-run the placeholder copy from Task 3 Step 4 so all locales have the new keys.
- [ ] **Step 4: Run** `npm test && npm run check && npm run test:e2e` → PASS (English text unchanged; e2e selectors by text still match).
- [ ] **Step 5: Commit** `git add -A && git commit -m "refactor: all reader-facing UI text from messages"`

---

### Task 5: Locale-aware numbers, dates and freshness phrases

**Files:**
- Modify: `src/lib/viz/chart-utils.ts`, `src/lib/story/freshness.ts`, `src/lib/story/derive.ts` (`dayNumLabel` via `fmtDate`), `messages/en.json`
- Test: `tests/unit/format-locale.test.ts`; existing `chart-utils.test.ts`, `freshness.test.ts` keep passing in English

**Interfaces:**
- Produces: `fmtInt`, `fmtDec`, `fmtDate`, `doyLabel`, `fmtDayShort` use `intlLocale()`; `dayPhrase`/`livePhrase` return messages `fresh_yesterday` (`"yesterday ({date})"`), `fresh_today` (`"today ({date})"`), `fresh_on` (`"on {date}"`), `fresh_unknown` (`"on the latest day available"`), `live_live` (`"fetched live"`), `live_snapshot` (`"from the latest snapshot"`).

- [ ] **Step 1: Failing test** — `tests/unit/format-locale.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { withLocale } from '$lib/i18n/msg';
import { fmtInt, fmtDate, doyLabel } from '$lib/viz/chart-utils';
import { fmtDayShort, dayPhrase } from '$lib/story/freshness';

const now = new Date('2026-10-10T11:00:00Z');
describe('locale-aware formatting', () => {
  it('keeps English output unchanged', () => withLocale('en', () => {
    expect(fmtInt(37034)).toBe('37,034');
    expect(fmtDate('2026-10-08')).toBe('8 Oct 2026');
    expect(fmtDayShort('2026-10-08')).toBe('Thu 8 Oct');
    expect(doyLabel(182)).toBe('1 Jul');
  }));
  it('formats German, French and Polish numbers and dates natively', () => {
    expect(withLocale('de', () => fmtInt(37034))).toBe(new Intl.NumberFormat('de').format(37034));
    expect(withLocale('de', () => fmtDate('2026-10-08'))).toMatch(/Okt/);
    expect(withLocale('fr', () => fmtDayShort('2026-10-08'))).toMatch(/oct/);
    expect(withLocale('pl', () => fmtInt(37034))).toBe(new Intl.NumberFormat('pl').format(37034));
  });
  it('freshness phrases come from the active locale’s messages', () => {
    expect(withLocale('en', () => dayPhrase('2026-10-09', now))).toBe('yesterday (Fri 9 Oct)');
    expect(withLocale('en', () => dayPhrase(null, now))).toBe('on the latest day available');
  });
});
```
- [ ] **Step 2: Run** → FAIL (German/Polish formatting still English).
- [ ] **Step 3: Implement** — `chart-utils.ts`:
```ts
import { intlLocale } from '$lib/i18n/msg';
const nfCache = new Map<string, Intl.NumberFormat>();
const nf = (opts: Intl.NumberFormatOptions = {}) => {
  const key = intlLocale() + JSON.stringify(opts);
  if (!nfCache.has(key)) nfCache.set(key, new Intl.NumberFormat(intlLocale(), opts));
  return nfCache.get(key)!;
};
export const fmtInt = (n: number) => nf({ maximumFractionDigits: 0 }).format(Math.round(n));
export const fmtDec = (n: number, d = 1) => nf({ minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const utc = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);
export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(utc(iso));
export const doyLabel = (doy: number) =>
  new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, doy)));
```
(keep `fmtHm`, `roundedTopBar`, `nearestIndex` as they are). `freshness.ts`:
```ts
import { msg, intlLocale } from '$lib/i18n/msg';
export const fmtDayShort = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${iso.slice(0, 10)}T00:00:00Z`)).replace(',', '');
export function dayPhrase(dataDate: string | null | undefined, now = new Date()): string {
  if (!dataDate) return msg('fresh_unknown');
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  const date = fmtDayShort(dataDate);
  if (dataDate === yesterday) return msg('fresh_yesterday', { date });
  if (dataDate === today) return msg('fresh_today', { date });
  return msg('fresh_on', { date });
}
export const livePhrase = (f: Freshness | null) => msg(f === 'live' ? 'live_live' : 'live_snapshot');
```
(`.replace(',', '')` keeps English "Thu 8 Oct" and is harmless elsewhere.) Add the six `fresh_*`/`live_*` keys to `messages/en.json` and re-run the placeholder copy.
- [ ] **Step 4: Run** `npm test && npm run check` → PASS (existing English tests unchanged).
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: locale-aware numbers, dates and freshness phrases"`

---

### Task 6: Language switcher, browser hint, SEO alternates

**Files:**
- Create: `src/lib/i18n/hint.ts`, `src/lib/ui/LanguageMenu.svelte`, `src/lib/ui/LanguageHint.svelte`
- Modify: `src/lib/ui/MissionClock.svelte`, `src/routes/[[locale=locale]]/+page.svelte` (head + hint), `static/sitemap.xml`, `messages/en.json`
- Test: `tests/unit/hint.test.ts`, `tests/e2e/i18n.spec.ts` (append)

**Interfaces:**
- Produces: `preferredSupported(languages: readonly string[]): Locale | null`; `LanguageMenu.svelte` (no props); `LanguageHint.svelte` (no props; renders only on `en`).

- [ ] **Step 1: Failing tests**

`tests/unit/hint.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { preferredSupported } from '$lib/i18n/hint';

describe('preferredSupported', () => {
  it('picks the first supported non-English language before any English preference', () => {
    expect(preferredSupported(['fr-BE', 'en'])).toBe('fr');
    expect(preferredSupported(['nl', 'pl-PL'])).toBe('pl');
  });
  it('stays quiet when English comes first or nothing matches', () => {
    expect(preferredSupported(['en-GB', 'de'])).toBeNull();
    expect(preferredSupported(['nl', 'sv'])).toBeNull();
    expect(preferredSupported([])).toBeNull();
  });
});
```
Append to `tests/e2e/i18n.spec.ts`:
```ts
test('switcher goes to the same chapter in another language', async ({ page }) => {
  await page.goto('/#reroute');
  await page.getByRole('button', { name: /Language|EN/ }).click();
  await page.getByRole('link', { name: 'Deutsch' }).click();
  await expect(page).toHaveURL(/\/de\/#reroute$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#reroute')).toBeInViewport();
});

test('French browsers get a dismissible hint on the English page only', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'fr-FR' });
  const page = await ctx.newPage();
  await page.goto('/');
  const hint = page.getByTestId('language-hint');
  await expect(hint).toBeVisible();
  await hint.getByRole('button', { name: 'Non' }).click();
  await expect(hint).toBeHidden();
  await page.reload();
  await expect(page.getByTestId('language-hint')).toBeHidden();
  await page.goto('/fr/');
  await expect(page.getByTestId('language-hint')).toHaveCount(0);
  await ctx.close();
});

test('pages advertise their alternates', async ({ page }) => {
  await page.goto('/de/');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(7); // 6 locales + x-default
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://euctrl-pru.github.io/a-full-flight-story/de/');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'de_DE');
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**

`src/lib/i18n/hint.ts`
```ts
import { locales, baseLocale, type Locale } from '$lib/paraglide/runtime.js';
export function preferredSupported(languages: readonly string[]): Locale | null {
  for (const tag of languages) {
    const l = tag.toLowerCase().split('-')[0];
    if (l === baseLocale) return null;
    if ((locales as readonly string[]).includes(l)) return l as Locale;
  }
  return null;
}
```
Message keys to add (English values; Task 7 translates): `ui_language` "Language", `hint_question` "Read this story in English?" (each locale's own value is the question in that language — the hint shows the *target* locale's text, so look it up with `withLocale(target, () => msg('hint_question'))`), `hint_yes` "Yes", `hint_no` "No".

`src/lib/ui/LanguageMenu.svelte`
```svelte
<script lang="ts">
  import { getLocale } from '$lib/paraglide/runtime.js';
  import { LOCALES, localeHref } from '$lib/i18n/locales';
  import { msg } from '$lib/i18n/msg';
  let open = $state(false);
  let btn: HTMLButtonElement;
  const cur = getLocale();
  function go(e: MouseEvent, code: (typeof LOCALES)[number]['code']) {
    (e.currentTarget as HTMLAnchorElement).href = localeHref(code) + location.hash; // keep the chapter
  }
</script>

<div class="lang">
  <button type="button" bind:this={btn} aria-haspopup="true" aria-expanded={open} aria-label={msg('ui_language')}
    onclick={() => (open = !open)} onkeydown={(e) => { if (e.key === 'Escape') { open = false; btn.focus(); } }}>
    {cur.toUpperCase()} ▾
  </button>
  {#if open}
    <ul onkeydown={(e) => { if (e.key === 'Escape') { open = false; btn.focus(); } }}>
      {#each LOCALES as l (l.code)}
        <li><a href={localeHref(l.code)} hreflang={l.code} lang={l.code} data-sveltekit-reload aria-current={l.code === cur ? 'true' : undefined} onclick={(e) => go(e, l.code)}>{l.name}</a></li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .lang { position: relative; }
  button { all: unset; cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); }
  button:focus-visible { outline: 2px solid var(--accent); }
  ul { position: absolute; right: 0; top: calc(100% + 6px); list-style: none; margin: 0; padding: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; z-index: 60; min-width: 140px; }
  a { display: block; padding: 6px 10px; border-radius: 6px; color: var(--ink); text-decoration: none; }
  a:hover, a:focus-visible { background: var(--surface-2); }
  a[aria-current] { font-weight: 700; }
</style>
```
In `MissionClock.svelte` render `<LanguageMenu />` between `<ChapterDrawer />` and `<ThemeToggle />` (inside the `{#if nav}` block, since the dev page has no locales).

`src/lib/ui/LanguageHint.svelte`
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocale, type Locale } from '$lib/paraglide/runtime.js';
  import { preferredSupported } from '$lib/i18n/hint';
  import { localeHref } from '$lib/i18n/locales';
  import { msg, withLocale } from '$lib/i18n/msg';
  let target: Locale | null = $state(null);
  onMount(() => {
    if (getLocale() !== 'en') return;
    try { if (localStorage.getItem('lang-hint-dismissed') === '1') return; } catch {}
    target = preferredSupported(navigator.languages ?? [navigator.language]);
  });
  const text = $derived(target ? withLocale(target, () => ({ q: msg('hint_question'), yes: msg('hint_yes'), no: msg('hint_no') })) : null);
  function dismiss() { target = null; try { localStorage.setItem('lang-hint-dismissed', '1'); } catch {} }
</script>

{#if target && text}
  <div class="hint" data-testid="language-hint" lang={target} role="region" aria-label={text.q}>
    <span>{text.q}</span>
    <a href={localeHref(target)} data-sveltekit-reload onclick={(e) => ((e.currentTarget as HTMLAnchorElement).href = localeHref(target!) + location.hash)}>{text.yes}</a>
    <button type="button" onclick={dismiss}>{text.no}</button>
  </div>
{/if}

<style>
  .hint { position: fixed; top: var(--clock-h); left: 50%; transform: translateX(-50%); z-index: 49; display: flex; gap: 12px; align-items: center; padding: 8px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 0 0 10px 10px; font-size: 14px; max-width: calc(100vw - 16px); }
  a { color: var(--accent); font-weight: 600; }
  button { all: unset; cursor: pointer; color: var(--ink-2); text-decoration: underline; }
  button:focus-visible { outline: 2px solid var(--accent); }
</style>
```
Note `withLocale` resets the override to English afterwards — correct on the English page (the only place the hint renders).

Page head (`+page.svelte`): build per-locale SEO from `data.locale`:
```svelte
<script lang="ts">
  /* existing imports … */
  import { LOCALES } from '$lib/i18n/locales';
  import { msg } from '$lib/i18n/msg';
  import LanguageHint from '$lib/ui/LanguageHint.svelte';
  let { data } = $props();
  const url = (l: string) => (l === 'en' ? SITE_URL : `${SITE_URL}${l}/`);
  const OG: Record<string, string> = { en: 'en_GB', de: 'de_DE', fr: 'fr_FR', it: 'it_IT', es: 'es_ES', pl: 'pl_PL' };
</script>
<svelte:head>
  <title>{msg('seo_title')}</title>
  <meta name="description" content={msg('seo_description')} />
  <link rel="canonical" href={url(data.locale)} />
  {#each LOCALES as l (l.code)}<link rel="alternate" hreflang={l.code} href={url(l.code)} />{/each}
  <link rel="alternate" hreflang="x-default" href={SITE_URL} />
  <meta property="og:locale" content={OG[data.locale]} />
  {#each LOCALES.filter((l) => l.code !== data.locale) as l (l.code)}<meta property="og:locale:alternate" content={OG[l.code]} />{/each}
  <!-- og:title/description/twitter:* use msg('seo_title') / msg('seo_description'); og:url = url(data.locale); JSON-LD adds inLanguage: data.locale -->
</svelte:head>
<LanguageHint />
```
(Move `SITE_TITLE`/`SITE_DESCRIPTION` into messages `seo_title`/`seo_description`; keep `SITE_URL` in `site.ts`.)

`static/sitemap.xml` — six `<url>` entries, each with `xhtml:link rel="alternate"` for all locales (namespace `xmlns:xhtml="http://www.w3.org/1999/xhtml"`).

Re-run the placeholder copy for new keys.
- [ ] **Step 4: Run** `npm test && npm run check && npx playwright test tests/e2e/i18n.spec.ts tests/e2e/seo.spec.ts tests/e2e/nav.spec.ts tests/e2e/a11y.spec.ts` → PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: language menu, browser-language hint and hreflang alternates"`

---

### Task 7: Translations and parity guarantees

**Files:**
- Modify: `messages/{de,fr,it,es,pl}.json` (full translations), `messages/en.json` (`method_ai_note` key)
- Create: `tests/unit/i18n-parity.test.ts`, `docs/i18n-terminology.md`

**Interfaces:**
- Consumes: `parseRich`, `citedIds`, `termIds`, `varIds`.

- [ ] **Step 1: Failing parity tests** — `tests/unit/i18n-parity.test.ts`
```ts
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
const SAME = new Set(['site_title_short', 'ansp_MUAC', 'ansp_DFS', 'ansp_ENAV', 'ansp_DSNA', 'ansp_skeyes', 'ansp_Skyguide', 'ansp_ANA']);
const sameOk = (k: string, v: string) => SAME.has(k) || /^[A-Z0-9 ·→()\-–./]+$/.test(v) || k.startsWith('gl_') && k.endsWith('_exp');

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
```
Add `"method_ai_note": "This version was translated from the English original with AI assistance."` to `messages/en.json` and render it in `C11Sources.svelte` as the last method bullet **only when `getLocale() !== 'en'`**.
- [ ] **Step 2: Run** `npm test -- tests/unit/i18n-parity.test.ts` → FAIL (placeholders are English).
- [ ] **Step 3: Terminology** — write `docs/i18n-terminology.md`, the fixed glossary every translation uses (terms that must be rendered the same way everywhere in a locale):

| English | de | fr | it | es | pl |
|---|---|---|---|---|---|
| air navigation service provider | Flugsicherungsorganisation | prestataire de services de navigation aérienne | fornitore di servizi di navigazione aerea | proveedor de servicios de navegación aérea | instytucja zapewniająca służby żeglugi powietrznej |
| air traffic control (ATC) | Flugsicherung / Fluglotsen | contrôle aérien | controllo del traffico aereo | control de tránsito aéreo | kontrola ruchu lotniczego |
| airport slot | Zeitnische (Slot) am Flughafen | créneau aéroportuaire | bande oraria aeroportuale (slot) | franja horaria aeroportuaria (slot) | slot (przydział czasu) na lotnisku |
| take-off slot (CTOT) | Startslot (CTOT) | créneau de décollage (CTOT) | slot di decollo (CTOT) | slot de despegue (CTOT) | slot startowy (CTOT) |
| regulation (ATFM) | ATFM-Regulierung | régulation ATFM | regolazione ATFM | regulación ATFM | regulacja ATFM |
| flight plan | Flugplan | plan de vol | piano di volo | plan de vuelo | plan lotu |
| Network Manager | Netzwerkmanager (Network Manager) | Gestionnaire de réseau (Network Manager) | Network Manager | Gestor de Red (Network Manager) | Menedżer Sieci (Network Manager) |
| reroute | Umleitung | reroutage | reinstradamento | cambio de ruta | zmiana trasy |
| turnaround | Bodenabfertigung (Turnaround) | escale (rotation) | rotazione a terra (turnaround) | escala (turnaround) | obsługa naziemna (turnaround) |
| route charges | Streckengebühren | redevances de route | tariffe di rotta | tasas de ruta | opłaty trasowe |
| strategic / pre-tactical / tactical / post-operations | strategisch / prätaktisch / taktisch / Nachbetrachtung | stratégique / pré-tactique / tactique / post-opérations | strategica / pre-tattica / tattica / post-operazioni | estratégica / pre-táctica / táctica / post-operaciones | strategiczna / przedtaktyczna / taktyczna / po operacjach |
| sources & method | Quellen & Methode | Sources et méthode | Fonti e metodo | Fuentes y método | Źródła i metoda |

- [ ] **Step 4: Translate** each locale file from `messages/en.json` (five independent translations — may be done in parallel by translation subagents, one per locale, each given `messages/en.json`, `docs/i18n-terminology.md` and these rules):
  - keep every `[S…]`/`[D-…]` citation, every `[[TERM]]`/`[[TERM|…]]` term id (translate only the `|label`), every `[[name:arg]]` token and every `{param}` exactly;
  - keep `**bold**`/`*em*` markup; keep proper names (FFS101, Brussels Airport, skeyes, MUAC, ENAV …), numbers and units; localise number punctuation inside prose (e.g. "37.034" in German prose);
  - glossary `gl_*_exp`: official local expansion where one exists, else keep English; `gl_*_def`: translate;
  - natural, journalistic register for an informed general public; no added or removed facts;
  - `hint_question` is the question "Read this story in <language>?" written in that language.
  Run the parity test after each locale; fix every reported key.
- [ ] **Step 5: Run** `npm test && npm run check` → PASS (all parity tests green for de, fr, it, es, pl).
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: German, French, Italian, Spanish and Polish translations"`

---

### Task 8: Localized QA, budgets, README and release

**Files:**
- Modify: `tests/e2e/i18n.spec.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/perf.spec.ts`, `README.md`, possibly components with layout fixes
- Test: whole suite

- [ ] **Step 1: Localized e2e** — append to `tests/e2e/i18n.spec.ts`:
```ts
import { walkStory } from './helpers';

test('every locale shows translated text and no raw keys', async ({ page }) => {
  const h1: Record<string, string> = {};
  for (const l of ['', 'de/', 'fr/', 'it/', 'es/', 'pl/']) {
    await page.goto(`/${l}`);
    h1[l] = (await page.locator('h1').textContent())!.trim();
    const body = await page.locator('main').innerText();
    expect(body, l).not.toMatch(/\b(?:step|ch|gl|ph|ac|ev|tt|ui|fig|cause|fresh|live|seo|method|hint)_[a-z0-9_]+\b/);
    expect(body, l).not.toContain('undefined');
  }
  expect(new Set(Object.values(h1)).size).toBe(6);
});

test('deep link into a German chapter', async ({ page }) => {
  await page.goto('/de/#twist');
  await expect(page.locator('#twist')).toBeInViewport();
  await expect(page.locator('.clock .now')).toContainText('Taktisch');
});

test('German walk at phone width has no horizontal overflow', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  await page.goto('/de/');
  await walkStory(page, async (id, i) => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${id} ${i}`).toBeLessThanOrEqual(0);
  });
});
```
(`ph_tactical_label` in German must be "Taktisch" — keep the terminology table and this test in sync.)
In `tests/e2e/a11y.spec.ts`, add a second loop over `'/pl/'` with the same selectors and drawer check. In `tests/e2e/perf.spec.ts`, run the JS-budget test for both `/` and `/de/`.
- [ ] **Step 2: Base path check** — build with `BASE_PATH=/a-full-flight-story npm run build`, serve `build/` under `/a-full-flight-story/` (copy into a temp dir `…/a-full-flight-story/` and `python3 -m http.server --bind 127.0.0.1 8095`), then with a Playwright script load each of the six URLs, asserting status 200, the right `lang`, no 4xx responses and that the language menu links point at `/a-full-flight-story/<locale>/`.
- [ ] **Step 3: Run** `npm test && npm run check && npm run test:e2e` → all PASS. If the German walk overflows, fix the component (wrap/shorten via CSS, never by truncating content), re-run.
- [ ] **Step 4: Visual review** — settled screenshots (1.3 s per step) of every chapter in `de` (desktop + 390 px) and spot-check `fr`, `it`, `es`, `pl` (cold open, a divider, the timeline, the drawer, A-CDM, charges); Read the contact sheets; fix clipped labels.
- [ ] **Step 5: README** — add a "Languages" section: locales and URLs, Paraglide (`messages/*.json`, `npm run i18n`), the parity tests, the AI-translation note, and how to change copy (edit `messages/en.json`, then update the five locales until `i18n-parity` passes).
- [ ] **Step 6: Commit** `git add -A && git commit -m "test: localized QA, budgets and README for the multilingual site"`
- [ ] **Step 7: Release — ask first.** Merging to `main` and pushing redeploys the public site; ask Quinten before `git push`.
