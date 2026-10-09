# A Full Flight Story — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static, scroll-driven data story that follows the fictional flight FFS101 Brussels → Rome from strategic planning to post-ops, explaining every European ATM stakeholder, with real EUROCONTROL data (snapshot + live) and a live-ish ADS-B sky snapshot, sources cited everywhere.

**Architecture:** SvelteKit 2 (Svelte 5 runes) prerendered with `adapter-static` and deployed to GitHub Pages. Pure, unit-tested TypeScript modules hold all logic (API client/parsers, live loader, geo/route math, hero-flight model, CASA slot simulator, route charges, rich-text/citation parser). Svelte components only render: Scrollama drives a sticky-graphic scrollytelling layout and D3 (scales, shapes, geo) computes the SVG/Canvas geometry. A scheduled GitHub Action refreshes `static/data/*.json` (EUROCONTROL + OpenSky) at build time; the browser additionally fetches EUROCONTROL live and upgrades in place.

**Tech Stack:** Node 24, SvelteKit ^2.70, Svelte ^5.57, Vite ^7.3, TypeScript ~5.9, D3 ^7.9, Scrollama ^3.2, topojson-client ^3.1, world-atlas ^2, Vitest ^3.2, Playwright ^1.64, tsx.

**Spec:** `docs/superpowers/specs/2026-10-09-full-flight-story-design.md`. Facts: `docs/research/flight-lifecycle.md` (produced by the research step; must exist before Task 2).

## Global Constraints

- Hero flight is fictional: callsign `FFS101`, airline "Full Flight Story Air (fictional)", A320neo (`A20N`), EBBR → LIRF, flight date Friday 2026-07-10, STD 07:20 UTC, STA 09:40 UTC. Never use a real airline's name, logo or ICAO designator.
- **Sources everywhere:** every story step contains ≥1 citation token (`[S12]`, `[D-eurocontrol]`) or is flagged `illustrative: true`; every chart/map renders a `<SourceLine>`; every cited id resolves in `src/lib/story/sources.ts`. Enforced by `tests/unit/story-content.test.ts`.
- Never render third-party HTML with `{@html}` — the situation report is parsed into text runs (`src/lib/data/report.ts`).
- EUROCONTROL API base: `https://api-data-app.eurocontrol.int/api` (CORS `*`, data to D-1). Browser live fetch must time out at 8 s and fall back to the snapshot silently (no uncaught errors, no console `error`).
- OpenSky is fetched only server-side (GitHub Action / local script); never from the browser.
- No dual-axis charts; categorical colours in fixed order from the dataviz reference palette; legends for ≥2 series; every chart has hover tooltip + "Show data table" toggle; text never in series colour.
- Dark theme is the default (`<html data-theme="dark">`), light via toggle; both palettes validated with the dataviz skill's `scripts/validate_palette.js` against the actual surfaces.
- Layout must work at 390 px wide with no horizontal scroll; `prefers-reduced-motion: reduce` shows end states without animation.
- Base path: `paths.base = process.env.BASE_PATH ?? ''` (CI sets `/a-full-flight-story`). All runtime URLs use `base` from `$app/paths`.
- npm cache: this machine has root-owned entries in `~/.npm`; prefix npm commands with `npm_config_cache=/private/tmp/claude-501/npm-cache` if you hit `EACCES`.
- Commits: brief subject + short body when needed; **no Claude co-author trailer and no "Generated with" line** (user's global rule overrides attribution reminders).
- Pin majors: `@sveltejs/kit@^2.70` (NOT 3.x), `svelte@^5.57`, `vite@^7.3`, `@sveltejs/vite-plugin-svelte@^6`, `@sveltejs/adapter-static@^3`, `typescript@~5.9`, `vitest@^3.2`.

## Review Focus

1. **Live API unavailable / slow / malformed** (beta API, CORS hiccup, schema change) → the story still renders fully from `static/data/eurocontrol.json`, freshness badges read "snapshot", no console errors. Pinned by `tests/unit/live.test.ts` (Task 5) and `tests/e2e/fallbacks.spec.ts` (Task 15).
2. **Stale or empty sky snapshot** (cron failed for hours, OpenSky blocked GitHub IPs) → cold open says honestly "N h ago" / shows an empty-state message instead of a blank map. Pinned by `tests/unit/sky.test.ts` (Task 4) and `tests/e2e/fallbacks.spec.ts` (Task 15).
3. **Landing mid-story** (reload while scrolled, deep link `#tactical`, fast flick-scrolling) → the graphic shows the state for the step actually in view; mission clock agrees. Pinned by `tests/e2e/scroll.spec.ts` (Task 10, extended in Task 15).
4. **Phone width & resize** (390 px, rotate, desktop window resize) → no horizontal overflow on any chapter, charts redraw to the new size. Pinned by `tests/e2e/responsive.spec.ts` (Task 15).
5. **Hostile/odd third-party text** (situation report containing `<script>`, entities, nested tags) → rendered as inert text. Pinned by `tests/unit/report.test.ts` (Task 3).

---

## File Structure

```
package.json · svelte.config.js · vite.config.ts · tsconfig.json · playwright.config.ts · .gitignore
.github/workflows/deploy.yml            # build + deploy Pages on push and every 30 min (cron)
scripts/
  extract-sources.ts                    # research doc "## Sources" table → src/lib/story/sources.generated.json
  fetch-eurocontrol.ts                  # snapshot → static/data/eurocontrol.json
  fetch-sky.ts                          # OpenSky (fallback adsb.lol) → static/data/sky.json
static/data/eurocontrol.json · static/data/sky.json   # committed baseline snapshots
src/
  app.html · app.css                    # design tokens (dark default + light), base typography
  routes/+layout.ts · +layout.svelte · +page.svelte
  lib/
    data/
      eurocontrol.ts                    # API client + pure parsers + ENTITIES
      report.ts                         # situation-report HTML → safe text blocks
      series.ts                         # day-of-year, year-of-series, stacking helpers
      sky.ts                            # OpenSky/adsb.lol parsers, snapshot builder
      live.ts                           # snapshot-then-live loader (pure, injectable fetch)
      liveState.svelte.ts               # shared $state for components
    geo/
      projection.ts · countries.ts · route.ts
    sim/
      casa.ts · demand.ts · charges.ts
    story/
      types.ts · sources-parse.ts · sources.ts · sources.generated.json
      richtext.ts · glossary.ts · stakeholders.ts · flight.ts · fpl.ts · charges-data.ts · chapters.ts
    scroll/
      Scrolly.svelte · storyState.svelte.ts · motion.ts
    ui/
      Chapter.svelte · StepCard.svelte · RichText.svelte · Cite.svelte · Term.svelte
      MissionClock.svelte · ThemeToggle.svelte · FreshnessBadge.svelte · SourcesList.svelte
    viz/
      palette.ts · chart-utils.ts · Tooltip.svelte · Legend.svelte · DataTable.svelte · SourceLine.svelte
      HeroNumber.svelte · LineChart.svelte · StackedArea.svelte · BarChart.svelte
      BaseMap.svelte · SkyCanvas.svelte · RouteMap.svelte
      FplAnatomy.svelte · CasaQueue.svelte · AcdmTimeline.svelte · ProfileChart.svelte
      ChargesBar.svelte · StakeholderMatrix.svelte
    chapters/
      C00ColdOpen.svelte … C10Sources.svelte  (one per chapter)
tests/
  fixtures/eurocontrol/*.json
  unit/*.test.ts
  e2e/*.spec.ts
```

---

### Task 1: Scaffold SvelteKit, tooling and design tokens

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `playwright.config.ts`, `.gitignore`, `src/app.html`, `src/app.css`, `src/app.d.ts`, `src/routes/+layout.ts`, `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `src/lib/scrollama.d.ts`
- Test: `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: npm scripts `dev build preview check test test:e2e fetch:eurocontrol fetch:sky sources`; CSS custom properties (`--bg`, `--surface`, `--ink`, `--ink-2`, `--muted`, `--grid`, `--axis`, `--border`, `--accent`, `--series-1..8`, `--seq-100..700`, `--status-good|warning|serious|critical`, `--font-sans`, `--font-display`, `--step-col`).

- [ ] **Step 1: Write package.json and install**

```json
{
  "name": "a-full-flight-story",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "fetch:eurocontrol": "tsx scripts/fetch-eurocontrol.ts",
    "fetch:sky": "tsx scripts/fetch-sky.ts",
    "sources": "tsx scripts/extract-sources.ts"
  }
}
```

Run:
```bash
npm i -D @sveltejs/kit@^2.70 @sveltejs/adapter-static@^3 @sveltejs/vite-plugin-svelte@^6 svelte@^5.57 vite@^7.3 typescript@~5.9 svelte-check vitest@^3.2 @playwright/test@^1.64 tsx @types/d3 @types/topojson-client @types/geojson @types/node
npm i d3@^7.9 scrollama@^3.2 topojson-client@^3.1 world-atlas@^2
npx playwright install chromium
```
Expected: installs without peer-dependency errors.

- [ ] **Step 2: Config files**

`svelte.config.js`
```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ pages: 'build', assets: 'build', strict: true }),
    paths: { base: process.env.BASE_PATH ?? '' }
  }
};
```

`vite.config.ts`
```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' }
});
```

`tsconfig.json`
```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true
  }
}
```

`playwright.config.ts`
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000
  },
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
    }
  ]
});
```

`.gitignore`
```
node_modules
build
.svelte-kit
test-results
playwright-report
screenshots
.DS_Store
```

`src/lib/scrollama.d.ts`
```ts
declare module 'scrollama' {
  export interface StepEvent { element: HTMLElement; index: number; direction: 'up' | 'down' }
  export interface ProgressEvent { element: HTMLElement; index: number; progress: number; direction: 'up' | 'down' }
  export interface Scroller {
    setup(opts: { step: string | Element[] | NodeListOf<Element>; offset?: number; progress?: boolean; threshold?: number; debug?: boolean }): Scroller;
    onStepEnter(cb: (e: StepEvent) => void): Scroller;
    onStepExit(cb: (e: StepEvent) => void): Scroller;
    onStepProgress(cb: (e: ProgressEvent) => void): Scroller;
    resize(): Scroller;
    destroy(): void;
  }
  export default function scrollama(): Scroller;
}
```

`src/app.d.ts`
```ts
declare global {
  namespace App {}
}
export {};
```

`src/routes/+layout.ts`
```ts
export const prerender = true;
export const trailingSlash = 'always';
```

- [ ] **Step 3: Design tokens and shell**

`src/app.html`
```html
<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap" rel="stylesheet" />
    <script>
      try { const t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch {}
    </script>
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

`src/app.css` (values from the dataviz reference palette; the night surfaces are validated in Task 11)
```css
:root,
:root[data-theme='dark'] {
  color-scheme: dark;
  --bg: #0a0d14;
  --surface: #10141d;
  --surface-2: #161b26;
  --ink: #ffffff;
  --ink-2: #c3c2b7;
  --muted: #898781;
  --grid: #232836;
  --axis: #383d4a;
  --border: rgba(255, 255, 255, 0.1);
  --accent: #3987e5;
  --series-1: #3987e5; --series-2: #d95926; --series-3: #199e70; --series-4: #c98500;
  --series-5: #d55181; --series-6: #008300; --series-7: #9085e9; --series-8: #e66767;
  --seq-100: #0d366b; --seq-200: #104281; --seq-300: #184f95; --seq-400: #1c5cab;
  --seq-500: #2a78d6; --seq-600: #5598e7; --seq-700: #9ec5f4;
  --status-good: #0ca30c; --status-warning: #fab219; --status-serious: #ec835a; --status-critical: #d03b3b;
}
:root[data-theme='light'] {
  color-scheme: light;
  --bg: #f9f9f7;
  --surface: #fcfcfb;
  --surface-2: #f0efec;
  --ink: #0b0b0b;
  --ink-2: #52514e;
  --muted: #898781;
  --grid: #e1e0d9;
  --axis: #c3c2b7;
  --border: rgba(11, 11, 11, 0.1);
  --accent: #2a78d6;
  --series-1: #2a78d6; --series-2: #eb6834; --series-3: #1baf7a; --series-4: #eda100;
  --series-5: #e87ba4; --series-6: #008300; --series-7: #4a3aa7; --series-8: #e34948;
  --seq-100: #cde2fb; --seq-200: #9ec5f4; --seq-300: #6da7ec; --seq-400: #3987e5;
  --seq-500: #256abf; --seq-600: #184f95; --seq-700: #0d366b;
}
:root {
  --font-sans: system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-display: 'Fraunces', Georgia, serif;
  --step-col: 0px;
  --clock-h: 44px;
}
@media (min-width: 1024px) {
  :root { --step-col: 420px; }
}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--font-sans); }
body { font-size: 18px; line-height: 1.55; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
h1, h2 { font-family: var(--font-display); font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; }
a { color: var(--accent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }
}
```

`src/routes/+layout.svelte`
```svelte
<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

{@render children()}
```

`src/routes/+page.svelte` (temporary; replaced in Task 10)
```svelte
<svelte:head><title>A Full Flight Story</title></svelte:head>
<main><h1>A Full Flight Story</h1></main>
```

- [ ] **Step 4: Write smoke tests**

`tests/unit/smoke.test.ts`
```ts
import { describe, it, expect } from 'vitest';
describe('toolchain', () => {
  it('runs vitest', () => expect(1 + 1).toBe(2));
});
```

`tests/e2e/smoke.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test('home renders title without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A Full Flight Story');
  expect(errors).toEqual([]);
});
```

- [ ] **Step 5: Run everything**

Run: `npx svelte-kit sync && npm run check && npm test && npm run test:e2e`
Expected: svelte-check 0 errors; vitest 1 passed; playwright 2 passed (desktop + mobile).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold SvelteKit static site with tokens and test tooling"
```

---

### Task 2: Source registry and rich-text/citation parser

**Files:**
- Create: `src/lib/story/types.ts`, `src/lib/story/sources-parse.ts`, `scripts/extract-sources.ts`, `src/lib/story/sources.generated.json` (generated), `src/lib/story/sources.ts`, `src/lib/story/richtext.ts`
- Test: `tests/unit/sources.test.ts`, `tests/unit/richtext.test.ts`

**Interfaces:**
- Consumes: `docs/research/flight-lifecycle.md` with a `## Sources` markdown table `| id | title | publisher | url | accessed |`.
- Produces:
  - `type Source = { id: string; title: string; publisher: string; url: string; accessed: string }`
  - `parseSourcesTable(md: string): Source[]`
  - `SOURCES: Record<string, Source>`, `getSource(id: string): Source` (throws on unknown), `DATA_SOURCES: Source[]`
  - `type Run = { kind: 'text' | 'strong' | 'em'; text: string } | { kind: 'term'; id: string; text: string } | { kind: 'cite'; ids: string[] }`
  - `parseRich(s: string): Run[]`, `citedIds(s: string): string[]`, `termIds(s: string): string[]`
  - `CITE_ID = /^(S\d+|D-[a-z-]+)$/`

- [ ] **Step 1: Write the failing tests**

`tests/unit/sources.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { parseSourcesTable } from '$lib/story/sources-parse';
import { SOURCES, getSource } from '$lib/story/sources';

const md = `# Doc
Some text [S1].

## Sources

| id | title | publisher | url | accessed |
|---|---|---|---|---|
| S1 | IFPS Users Manual | EUROCONTROL | https://example.org/ifps | 2026-10-09 |
| S2 | ATFCM Users Manual | EUROCONTROL | <https://example.org/atfcm> ; https://mirror.example.org | 2026-10-09 |

## After
| x | y |
`;

describe('parseSourcesTable', () => {
  it('parses rows of the Sources table only', () => {
    const s = parseSourcesTable(md);
    expect(s).toEqual([
      { id: 'S1', title: 'IFPS Users Manual', publisher: 'EUROCONTROL', url: 'https://example.org/ifps', accessed: '2026-10-09' },
      { id: 'S2', title: 'ATFCM Users Manual', publisher: 'EUROCONTROL', url: 'https://example.org/atfcm', accessed: '2026-10-09' }
    ]);
  });
  it('throws when there is no Sources section', () => {
    expect(() => parseSourcesTable('# nothing')).toThrow(/Sources/);
  });
});

describe('registry', () => {
  it('contains generated and data sources with https urls', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(10);
    expect(getSource('D-eurocontrol').publisher).toBe('EUROCONTROL');
    for (const s of Object.values(SOURCES)) expect(s.url).toMatch(/^https?:\/\//);
  });
  it('throws on unknown id', () => {
    expect(() => getSource('S99999')).toThrow(/Unknown source/);
  });
});
```

`tests/unit/richtext.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { parseRich, citedIds, termIds } from '$lib/story/richtext';

describe('parseRich', () => {
  it('splits text, emphasis, terms and citations', () => {
    expect(parseRich('The **airline** files with {IFPS} *days* ahead [S3, D-eurocontrol].')).toEqual([
      { kind: 'text', text: 'The ' },
      { kind: 'strong', text: 'airline' },
      { kind: 'text', text: ' files with ' },
      { kind: 'term', id: 'IFPS', text: 'IFPS' },
      { kind: 'text', text: ' ' },
      { kind: 'em', text: 'days' },
      { kind: 'text', text: ' ahead ' },
      { kind: 'cite', ids: ['S3', 'D-eurocontrol'] },
      { kind: 'text', text: '.' }
    ]);
  });
  it('supports a display label for terms', () => {
    expect(parseRich('{CTOT|a slot}')).toEqual([{ kind: 'term', id: 'CTOT', text: 'a slot' }]);
  });
  it('leaves non-citation brackets as text', () => {
    expect(parseRich('[see below]')).toEqual([{ kind: 'text', text: '[see below]' }]);
  });
  it('collects ids', () => {
    const s = 'A [S1] b {TOBT} c [S2, S1] {CTOT|slot}';
    expect(citedIds(s)).toEqual(['S1', 'S2']);
    expect(termIds(s)).toEqual(['TOBT', 'CTOT']);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/sources.test.ts tests/unit/richtext.test.ts`
Expected: FAIL — cannot resolve `$lib/story/sources-parse`.

- [ ] **Step 3: Implement**

`src/lib/story/types.ts`
```ts
export interface Source { id: string; title: string; publisher: string; url: string; accessed: string }

export interface StepDef {
  id: string;
  /** Rich text: **bold**, *em*, {TERM} or {TERM|label}, citations [S1, D-eurocontrol]. Paragraphs split by blank line. */
  text: string;
  illustrative?: boolean;
  /** Mission-clock position 0..1 for this step; defaults to the chapter's. */
  clock?: number;
}

export interface ChapterDef {
  id: string;
  kicker: string;
  title: string;
  clockLabel: string;
  clock: number;
  steps: StepDef[];
}
```

`src/lib/story/sources-parse.ts`
```ts
import type { Source } from './types';

export function parseSourcesTable(md: string): Source[] {
  const start = md.search(/^##\s+Sources\s*$/m);
  if (start < 0) throw new Error('No "## Sources" section found');
  const rest = md.slice(start).split('\n').slice(1);
  const out: Source[] = [];
  let inTable = false;
  for (const line of rest) {
    if (/^##\s/.test(line)) break;
    if (!line.trim().startsWith('|')) { if (inTable) break; continue; }
    inTable = true;
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (cells.length < 5 || !/^S\d+$/.test(cells[0])) continue; // header / separator rows
    const [id, title, publisher, url, accessed] = cells;
    out.push({ id, title, publisher, url: url.split(/\s*;\s*/)[0].replace(/^<|>$/g, ''), accessed });
  }
  return out;
}
```

`scripts/extract-sources.ts`
```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { parseSourcesTable } from '../src/lib/story/sources-parse.ts';

const md = readFileSync('docs/research/flight-lifecycle.md', 'utf8');
const sources = parseSourcesTable(md);
writeFileSync('src/lib/story/sources.generated.json', JSON.stringify(sources, null, 2) + '\n');
console.log(`wrote ${sources.length} sources`);
```

`src/lib/story/sources.ts`
```ts
import generated from './sources.generated.json';
import type { Source } from './types';

export const DATA_SOURCES: Source[] = [
  { id: 'D-eurocontrol', title: 'EUROCONTROL Data app API (beta) — traffic, ATFM delay, punctuality, CO₂', publisher: 'EUROCONTROL', url: 'https://data-app.eurocontrol.int/api', accessed: '2026-10-09' },
  { id: 'D-situation', title: 'EUROCONTROL Data app — weekly Network situation report', publisher: 'EUROCONTROL', url: 'https://data-app.eurocontrol.int/', accessed: '2026-10-09' },
  { id: 'D-opensky', title: 'OpenSky Network REST API — all state vectors', publisher: 'OpenSky Network', url: 'https://openskynetwork.github.io/opensky-api/rest.html', accessed: '2026-10-09' },
  { id: 'D-adsblol', title: 'adsb.lol open ADS-B API', publisher: 'adsb.lol', url: 'https://api.adsb.lol/docs', accessed: '2026-10-09' },
  { id: 'D-naturalearth', title: 'Natural Earth 1:50m admin-0 countries (via world-atlas)', publisher: 'Natural Earth', url: 'https://github.com/topojson/world-atlas', accessed: '2026-10-09' }
];

export const SOURCES: Record<string, Source> = Object.fromEntries(
  [...(generated as Source[]), ...DATA_SOURCES].map((s) => [s.id, s])
);

export function getSource(id: string): Source {
  const s = SOURCES[id];
  if (!s) throw new Error(`Unknown source id: ${id}`);
  return s;
}
```

`src/lib/story/richtext.ts`
```ts
export type Run =
  | { kind: 'text' | 'strong' | 'em'; text: string }
  | { kind: 'term'; id: string; text: string }
  | { kind: 'cite'; ids: string[] };

export const CITE_ID = /^(S\d+|D-[a-z-]+)$/;
const ID = String.raw`(?:S\d+|D-[a-z-]+)`;
const TOKEN = new RegExp(
  String.raw`\*\*(.+?)\*\*|\*(.+?)\*|\{([A-Za-z0-9-]+)(?:\|([^}]+))?\}|\[(${ID}(?:\s*,\s*${ID})*)\]`,
  'g'
);

export function parseRich(s: string): Run[] {
  const runs: Run[] = [];
  let last = 0;
  const pushText = (t: string) => {
    if (!t) return;
    const prev = runs.at(-1);
    if (prev && prev.kind === 'text') prev.text += t;
    else runs.push({ kind: 'text', text: t });
  };
  for (const m of s.matchAll(TOKEN)) {
    pushText(s.slice(last, m.index));
    if (m[1] !== undefined) runs.push({ kind: 'strong', text: m[1] });
    else if (m[2] !== undefined) runs.push({ kind: 'em', text: m[2] });
    else if (m[3] !== undefined) runs.push({ kind: 'term', id: m[3], text: m[4] ?? m[3] });
    else runs.push({ kind: 'cite', ids: m[5].split(',').map((x) => x.trim()) });
    last = m.index! + m[0].length;
  }
  pushText(s.slice(last));
  return runs;
}

const uniq = (xs: string[]) => [...new Set(xs)];
export const citedIds = (s: string) =>
  uniq(parseRich(s).flatMap((r) => (r.kind === 'cite' ? r.ids : [])));
export const termIds = (s: string) =>
  uniq(parseRich(s).flatMap((r) => (r.kind === 'term' ? [r.id] : [])));
```

Run: `npm run sources`
Expected: `wrote N sources` (N > 10) and `src/lib/story/sources.generated.json` exists.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/sources.test.ts tests/unit/richtext.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/lib/story scripts/extract-sources.ts tests/unit/sources.test.ts tests/unit/richtext.test.ts
git commit -m "feat: source registry from research doc and rich-text citation parser"
```

---

### Task 3: EUROCONTROL API client, report parser and snapshot script

**Files:**
- Create: `src/lib/data/eurocontrol.ts`, `src/lib/data/report.ts`, `src/lib/data/series.ts`, `scripts/fetch-eurocontrol.ts`, `tests/fixtures/eurocontrol/*.json`, `static/data/eurocontrol.json` (generated)
- Test: `tests/unit/eurocontrol.test.ts`, `tests/unit/report.test.ts`, `tests/unit/series.test.ts`

**Interfaces:**
- Produces (`eurocontrol.ts`):
  - `API_BASE`, `ENTITIES` (keys `network EBBR LIRF skeyes MUAC DSNA DFS Skyguide ENAV`), `type EntityKey`
  - `type SeriesPoint = { date: string; value: number }` (date `YYYY-MM-DD`)
  - `type Series = { name: string; chartType: string; dateRange: string | null; share: number | null; points: SeriesPoint[] }`
  - `type Headline = { flights: number | null; delayMinutes: number | null; delayPerFlight: number | null }`
  - `type EntityBundle = { key: EntityKey; label: string; syncId: number; dataDate: string; traffic: Series[]; delay: Series[]; punctuality: Series[]; co2: Series[]; headline: Headline }`
  - `type SituationReport = { date: string; title: string; blocks: ReportBlock[] }`
  - `type EurocontrolSnapshot = { generatedAt: string; bundles: Partial<Record<EntityKey, EntityBundle>>; report: SituationReport | null }`
  - `apiUrl(path, params)`, `parseSync(json)`, `parseCharts(json)`, `parseHeadline(trafficNetworks, delayNetworks)`, `findSeries(list, q)`, `fetchBundle(key, fetchFn?, timeoutMs?)`, `fetchReport(fetchFn?, timeoutMs?)`, `fetchSnapshot(keys, fetchFn?)`
- Produces (`report.ts`): `type ReportBlock = { kind: 'p' | 'li'; runs: { text: string; bold: boolean }[] }`, `parseReportHtml(html: string): ReportBlock[]`
- Produces (`series.ts`): `dayOfYear(date: string): number` (1-based, UTC), `yearOfSeries(s: Series): number | null`, `stackByName(series: Series[], order: string[]): { date: string; values: Record<string, number> }[]`

- [ ] **Step 1: Capture real fixtures**

```bash
mkdir -p tests/fixtures/eurocontrol && cd tests/fixtures/eurocontrol
B=https://api-data-app.eurocontrol.int/api
curl -sg "$B/syncs?airport.id=1&order[syncDate]=desc&itemsPerPage=1" > sync-ebbr.json
curl -sg "$B/syncs?airport.id=999999&itemsPerPage=1" > sync-empty.json
NET=$(curl -sg "$B/syncs?dataType=network-wide&order[syncDate]=desc&itemsPerPage=1" | tee sync-network.json | node -e 'process.stdin.on("data",d=>console.log(JSON.parse(d).data[0].id))')
curl -sg "$B/traffic_charts?sync.id=$NET&itemsPerPage=100" > traffic_charts-network.json
curl -sg "$B/delay_charts?sync.id=$NET&itemsPerPage=100" > delay_charts-network.json
curl -sg "$B/traffic_networks?traffic.sync.id=$NET&itemsPerPage=50" > traffic_networks-network.json
curl -sg "$B/delay_networks?delay.sync.id=$NET&itemsPerPage=50" > delay_networks-network.json
curl -sg "$B/situation_reports?order[date]=desc&itemsPerPage=1" > situation_reports.json
for id in 29 13 11 39 16 38; do echo -n "ansp $id: "; curl -sg "$B/syncs?airNavigationServiceProvider.id=$id&order[syncDate]=desc&itemsPerPage=1" | node -e 'process.stdin.on("data",d=>{const j=JSON.parse(d);console.log(j.meta.totalItems, j.data[0]?.syncDate)})'; done
cd -
```
Expected: JSON files non-empty; each ANSP line prints a count > 0 and a recent date. If any ANSP has 0 syncs, remove it from `ENTITIES` and note it in the commit message.

- [ ] **Step 2: Write failing tests**

`tests/unit/eurocontrol.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import syncEbbr from '../fixtures/eurocontrol/sync-ebbr.json';
import syncEmpty from '../fixtures/eurocontrol/sync-empty.json';
import trafficCharts from '../fixtures/eurocontrol/traffic_charts-network.json';
import delayCharts from '../fixtures/eurocontrol/delay_charts-network.json';
import trafficNet from '../fixtures/eurocontrol/traffic_networks-network.json';
import delayNet from '../fixtures/eurocontrol/delay_networks-network.json';
import {
  apiUrl, parseSync, parseCharts, parseHeadline, findSeries, fetchBundle, ENTITIES
} from '$lib/data/eurocontrol';

describe('apiUrl', () => {
  it('encodes bracket params', () => {
    expect(apiUrl('syncs', { 'order[syncDate]': 'desc', 'airport.id': 1 })).toBe(
      'https://api-data-app.eurocontrol.int/api/syncs?order%5BsyncDate%5D=desc&airport.id=1'
    );
  });
});

describe('parseSync', () => {
  it('returns id and date', () => {
    const s = parseSync(syncEbbr);
    expect(s.id).toBeTypeOf('number');
    expect(s.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('throws on empty result', () => {
    expect(() => parseSync(syncEmpty)).toThrow(/no sync/i);
  });
  it('throws on malformed payload', () => {
    expect(() => parseSync({ nope: true })).toThrow();
  });
});

describe('parseCharts', () => {
  it('normalises traffic series', () => {
    const s = parseCharts(trafficCharts);
    const names = s.filter((x) => x.chartType === 'daily_evolution').map((x) => x.name);
    expect(names).toContain('2019');
    for (const x of s) for (const p of x.points) {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(p.value)).toBe(true);
    }
  });
  it('keeps delay cause categories', () => {
    const s = parseCharts(delayCharts);
    const y2d = s.filter((x) => x.chartType === 'category_evolution' && x.dateRange === 'Y2D').map((x) => x.name);
    expect(y2d).toEqual(expect.arrayContaining(['Aerodrome capacity', 'Capacity/Staffing (ATC)', 'Disruptions (ATC)', 'Weather', 'Other']));
  });
  it('drops non-finite values', () => {
    const s = parseCharts({ data: [{ chartType: 'x', name: 'n', data: [{ date: '2026-01-01T00:00:00+00:00', value: null }, { date: '2026-01-02T00:00:00+00:00', value: 3 }] }] });
    expect(s[0].points).toEqual([{ date: '2026-01-02', value: 3 }]);
  });
});

describe('parseHeadline', () => {
  it('reads yesterday flights and delay', () => {
    const h = parseHeadline(trafficNet, delayNet);
    expect(h.flights).toBeGreaterThan(10000);
    expect(h.delayMinutes).not.toBeNull();
  });
  it('returns nulls when rows are missing', () => {
    expect(parseHeadline({ data: [] }, { data: [] })).toEqual({ flights: null, delayMinutes: null, delayPerFlight: null });
  });
});

describe('findSeries', () => {
  it('matches by chartType, dateRange and name regex', () => {
    const s = parseCharts(delayCharts);
    expect(findSeries(s, { chartType: 'category_evolution', dateRange: 'Y2D', name: /^Weather$/ })?.points.length).toBeGreaterThan(30);
  });
});

describe('fetchBundle', () => {
  it('assembles a bundle with an injected fetch', async () => {
    const f = (async (url: string) => {
      const u = new URL(url);
      const map: Record<string, unknown> = {
        '/api/syncs': { data: [{ id: 7, syncDate: '2026-10-08T00:00:00+00:00' }] },
        '/api/traffic_charts': trafficCharts,
        '/api/delay_charts': delayCharts,
        '/api/punctualities_charts': { data: [] },
        '/api/co2_charts': { data: [] },
        '/api/traffic_networks': trafficNet,
        '/api/delay_networks': delayNet
      };
      return new Response(JSON.stringify(map[u.pathname] ?? {}), { status: 200 });
    }) as typeof fetch;
    const b = await fetchBundle('network', f);
    expect(b).toMatchObject({ key: 'network', label: ENTITIES.network.label, syncId: 7, dataDate: '2026-10-08' });
    expect(b.traffic.length).toBeGreaterThan(0);
    expect(b.headline.flights).toBeGreaterThan(0);
  });
  it('rejects on HTTP errors', async () => {
    const f = (async () => new Response('x', { status: 503 })) as typeof fetch;
    await expect(fetchBundle('EBBR', f)).rejects.toThrow(/503/);
  });
});
```

`tests/unit/report.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import reports from '../fixtures/eurocontrol/situation_reports.json';
import { parseReportHtml } from '$lib/data/report';

describe('parseReportHtml', () => {
  it('turns the real report into p/li blocks with bold runs', () => {
    const blocks = parseReportHtml((reports as any).data[0].content);
    expect(blocks[0]).toEqual({ kind: 'p', runs: [{ text: 'Traffic', bold: true }] });
    expect(blocks.some((b) => b.kind === 'li')).toBe(true);
    for (const b of blocks) for (const r of b.runs) expect(r.text).not.toMatch(/[<>]/);
  });
  it('drops script/style content and decodes entities', () => {
    const blocks = parseReportHtml('<p>A&amp;B&nbsp;&#39;x&#39;<script>alert(1)</script><style>p{}</style> <b>C</b></p><img src=x onerror=alert(1)>');
    expect(blocks).toEqual([{ kind: 'p', runs: [{ text: "A&B 'x' ", bold: false }, { text: 'C', bold: true }] }]);
  });
  it('wraps loose text in a paragraph and ignores empty blocks', () => {
    expect(parseReportHtml('hello <p> </p>')).toEqual([{ kind: 'p', runs: [{ text: 'hello', bold: false }] }]);
  });
});
```

`tests/unit/series.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { dayOfYear, yearOfSeries, stackByName } from '$lib/data/series';

describe('series helpers', () => {
  it('dayOfYear is 1-based UTC', () => {
    expect(dayOfYear('2026-01-01')).toBe(1);
    expect(dayOfYear('2026-12-31')).toBe(365);
    expect(dayOfYear('2024-12-31')).toBe(366);
  });
  it('yearOfSeries reads a year from the name', () => {
    expect(yearOfSeries({ name: '2019', chartType: '', dateRange: null, share: null, points: [] })).toBe(2019);
    expect(yearOfSeries({ name: "% of delayed flights >15' 2025", chartType: '', dateRange: null, share: null, points: [] })).toBe(2025);
    expect(yearOfSeries({ name: 'Weather', chartType: '', dateRange: null, share: null, points: [] })).toBeNull();
  });
  it('stackByName aligns dates and fills gaps with 0', () => {
    const mk = (name: string, pts: [string, number][]) => ({ name, chartType: 'c', dateRange: 'Y2D', share: null, points: pts.map(([date, value]) => ({ date, value })) });
    const rows = stackByName([mk('A', [['2026-01-01', 1], ['2026-01-02', 2]]), mk('B', [['2026-01-02', 5]])], ['A', 'B']);
    expect(rows).toEqual([
      { date: '2026-01-01', values: { A: 1, B: 0 } },
      { date: '2026-01-02', values: { A: 2, B: 5 } }
    ]);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/unit/eurocontrol.test.ts tests/unit/report.test.ts tests/unit/series.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement**

`src/lib/data/report.ts`
```ts
export interface ReportBlock { kind: 'p' | 'li'; runs: { text: string; bold: boolean }[] }

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const cp = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

export function parseReportHtml(html: string): ReportBlock[] {
  const clean = html.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '');
  const blocks: ReportBlock[] = [];
  let cur: ReportBlock | null = null;
  let bold = 0;
  const close = () => {
    if (cur) {
      cur.runs = cur.runs.map((r) => ({ ...r, text: r.text.replace(/\s+/g, ' ') }));
      if (cur.runs.length) cur.runs[0].text = cur.runs[0].text.trimStart();
      if (cur.runs.length) cur.runs[cur.runs.length - 1].text = cur.runs[cur.runs.length - 1].text.trimEnd();
      cur.runs = cur.runs.filter((r) => r.text.length > 0);
      if (cur.runs.length) blocks.push(cur);
    }
    cur = null;
  };
  for (const m of clean.matchAll(/<(\/?)([a-z0-9]+)\b[^>]*>|([^<]+)/gi)) {
    if (m[3] !== undefined) {
      const text = decodeEntities(m[3]);
      if (!cur) { if (!text.trim()) continue; cur = { kind: 'p', runs: [] }; }
      const prev = cur.runs.at(-1);
      if (prev && prev.bold === bold > 0) prev.text += text;
      else cur.runs.push({ text, bold: bold > 0 });
      continue;
    }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (tag === 'p' || tag === 'li') { close(); if (!closing) cur = { kind: tag, runs: [] }; }
    else if (tag === 'strong' || tag === 'b') bold = Math.max(0, bold + (closing ? -1 : 1));
    else if (tag === 'br' && cur) cur.runs.push({ text: ' ', bold: bold > 0 });
  }
  close();
  return blocks;
}
```

`src/lib/data/series.ts`
```ts
import type { Series } from './eurocontrol';

export function dayOfYear(date: string): number {
  const d = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
  return Math.round((d - Date.UTC(+date.slice(0, 4), 0, 1)) / 86_400_000) + 1;
}

export function yearOfSeries(s: Series): number | null {
  const m = s.name.match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

export function stackByName(series: Series[], order: string[]) {
  const byDate = new Map<string, Record<string, number>>();
  for (const s of series) {
    if (!order.includes(s.name)) continue;
    for (const p of s.points) {
      const row = byDate.get(p.date) ?? Object.fromEntries(order.map((n) => [n, 0]));
      row[s.name] = p.value;
      byDate.set(p.date, row);
    }
  }
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, values }));
}
```

`src/lib/data/eurocontrol.ts`
```ts
import { parseReportHtml, type ReportBlock } from './report';

export const API_BASE = 'https://api-data-app.eurocontrol.int/api';

type Kind = 'network' | 'airport' | 'ansp';
export const ENTITIES = {
  network: { label: 'European network', kind: 'network' as Kind, id: 0 },
  EBBR: { label: 'Brussels (EBBR)', kind: 'airport' as Kind, id: 1 },
  LIRF: { label: 'Rome Fiumicino (LIRF)', kind: 'airport' as Kind, id: 31 },
  skeyes: { label: 'skeyes (Belgium)', kind: 'ansp' as Kind, id: 38 },
  MUAC: { label: 'MUAC (Maastricht UAC)', kind: 'ansp' as Kind, id: 29 },
  DSNA: { label: 'DSNA (France)', kind: 'ansp' as Kind, id: 13 },
  DFS: { label: 'DFS (Germany)', kind: 'ansp' as Kind, id: 11 },
  Skyguide: { label: 'skyguide (Switzerland)', kind: 'ansp' as Kind, id: 39 },
  ENAV: { label: 'ENAV (Italy)', kind: 'ansp' as Kind, id: 16 }
} as const;
export type EntityKey = keyof typeof ENTITIES;
export const ENTITY_KEYS = Object.keys(ENTITIES) as EntityKey[];

export interface SeriesPoint { date: string; value: number }
export interface Series { name: string; chartType: string; dateRange: string | null; share: number | null; points: SeriesPoint[] }
export interface Headline { flights: number | null; delayMinutes: number | null; delayPerFlight: number | null }
export interface EntityBundle {
  key: EntityKey; label: string; syncId: number; dataDate: string;
  traffic: Series[]; delay: Series[]; punctuality: Series[]; co2: Series[]; headline: Headline;
}
export type { ReportBlock };
export interface SituationReport { date: string; title: string; blocks: ReportBlock[] }
export interface EurocontrolSnapshot {
  generatedAt: string;
  bundles: Partial<Record<EntityKey, EntityBundle>>;
  report: SituationReport | null;
}

type Fetch = typeof fetch;
type Json = any; // API payloads are validated by the parsers below

export function apiUrl(path: string, params: Record<string, string | number> = {}): string {
  const u = new URL(`${API_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  return u.toString();
}

async function getJson(url: string, f: Fetch, timeoutMs: number): Promise<Json> {
  const r = await f(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

const day = (iso: string) => String(iso).slice(0, 10);
const round = (v: number) => Math.round(v * 1e4) / 1e4;

function list(json: Json): Json[] {
  if (!json || !Array.isArray(json.data)) throw new Error('Unexpected API payload: missing data[]');
  return json.data;
}

export function parseSync(json: Json): { id: number; date: string } {
  const [first] = list(json);
  if (!first) throw new Error('No sync found for entity');
  if (typeof first.id !== 'number' || typeof first.syncDate !== 'string') throw new Error('Malformed sync');
  return { id: first.id, date: day(first.syncDate) };
}

export function parseCharts(json: Json): Series[] {
  return list(json).map((c: Json) => ({
    name: String(c.name ?? ''),
    chartType: String(c.chartType ?? ''),
    dateRange: c.dateRange ?? null,
    share: typeof c.share === 'number' ? c.share : null,
    points: (Array.isArray(c.data) ? c.data : [])
      .filter((p: Json) => typeof p?.value === 'number' && Number.isFinite(p.value) && typeof p.date === 'string')
      .map((p: Json) => ({ date: day(p.date), value: round(p.value) }))
  }));
}

function pick(rows: Json[], rel: 'traffic' | 'delay', networkType: string): number | null {
  const r = rows.find((x) => x?.[rel]?.rankingCategory === 'network' && x.networkType === networkType && x.dateRange === 'DY');
  const v = r?.value;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function parseHeadline(trafficNetworks: Json, delayNetworks: Json): Headline {
  const t = list(trafficNetworks), d = list(delayNetworks);
  return { flights: pick(t, 'traffic', 'total'), delayMinutes: pick(d, 'delay', 'total'), delayPerFlight: pick(d, 'delay', 'avg') };
}

export function findSeries(series: Series[], q: { chartType?: string; dateRange?: string | null; name?: string | RegExp }) {
  return series.find(
    (s) =>
      (q.chartType === undefined || s.chartType === q.chartType) &&
      (q.dateRange === undefined || s.dateRange === q.dateRange) &&
      (q.name === undefined || (typeof q.name === 'string' ? s.name === q.name : q.name.test(s.name)))
  );
}

function syncParams(key: EntityKey): Record<string, string | number> {
  const e = ENTITIES[key];
  const base = { 'order[syncDate]': 'desc', itemsPerPage: 1 };
  if (e.kind === 'network') return { ...base, dataType: 'network-wide' };
  if (e.kind === 'airport') return { ...base, 'airport.id': e.id };
  return { ...base, 'airNavigationServiceProvider.id': e.id };
}

export async function fetchBundle(key: EntityKey, f: Fetch = fetch, timeoutMs = 15_000): Promise<EntityBundle> {
  const sync = parseSync(await getJson(apiUrl('syncs', syncParams(key)), f, timeoutMs));
  const charts = (p: string) => getJson(apiUrl(p, { 'sync.id': sync.id, itemsPerPage: 100 }), f, timeoutMs).then(parseCharts);
  const [traffic, delay, punctuality, co2, tn, dn] = await Promise.all([
    charts('traffic_charts'),
    charts('delay_charts'),
    charts('punctualities_charts'),
    charts('co2_charts'),
    getJson(apiUrl('traffic_networks', { 'traffic.sync.id': sync.id, itemsPerPage: 50 }), f, timeoutMs),
    getJson(apiUrl('delay_networks', { 'delay.sync.id': sync.id, itemsPerPage: 50 }), f, timeoutMs)
  ]);
  return { key, label: ENTITIES[key].label, syncId: sync.id, dataDate: sync.date, traffic, delay, punctuality, co2, headline: parseHeadline(tn, dn) };
}

export async function fetchReport(f: Fetch = fetch, timeoutMs = 15_000): Promise<SituationReport | null> {
  const [r] = list(await getJson(apiUrl('situation_reports', { 'order[date]': 'desc', itemsPerPage: 1, active: 'true' }), f, timeoutMs));
  if (!r) return null;
  return { date: day(r.date), title: String(r.title ?? ''), blocks: parseReportHtml(String(r.content ?? '')) };
}

export async function fetchSnapshot(keys: EntityKey[] = ENTITY_KEYS, f: Fetch = fetch): Promise<EurocontrolSnapshot> {
  const results = await Promise.allSettled(keys.map((k) => fetchBundle(k, f)));
  const bundles: EurocontrolSnapshot['bundles'] = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') bundles[keys[i]] = r.value;
    else console.warn(`[eurocontrol] ${keys[i]} failed: ${r.reason}`);
  });
  const report = await fetchReport(f).catch((e) => (console.warn(`[eurocontrol] report failed: ${e}`), null));
  return { generatedAt: new Date().toISOString(), bundles, report };
}
```

`scripts/fetch-eurocontrol.ts`
```ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { fetchSnapshot, ENTITY_KEYS } from '../src/lib/data/eurocontrol.ts';

const snap = await fetchSnapshot(ENTITY_KEYS);
const ok = Object.keys(snap.bundles);
if (!snap.bundles.network) {
  console.error('network bundle missing — keeping previous snapshot');
  process.exit(1);
}
mkdirSync('static/data', { recursive: true });
const body = JSON.stringify(snap);
writeFileSync('static/data/eurocontrol.json', body);
console.log(`wrote static/data/eurocontrol.json (${(body.length / 1024).toFixed(0)} KiB) bundles=${ok.join(',')} report=${snap.report?.date ?? 'none'}`);
```

- [ ] **Step 5: Run tests and the script**

Run: `npx vitest run tests/unit/eurocontrol.test.ts tests/unit/report.test.ts tests/unit/series.test.ts`
Expected: PASS.

Run: `npm run fetch:eurocontrol`
Expected: `wrote static/data/eurocontrol.json (… KiB) bundles=network,EBBR,LIRF,skeyes,MUAC,DSNA,DFS,Skyguide,ENAV report=2026-…`. If the file exceeds 1500 KiB, drop `co2` for non-network bundles in `fetchSnapshot` (keep a test-free comment explaining why) and re-run.

- [ ] **Step 6: Commit**

```bash
git add src/lib/data tests/unit/eurocontrol.test.ts tests/unit/report.test.ts tests/unit/series.test.ts tests/fixtures scripts/fetch-eurocontrol.ts static/data/eurocontrol.json
git commit -m "feat: EUROCONTROL Data app client, safe report parser and snapshot script"
```

---

### Task 4: Sky snapshot (OpenSky with adsb.lol fallback)

**Files:**
- Create: `src/lib/data/sky.ts`, `scripts/fetch-sky.ts`, `static/data/sky.json` (generated)
- Test: `tests/unit/sky.test.ts`

**Interfaces:**
- Produces:
  - `EUROPE_BBOX = { lamin: 34, lomin: -12, lamax: 62, lomax: 36 }`
  - `type Aircraft = { id: string; cs: string; lon: number; lat: number; alt: number; trk: number; gs: number }` (alt ft, gs kt)
  - `type SkySnapshot = { fetchedAt: string; source: 'opensky' | 'adsb.lol' | 'none'; count: number; aircraft: Aircraft[] }`
  - `parseOpenSky(json): Aircraft[]`, `parseAdsbLol(json): Aircraft[]`, `makeSnapshot(source, aircraft, fetchedAt): SkySnapshot`, `adsbLolTiles(bbox): { lat: number; lon: number }[]`, `minutesAgo(iso: string, now?: number): number`, `ageLabel(iso: string, now?: number): string`

- [ ] **Step 1: Write failing tests**

`tests/unit/sky.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { parseOpenSky, parseAdsbLol, makeSnapshot, adsbLolTiles, minutesAgo, ageLabel, EUROPE_BBOX } from '$lib/data/sky';

const os = {
  time: 1791559444,
  states: [
    ['39de4f', 'TVF56MG ', 'France', 1, 1, 6.8016, 56.0225, 11887.2, false, 240.65, 22.23, 0, null, 11940.54, '2556', false, 0],
    ['aaaaaa', 'GND1    ', 'France', 1, 1, 4.48, 50.9, 30, true, 5, 90, 0, null, 30, null, false, 0],
    ['bbbbbb', null, 'Italy', 1, 1, null, null, 9000, false, 200, 10, 0, null, 9000, null, false, 0],
    ['cccccc', 'NOALT', 'Italy', 1, 1, 12, 42, null, false, 200, 10, 0, null, null, null, false, 0]
  ]
};

describe('parseOpenSky', () => {
  it('keeps airborne positioned aircraft and converts units', () => {
    expect(parseOpenSky(os)).toEqual([{ id: '39de4f', cs: 'TVF56MG', lon: 6.8016, lat: 56.0225, alt: 39000, trk: 22, gs: 468 }]);
  });
  it('tolerates null states', () => {
    expect(parseOpenSky({ time: 1, states: null })).toEqual([]);
  });
});

describe('parseAdsbLol', () => {
  it('skips ground and unpositioned aircraft', () => {
    const j = { ac: [
      { hex: '4ca802', flight: 'RYR42MV ', lat: 50.1, lon: 4.2, alt_baro: 35000, track: 182.4, gs: 419.8 },
      { hex: 'x1', flight: 'G', lat: 50, lon: 4, alt_baro: 'ground', track: 0, gs: 0 },
      { hex: 'x2', alt_baro: 10000 }
    ] };
    expect(parseAdsbLol(j)).toEqual([{ id: '4ca802', cs: 'RYR42MV', lon: 4.2, lat: 50.1, alt: 35000, trk: 182, gs: 420 }]);
  });
});

describe('makeSnapshot', () => {
  it('dedupes by id, filters to Europe and rounds', () => {
    const a = { id: 'a', cs: 'A', lon: 4.123456, lat: 50.987654, alt: 35049, trk: 10, gs: 400 };
    const out = makeSnapshot('opensky', [a, { ...a }, { ...a, id: 'far', lon: -80 }], '2026-10-09T15:00:00Z');
    expect(out).toEqual({ fetchedAt: '2026-10-09T15:00:00Z', source: 'opensky', count: 1, aircraft: [{ ...a, lon: 4.123, lat: 50.988, alt: 35000 }] });
  });
});

describe('tiles and age', () => {
  it('covers the bbox with tile centres inside it', () => {
    const t = adsbLolTiles(EUROPE_BBOX);
    expect(t.length).toBeGreaterThanOrEqual(20);
    for (const p of t) {
      expect(p.lat).toBeGreaterThanOrEqual(EUROPE_BBOX.lamin);
      expect(p.lon).toBeLessThanOrEqual(EUROPE_BBOX.lomax);
    }
  });
  it('formats age honestly', () => {
    const now = Date.parse('2026-10-09T15:00:00Z');
    expect(minutesAgo('2026-10-09T14:47:00Z', now)).toBe(13);
    expect(ageLabel('2026-10-09T14:47:00Z', now)).toBe('13 min ago');
    expect(ageLabel('2026-10-09T11:30:00Z', now)).toBe('3 h 30 min ago');
    expect(ageLabel('2026-10-07T15:00:00Z', now)).toBe('2 days ago');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/sky.test.ts` → Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/lib/data/sky.ts`
```ts
export const EUROPE_BBOX = { lamin: 34, lomin: -12, lamax: 62, lomax: 36 };
export type Bbox = typeof EUROPE_BBOX;

export interface Aircraft { id: string; cs: string; lon: number; lat: number; alt: number; trk: number; gs: number }
export interface SkySnapshot { fetchedAt: string; source: 'opensky' | 'adsb.lol' | 'none'; count: number; aircraft: Aircraft[] }

const M_TO_FT = 3.28084;
const MS_TO_KT = 1.943844;
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function parseOpenSky(json: any): Aircraft[] {
  const states: any[] = Array.isArray(json?.states) ? json.states : [];
  const out: Aircraft[] = [];
  for (const s of states) {
    const [id, cs, , , , lon, lat, baro, onGround, vel, trk, , , geo] = s;
    const altM = num(baro) ? baro : num(geo) ? geo : null;
    if (onGround || !num(lon) || !num(lat) || altM === null) continue;
    out.push({ id: String(id), cs: String(cs ?? '').trim(), lon, lat, alt: Math.round((altM * M_TO_FT) / 100) * 100, trk: Math.round(num(trk) ? trk : 0), gs: Math.round(num(vel) ? vel * MS_TO_KT : 0) });
  }
  return out;
}

export function parseAdsbLol(json: any): Aircraft[] {
  const ac: any[] = Array.isArray(json?.ac) ? json.ac : [];
  return ac
    .filter((a) => num(a.lat) && num(a.lon) && num(a.alt_baro))
    .map((a) => ({ id: String(a.hex), cs: String(a.flight ?? '').trim(), lon: a.lon, lat: a.lat, alt: Math.round(a.alt_baro / 100) * 100, trk: Math.round(num(a.track) ? a.track : 0), gs: Math.round(num(a.gs) ? a.gs : 0) }));
}

const inBbox = (a: Aircraft, b: Bbox) => a.lat >= b.lamin && a.lat <= b.lamax && a.lon >= b.lomin && a.lon <= b.lomax;

export function makeSnapshot(source: SkySnapshot['source'], aircraft: Aircraft[], fetchedAt: string, bbox: Bbox = EUROPE_BBOX): SkySnapshot {
  const seen = new Set<string>();
  const out: Aircraft[] = [];
  for (const a of aircraft) {
    if (seen.has(a.id) || !inBbox(a, bbox)) continue;
    seen.add(a.id);
    out.push({ ...a, lon: Math.round(a.lon * 1000) / 1000, lat: Math.round(a.lat * 1000) / 1000, alt: Math.round(a.alt / 100) * 100 });
  }
  return { fetchedAt, source, count: out.length, aircraft: out };
}

/** Tile centres for adsb.lol /v2/point/{lat}/{lon}/250 (250 NM ≈ 4.2° lat). */
export function adsbLolTiles(b: Bbox, stepLat = 6, stepLon = 8): { lat: number; lon: number }[] {
  const t: { lat: number; lon: number }[] = [];
  for (let lat = b.lamin + stepLat / 2; lat < b.lamax; lat += stepLat)
    for (let lon = b.lomin + stepLon / 2; lon < b.lomax; lon += stepLon) t.push({ lat, lon });
  return t;
}

export const minutesAgo = (iso: string, now = Date.now()) => Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));

export function ageLabel(iso: string, now = Date.now()): string {
  const m = minutesAgo(iso, now);
  if (m < 60) return `${m} min ago`;
  if (m < 48 * 60) return `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''} ago`;
  return `${Math.floor(m / 1440)} days ago`;
}
```

`scripts/fetch-sky.ts`
```ts
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { EUROPE_BBOX, parseOpenSky, parseAdsbLol, makeSnapshot, adsbLolTiles, type Aircraft } from '../src/lib/data/sky.ts';

const OUT = 'static/data/sky.json';
const UA = { 'user-agent': 'a-full-flight-story (https://github.com/quinten-goens/a-full-flight-story)' };

async function openskyToken(): Promise<string | null> {
  const id = process.env.OPENSKY_CLIENT_ID, secret = process.env.OPENSKY_CLIENT_SECRET;
  if (!id || !secret) return null;
  const r = await fetch('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret })
  });
  if (!r.ok) throw new Error(`OpenSky token HTTP ${r.status}`);
  return (await r.json()).access_token;
}

async function fromOpenSky(): Promise<Aircraft[]> {
  const token = await openskyToken();
  const q = new URLSearchParams(Object.entries(EUROPE_BBOX).map(([k, v]) => [k, String(v)]));
  const r = await fetch(`https://opensky-network.org/api/states/all?${q}`, {
    headers: { ...UA, ...(token ? { authorization: `Bearer ${token}` } : {}) },
    signal: AbortSignal.timeout(30_000)
  });
  if (!r.ok) throw new Error(`OpenSky HTTP ${r.status}`);
  return parseOpenSky(await r.json());
}

async function fromAdsbLol(): Promise<Aircraft[]> {
  const all: Aircraft[] = [];
  for (const t of adsbLolTiles(EUROPE_BBOX)) {
    const r = await fetch(`https://api.adsb.lol/v2/point/${t.lat}/${t.lon}/250`, { headers: UA, signal: AbortSignal.timeout(20_000) });
    if (r.ok) all.push(...parseAdsbLol(await r.json()));
    await new Promise((res) => setTimeout(res, 800));
  }
  return all;
}

const now = new Date().toISOString();
let snap = null;
try {
  const a = await fromOpenSky();
  if (a.length < 100) throw new Error(`only ${a.length} aircraft`);
  snap = makeSnapshot('opensky', a, now);
} catch (e) {
  console.warn(`[sky] OpenSky failed: ${e}; trying adsb.lol`);
  try {
    const a = await fromAdsbLol();
    if (a.length >= 100) snap = makeSnapshot('adsb.lol', a, now);
    else console.warn(`[sky] adsb.lol returned ${a.length} aircraft`);
  } catch (e2) {
    console.warn(`[sky] adsb.lol failed: ${e2}`);
  }
}
mkdirSync('static/data', { recursive: true });
if (snap) {
  writeFileSync(OUT, JSON.stringify(snap));
  console.log(`[sky] wrote ${snap.count} aircraft from ${snap.source}`);
} else if (existsSync(OUT)) {
  console.warn('[sky] keeping previous sky.json');
} else {
  writeFileSync(OUT, JSON.stringify(makeSnapshot('none', [], now)));
  console.warn('[sky] wrote empty sky.json');
}
```

- [ ] **Step 4: Run tests and script**

Run: `npx vitest run tests/unit/sky.test.ts` → Expected: PASS.
Run: `npm run fetch:sky` → Expected: `[sky] wrote N aircraft from opensky` with N in the thousands (daytime).

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/sky.ts scripts/fetch-sky.ts tests/unit/sky.test.ts static/data/sky.json
git commit -m "feat: airborne-traffic snapshot from OpenSky with adsb.lol fallback"
```

---

### Task 5: Snapshot-then-live loader and shared state

**Files:**
- Create: `src/lib/data/live.ts`, `src/lib/data/liveState.svelte.ts`
- Test: `tests/unit/live.test.ts`

**Interfaces:**
- Consumes: `fetchBundle`, `fetchReport`, `EurocontrolSnapshot`, `EntityKey` (Task 3); `SkySnapshot` (Task 4).
- Produces:
  - `type Freshness = 'live' | 'snapshot'`
  - `type EcState = { snapshot: EurocontrolSnapshot | null; freshness: Partial<Record<EntityKey, Freshness>>; reportFreshness: Freshness | null; status: 'loading' | 'ready' | 'error' }`
  - `loadEurocontrol(opts: { snapshotUrl: string; keys: EntityKey[]; fetchFn?: typeof fetch; liveTimeoutMs?: number; onUpdate: (s: EcState) => void }): Promise<EcState>`
  - `liveState.svelte.ts`: `ec: EcState` ($state), `sky: { snap: SkySnapshot | null; status: 'loading' | 'ready' | 'error' }` ($state), `startLoading(): void`, `bundle(key: EntityKey): EntityBundle | undefined`

- [ ] **Step 1: Write failing tests**

`tests/unit/live.test.ts`
```ts
import { describe, it, expect, vi } from 'vitest';
import { loadEurocontrol, type EcState } from '$lib/data/live';
import type { EurocontrolSnapshot, EntityBundle } from '$lib/data/eurocontrol';

const bundle = (key: 'network' | 'EBBR', dataDate: string, flights: number): EntityBundle => ({
  key, label: key, syncId: 1, dataDate, traffic: [], delay: [], punctuality: [], co2: [],
  headline: { flights, delayMinutes: 0, delayPerFlight: 0 }
});
const snapshot: EurocontrolSnapshot = {
  generatedAt: '2026-10-09T00:00:00Z',
  bundles: { network: bundle('network', '2026-10-07', 100), EBBR: bundle('EBBR', '2026-10-07', 10) },
  report: { date: '2026-10-06', title: 'W40', blocks: [] }
};

function fakeFetch(opts: { snapshot?: unknown; liveDate?: string | null; liveFail?: boolean }) {
  return (async (url: string) => {
    if (url.endsWith('/data/eurocontrol.json')) {
      return opts.snapshot === undefined ? new Response('nf', { status: 404 }) : new Response(JSON.stringify(opts.snapshot));
    }
    if (opts.liveFail) throw new TypeError('Failed to fetch');
    const u = new URL(url);
    if (u.pathname === '/api/syncs') return new Response(JSON.stringify({ data: [{ id: 9, syncDate: `${opts.liveDate}T00:00:00+00:00` }] }));
    if (u.pathname === '/api/traffic_networks')
      return new Response(JSON.stringify({ data: [{ traffic: { rankingCategory: 'network' }, networkType: 'total', dateRange: 'DY', value: 999 }] }));
    if (u.pathname === '/api/situation_reports')
      return new Response(JSON.stringify({ data: [{ date: '2026-10-13T00:00:00+00:00', title: 'W41', content: '<p>x</p>' }] }));
    return new Response(JSON.stringify({ data: [] }));
  }) as typeof fetch;
}

const run = (f: typeof fetch) => {
  const updates: EcState[] = [];
  const p = loadEurocontrol({ snapshotUrl: '/data/eurocontrol.json', keys: ['network', 'EBBR'], fetchFn: f, onUpdate: (s) => updates.push(structuredClone(s)) });
  return { p, updates };
};

describe('loadEurocontrol', () => {
  it('emits the snapshot first, then upgrades to newer live data', async () => {
    const { p, updates } = run(fakeFetch({ snapshot, liveDate: '2026-10-08' }));
    const final = await p;
    expect(updates[0].status).toBe('ready');
    expect(updates[0].freshness).toEqual({ network: 'snapshot', EBBR: 'snapshot' });
    expect(final.freshness).toEqual({ network: 'live', EBBR: 'live' });
    expect(final.snapshot!.bundles.network!.headline.flights).toBe(999);
    expect(final.reportFreshness).toBe('live');
    expect(final.snapshot!.report!.title).toBe('W41');
  });

  it('keeps the snapshot when live fails, without throwing', async () => {
    const warn = vi.spyOn(console, 'error');
    const { p } = run(fakeFetch({ snapshot, liveFail: true }));
    const final = await p;
    expect(final.status).toBe('ready');
    expect(final.freshness).toEqual({ network: 'snapshot', EBBR: 'snapshot' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('ignores live data that is older than the snapshot', async () => {
    const { p } = run(fakeFetch({ snapshot, liveDate: '2026-10-01' }));
    const final = await p;
    expect(final.freshness.network).toBe('snapshot');
    expect(final.snapshot!.bundles.network!.headline.flights).toBe(100);
  });

  it('uses live data when the snapshot is missing', async () => {
    const { p } = run(fakeFetch({ liveDate: '2026-10-08' }));
    const final = await p;
    expect(final.status).toBe('ready');
    expect(final.freshness.network).toBe('live');
  });

  it('reports error when both are unavailable', async () => {
    const { p } = run(fakeFetch({ liveFail: true }));
    expect((await p).status).toBe('error');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/live.test.ts` → Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/lib/data/live.ts`
```ts
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
```

`src/lib/data/liveState.svelte.ts`
```ts
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
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/live.test.ts && npm run check`
Expected: PASS; svelte-check 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/live.ts src/lib/data/liveState.svelte.ts tests/unit/live.test.ts
git commit -m "feat: snapshot-first loader that upgrades to live EUROCONTROL data"
```

---
### Task 6: Geo — projection, countries and route math

**Files:**
- Create: `src/lib/geo/projection.ts`, `src/lib/geo/countries.ts`, `src/lib/geo/route.ts`
- Test: `tests/unit/route.test.ts`, `tests/unit/projection.test.ts`

**Interfaces:**
- Produces (`route.ts`):
  - `type LonLat = [number, number]`, `EARTH_KM = 6371.0088`
  - `distKm(a: LonLat, b: LonLat): number`, `cumulativeKm(route: LonLat[]): number[]`, `routeLengthKm(route): number`
  - `bearing(a: LonLat, b: LonLat): number` (degrees 0..360)
  - `pointAtKm(route, d: number): { lonlat: LonLat; bearing: number }` (clamped)
  - `type Span<T extends string = string> = { id: T; startKm: number; endKm: number }`
  - `sampleRoute(route, stepKm = 5): { d: number; p: LonLat }[]`
  - `mergeSamples<T extends string>(samples: { d: number; id: T | null }[], totalKm: number, minKm = 15): Span<T>[]` — nulls inherit the previous id (leading nulls take the first non-null), consecutive equal ids merge, spans shorter than `minKm` are absorbed into the previous span, spans are contiguous over `[0,totalKm]`.
  - `spansByRegion(route, regions: { id: string; feature: GeoJSON.Feature | GeoJSON.Geometry }[], stepKm = 5): Span[]`
- Produces (`projection.ts`): `EUROPE_FRAME`, `ROUTE_FRAME` (GeoJSON MultiPoint), `makeProjection(width: number, height: number, frame = EUROPE_FRAME, pad = 24): GeoProjection`
- Produces (`countries.ts`): `ISO = { BE: '056', LU: '442', NL: '528', FR: '250', DE: '276', CH: '756', IT: '380' }`, `type CountryFC = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, { name: string }>`, `loadCountries(): Promise<CountryFC>` (memoised), `regionsFor(fc: CountryFC, isos: string[]): { id: string; feature: GeoJSON.Feature }[]`

- [ ] **Step 1: Write failing tests**

`tests/unit/route.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { distKm, routeLengthKm, pointAtKm, bearing, mergeSamples, spansByRegion, type LonLat } from '$lib/geo/route';

const EBBR: LonLat = [4.484444, 50.901389];
const LIRF: LonLat = [12.238889, 41.800278];

describe('distances', () => {
  it('EBBR–LIRF great circle ≈ 1172 km (research §0)', () => {
    expect(distKm(EBBR, LIRF)).toBeGreaterThan(1165);
    expect(distKm(EBBR, LIRF)).toBeLessThan(1180);
  });
  it('route length sums segments', () => {
    const mid: LonLat = [8, 46];
    expect(routeLengthKm([EBBR, mid, LIRF])).toBeCloseTo(distKm(EBBR, mid) + distKm(mid, LIRF), 6);
  });
});

describe('pointAtKm', () => {
  const r: LonLat[] = [[0, 0], [2, 0], [2, 2]];
  const L = routeLengthKm(r);
  it('clamps to endpoints', () => {
    expect(pointAtKm(r, -5).lonlat[0]).toBeCloseTo(0, 6);
    expect(pointAtKm(r, -5).lonlat[1]).toBeCloseTo(0, 6);
    expect(pointAtKm(r, L + 5).lonlat[0]).toBeCloseTo(2, 6);
    expect(pointAtKm(r, L + 5).lonlat[1]).toBeCloseTo(2, 6);
  });
  it('interpolates within segments and reports heading', () => {
    const p = pointAtKm(r, distKm([0, 0], [1, 0]));
    expect(p.lonlat[0]).toBeCloseTo(1, 4);
    expect(p.bearing).toBeCloseTo(90, 0);
    const north = pointAtKm(r, L - 1).bearing;
    expect(Math.min(north, 360 - north)).toBeLessThan(0.5);
  });
  it('bearing south-east from Brussels to Rome', () => {
    const b = bearing(EBBR, LIRF);
    expect(b).toBeGreaterThan(120);
    expect(b).toBeLessThan(160);
  });
});

describe('mergeSamples', () => {
  it('fills gaps, merges runs and absorbs short flickers', () => {
    const s = [
      { d: 0, id: null }, { d: 10, id: 'A' }, { d: 20, id: null }, { d: 30, id: 'B' },
      { d: 40, id: 'C' }, { d: 45, id: 'B' }, { d: 60, id: 'B' }, { d: 90, id: 'D' }
    ] as { d: number; id: string | null }[];
    expect(mergeSamples(s, 100, 15)).toEqual([
      { id: 'A', startKm: 0, endKm: 30 },
      { id: 'B', startKm: 30, endKm: 90 },
      { id: 'D', startKm: 90, endKm: 100 }
    ]);
  });
});

describe('spansByRegion', () => {
  // d3-geo: exterior rings clockwise (north, east, south, west)
  const box = (x0: number, x1: number): GeoJSON.Polygon => ({ type: 'Polygon', coordinates: [[[x0, 0], [x0, 1], [x1, 1], [x1, 0], [x0, 0]]] });
  it('assigns contiguous spans and lets gaps inherit the previous region', () => {
    const route: LonLat[] = [[0.1, 0.5], [2.9, 0.5]];
    const spans = spansByRegion(route, [{ id: 'A', feature: box(0, 1) }, { id: 'B', feature: box(2, 3) }]);
    expect(spans.map((s) => s.id)).toEqual(['A', 'B']);
    expect(spans[0].startKm).toBe(0);
    expect(spans[0].endKm).toBe(spans[1].startKm);
    expect(spans[1].startKm).toBeGreaterThan(210); // lon 2.0 is reached at ≈211 km; samples every 5 km
    expect(spans[1].startKm).toBeLessThan(217);
    expect(spans[1].endKm).toBeCloseTo(routeLengthKm(route), 6);
  });
});
```

`tests/unit/projection.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { makeProjection, ROUTE_FRAME } from '$lib/geo/projection';
import { loadCountries, regionsFor, ISO } from '$lib/geo/countries';

describe('projection', () => {
  it('fits Europe and puts Rome south-east of Brussels', () => {
    const p = makeProjection(800, 600);
    const [bx, by] = p([4.48, 50.9])!;
    const [rx, ry] = p([12.24, 41.8])!;
    for (const v of [bx, rx]) { expect(v).toBeGreaterThan(0); expect(v).toBeLessThan(800); }
    for (const v of [by, ry]) { expect(v).toBeGreaterThan(0); expect(v).toBeLessThan(600); }
    expect(rx).toBeGreaterThan(bx);
    expect(ry).toBeGreaterThan(by);
  });
  it('route frame zooms in', () => {
    const eu = makeProjection(800, 600);
    const rt = makeProjection(800, 600, ROUTE_FRAME);
    expect(rt.scale()).toBeGreaterThan(eu.scale() * 2);
  });
});

describe('countries', () => {
  it('loads Natural Earth features for the route countries', async () => {
    const fc = await loadCountries();
    const regions = regionsFor(fc, Object.values(ISO));
    expect(regions.map((r) => r.id).sort()).toEqual(Object.values(ISO).sort());
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/unit/route.test.ts tests/unit/projection.test.ts` → FAIL (modules missing).

- [ ] **Step 3: Implement**

`src/lib/geo/route.ts`
```ts
import { geoDistance, geoInterpolate, geoContains } from 'd3-geo';

export type LonLat = [number, number];
export const EARTH_KM = 6371.0088;
export interface Span<T extends string = string> { id: T; startKm: number; endKm: number }

export const distKm = (a: LonLat, b: LonLat) => geoDistance(a, b) * EARTH_KM;

export function cumulativeKm(route: LonLat[]): number[] {
  const out = [0];
  for (let i = 1; i < route.length; i++) out.push(out[i - 1] + distKm(route[i - 1], route[i]));
  return out;
}
export const routeLengthKm = (route: LonLat[]) => cumulativeKm(route).at(-1)!;

const rad = Math.PI / 180;
export function bearing(a: LonLat, b: LonLat): number {
  const [l1, p1] = [a[0] * rad, a[1] * rad];
  const [l2, p2] = [b[0] * rad, b[1] * rad];
  const y = Math.sin(l2 - l1) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(l2 - l1);
  return (Math.atan2(y, x) / rad + 360) % 360;
}

export function pointAtKm(route: LonLat[], d: number): { lonlat: LonLat; bearing: number } {
  const cum = cumulativeKm(route);
  const total = cum.at(-1)!;
  const dd = Math.min(Math.max(d, 0), total);
  let i = 1;
  while (i < cum.length - 1 && cum[i] < dd) i++;
  const a = route[i - 1], b = route[i];
  const segLen = cum[i] - cum[i - 1] || 1;
  const f = (dd - cum[i - 1]) / segLen;
  const interp = geoInterpolate(a, b);
  const p = interp(f) as LonLat;
  const ahead = interp(Math.min(1, f + 1e-3)) as LonLat;
  const behind = interp(Math.max(0, f - 1e-3)) as LonLat;
  return { lonlat: p, bearing: bearing(f >= 1 ? behind : p, f >= 1 ? p : ahead) };
}

export function sampleRoute(route: LonLat[], stepKm = 5): { d: number; p: LonLat }[] {
  const total = routeLengthKm(route);
  const out: { d: number; p: LonLat }[] = [];
  for (let d = 0; d < total; d += stepKm) out.push({ d, p: pointAtKm(route, d).lonlat });
  return out;
}

export function mergeSamples<T extends string>(samples: { d: number; id: T | null }[], totalKm: number, minKm = 15): Span<T>[] {
  const firstId = samples.find((s) => s.id !== null)?.id ?? null;
  if (firstId === null) return [];
  let prev: T = firstId;
  const filled = samples.map((s) => ({ d: s.d, id: (prev = s.id ?? prev) }));
  const spans: Span<T>[] = [];
  for (const s of filled) {
    const last = spans.at(-1);
    if (last && last.id === s.id) continue;
    if (last) last.endKm = s.d;
    spans.push({ id: s.id, startKm: spans.length ? s.d : 0, endKm: totalKm });
  }
  // 1) collapse short flickers A-x-A into A
  for (let i = 1; i < spans.length - 1; ) {
    const s = spans[i];
    if (s.endKm - s.startKm < minKm && spans[i - 1].id === spans[i + 1].id) {
      spans[i - 1].endKm = spans[i + 1].endKm;
      spans.splice(i, 2);
      i = Math.max(1, i - 1);
    } else i++;
  }
  // 2) absorb remaining short interior spans into the previous one (first and last spans are kept)
  const out: Span<T>[] = [];
  spans.forEach((s, i) => {
    const last = out.at(-1);
    const shortInterior = i > 0 && i < spans.length - 1 && s.endKm - s.startKm < minKm;
    if (last && (last.id === s.id || shortInterior)) last.endKm = s.endKm;
    else out.push({ ...s });
  });
  return out;
}

export function spansByRegion(route: LonLat[], regions: { id: string; feature: GeoJSON.Feature | GeoJSON.Geometry }[], stepKm = 5): Span[] {
  const samples = sampleRoute(route, stepKm).map(({ d, p }) => ({
    d,
    id: regions.find((r) => geoContains(r.feature as GeoJSON.Feature, p))?.id ?? null
  }));
  return mergeSamples(samples, routeLengthKm(route));
}
```

Note: in the `mergeSamples` test, raw spans are A0–30, B30–40, C40–45, B45–90, D90–100. Step 1 collapses the B-C-B flicker into B30–90; step 2 keeps the short last span D (first/last spans are never absorbed).

`src/lib/geo/projection.ts`
```ts
import { geoConicConformal, type GeoProjection } from 'd3-geo';

export const EUROPE_FRAME: GeoJSON.MultiPoint = { type: 'MultiPoint', coordinates: [[-11, 35], [32, 35], [38, 61], [-14, 61]] };
export const ROUTE_FRAME: GeoJSON.MultiPoint = { type: 'MultiPoint', coordinates: [[2.5, 51.6], [13.8, 51.6], [13.8, 41.2], [2.5, 41.2]] };

export function makeProjection(width: number, height: number, frame: GeoJSON.GeoJsonObject = EUROPE_FRAME, pad = 24): GeoProjection {
  const w = Math.max(width, pad * 2 + 1), h = Math.max(height, pad * 2 + 1);
  return geoConicConformal().parallels([40, 58]).rotate([-10, 0]).fitExtent([[pad, pad], [w - pad, h - pad]], frame as any);
}
```

`src/lib/geo/countries.ts`
```ts
import type { Topology } from 'topojson-specification';

export const ISO = { BE: '056', LU: '442', NL: '528', FR: '250', DE: '276', CH: '756', IT: '380' } as const;
export type CountryFC = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, { name: string }>;

let cache: Promise<CountryFC> | null = null;
export function loadCountries(): Promise<CountryFC> {
  cache ??= Promise.all([import('topojson-client'), import('world-atlas/countries-50m.json')]).then(
    ([{ feature }, world]) => {
      const topo = ((world as any).default ?? world) as Topology;
      return feature(topo, topo.objects.countries) as unknown as CountryFC;
    }
  );
  return cache;
}

export function regionsFor(fc: CountryFC, isos: string[]) {
  return fc.features.filter((f) => isos.includes(String(f.id))).map((f) => ({ id: String(f.id), feature: f as GeoJSON.Feature }));
}
```
(`topojson-specification` types come with `@types/topojson-client`; if not, `npm i -D @types/topojson-specification`.)

- [ ] **Step 4: Run tests** — `npx vitest run tests/unit/route.test.ts tests/unit/projection.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/geo tests/unit/route.test.ts tests/unit/projection.test.ts package.json package-lock.json
git commit -m "feat: geo helpers for projection, countries and route spans"
```

---

### Task 7: Hero flight model (routes, ANSP spans, profile, timeline, FPL)

**Files:**
- Create: `src/lib/story/flight.ts`, `src/lib/story/fpl.ts`
- Test: `tests/unit/flight.test.ts`, `tests/unit/fpl.test.ts`

**Interfaces:**
- Consumes: `LonLat`, `Span`, `sampleRoute`, `mergeSamples`, `routeLengthKm` (Task 6); `ISO`, `loadCountries`, `regionsFor` (Task 6).
- Produces (`flight.ts`):
  - `HERO` constant (see code) with `ctotDelayMin: 27`, `rerouteCtotDelayMin: 7`
  - `AIRPORTS.EBBR`, `AIRPORTS.LIRF` `{ icao, name, lonlat: LonLat }`
  - `ROUTE_PLANNED: LonLat[]` (via France/Reims), `ROUTE_REROUTED: LonLat[]` (via Germany/Karlsruhe)
  - `type AnspKey = 'skeyes' | 'MUAC' | 'ANA' | 'DSNA' | 'DFS' | 'Skyguide' | 'ENAV'`, `ANSP_LABEL: Record<AnspKey, string>`
  - `anspFor(iso: string, altFt: number): AnspKey | null`
  - `altitudeAtKm(d: number, totalKm: number): number` (ft)
  - `countrySpans(route, fc): Promise<Span[]>`, `anspSpans(route, fc): Span<AnspKey>[]` — both computed from Natural Earth
  - `type Phase = 'strategic' | 'pretactical' | 'filing' | 'tactical' | 'ground' | 'departure' | 'enroute' | 'arrival' | 'postops'`
  - `type Actor = 'airline' | 'slot-coordinator' | 'network-manager' | 'ifps' | 'fmp' | 'ansp' | 'airport' | 'ground-handler' | 'pilots' | 'military' | 'crco' | 'prc' | 'passengers'`
  - `type FlightEvent = { id: string; at: string; phase: Phase; actor: Actor; label: string; msg?: string; sources: string[] }` (`at` ISO UTC)
  - `EVENTS: FlightEvent[]` (chronological), `event(id): FlightEvent`, `minutesOfDay(iso): number`
  - `type TurnTask = { id: string; label: string; actor: Actor; start: string; end: string }`, `TURNAROUND: TurnTask[]`
  - `ACDM: { eobt, tobt, tsat, ttot, ctotPlanned, ctotFinal, asat, aobt, atot, aldt, aibt, sta: string }` (HH:MM UTC)
- Produces (`fpl.ts`): `fplCoord(p: LonLat): string`, `type FplField = { item: string; label: string; value: string }`, `buildFpl(fields: FplField[][]): { text: string; spans: { item: string; label: string; start: number; end: number }[] }`, `heroFplFields(route: LonLat[]): FplField[][]`, `HERO_FPL`

- [ ] **Step 1: Write failing tests**

`tests/unit/fpl.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { fplCoord, buildFpl, HERO_FPL } from '$lib/story/fpl';

describe('fplCoord', () => {
  it('formats ICAO lat/long to the nearest minute', () => {
    expect(fplCoord([6.13, 49.61])).toBe('4937N00608E');
    expect(fplCoord([12.2389, 41.8003])).toBe('4148N01214E');
    expect(fplCoord([-0.999, 49.9999])).toBe('5000N00100W');
  });
});

describe('buildFpl', () => {
  it('wraps items in ICAO FPL syntax and records spans', () => {
    const f = buildFpl([[{ item: '7', label: 'id', value: 'FFS101' }, { item: '8', label: 'rules', value: 'IS' }], [{ item: '13', label: 'dep', value: 'EBBR0500' }]]);
    expect(f.text).toBe('(FPL-FFS101-IS\n-EBBR0500)');
    for (const s of f.spans) expect(f.text.slice(s.start, s.end)).toBe({ '7': 'FFS101', '8': 'IS', '13': 'EBBR0500' }[s.item]);
  });
  it('hero FPL contains every main item exactly once', () => {
    const items = HERO_FPL.spans.map((s) => s.item);
    expect(items).toEqual(['7', '8', '9', '10', '13', '15', '16', '18']);
    expect(HERO_FPL.text.startsWith('(FPL-FFS101-IS')).toBe(true);
    expect(HERO_FPL.text).toContain('DOF/260710');
    expect(HERO_FPL.text.endsWith(')')).toBe(true);
  });
});
```

`tests/unit/flight.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { HERO, EVENTS, ACDM, TURNAROUND, ROUTE_PLANNED, ROUTE_REROUTED, altitudeAtKm, anspFor, countrySpans, anspSpans, minutesOfDay } from '$lib/story/flight';
import { routeLengthKm } from '$lib/geo/route';
import { loadCountries, ISO } from '$lib/geo/countries';

// slot tolerance −5/+10 [S7]; the reusable helper arrives with CASA in Task 8
const withinSlotWindow = (atot: number, ctot: number) => atot >= ctot - 5 && atot <= ctot + 10;

const hm = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);

describe('timeline', () => {
  it('is chronological with unique ids and cited or illustrative', () => {
    const t = EVENTS.map((e) => Date.parse(e.at));
    expect([...t].sort((a, b) => a - b)).toEqual(t);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
    for (const e of EVENTS) expect(e.sources.length).toBeGreaterThan(0);
  });
  it('A-CDM times are consistent with the slot rules (research §4b, §5)', () => {
    expect(hm(ACDM.ctotPlanned) - (hm(ACDM.eobt) + HERO.taxiOutMin)).toBe(HERO.ctotDelayMin);
    expect(hm(ACDM.ctotFinal) - (hm(ACDM.eobt) + HERO.taxiOutMin)).toBe(HERO.rerouteCtotDelayMin);
    expect(withinSlotWindow(hm(ACDM.atot), hm(ACDM.ctotFinal))).toBe(true);
    expect(hm(ACDM.tsat)).toBeGreaterThanOrEqual(hm(ACDM.tobt));
    expect(hm(ACDM.ttot)).toBe(hm(ACDM.ctotFinal));
    expect(hm(ACDM.aibt)).toBeGreaterThan(hm(ACDM.aldt));
    expect(hm(ACDM.aibt) - hm(ACDM.sta)).toBeLessThanOrEqual(15); // on time by the 15-min definition
  });
  it('SAM is sent at EOBT−2h (research §4b)', () => {
    const sam = EVENTS.find((e) => e.msg === 'SAM')!;
    expect(minutesOfDay(sam.at)).toBe(hm(ACDM.eobt) - 120);
  });
  it('turnaround tasks finish before off-block', () => {
    for (const t of TURNAROUND) {
      expect(hm(t.end)).toBeGreaterThan(hm(t.start));
      expect(hm(t.end)).toBeLessThanOrEqual(hm(ACDM.aobt));
    }
  });
});

describe('routes', () => {
  it('planned route ≈ great circle; reroute is longer', () => {
    const p = routeLengthKm(ROUTE_PLANNED), r = routeLengthKm(ROUTE_REROUTED);
    expect(p).toBeGreaterThan(1172);
    expect(p).toBeLessThan(1260);
    expect(r).toBeGreaterThan(p);
  });
  it('profile climbs, cruises and descends', () => {
    const L = 1200;
    expect(altitudeAtKm(0, L)).toBe(0);
    expect(altitudeAtKm(L / 2, L)).toBe(HERO.cruiseFt);
    expect(altitudeAtKm(50, L)).toBeLessThan(HERO.cruiseFt);
    expect(altitudeAtKm(L, L)).toBe(0);
  });
  it('MUAC owns Benelux airspace above FL245 (research §6)', () => {
    expect(anspFor(ISO.BE, 30000)).toBe('MUAC');
    expect(anspFor(ISO.BE, 10000)).toBe('skeyes');
    expect(anspFor(ISO.FR, 36000)).toBe('DSNA');
    expect(anspFor('999', 36000)).toBeNull();
  });
  it('planned route crosses BE → FR → CH → IT and ANSPs in research order', async () => {
    const fc = await loadCountries();
    const c = (await countrySpans(ROUTE_PLANNED, fc)).map((s) => s.id);
    expect(c[0]).toBe(ISO.BE);
    expect(c.at(-1)).toBe(ISO.IT);
    expect(c.indexOf(ISO.FR)).toBeGreaterThan(0);
    expect(c.indexOf(ISO.CH)).toBeGreaterThan(c.indexOf(ISO.FR));
    expect(anspSpans(ROUTE_PLANNED, fc).map((s) => s.id)).toEqual(['skeyes', 'MUAC', 'DSNA', 'Skyguide', 'ENAV']);
  });
  it('reroute swaps DSNA for DFS', async () => {
    const fc = await loadCountries();
    expect(anspSpans(ROUTE_REROUTED, fc).map((s) => s.id)).toEqual(['skeyes', 'MUAC', 'DFS', 'Skyguide', 'ENAV']);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/unit/flight.test.ts tests/unit/fpl.test.ts` → FAIL.

- [ ] **Step 3: Implement**

`src/lib/story/flight.ts`
```ts
import { geoContains } from 'd3-geo';
import { sampleRoute, mergeSamples, routeLengthKm, spansByRegion, type LonLat, type Span } from '$lib/geo/route';
import { ISO, regionsFor, type CountryFC } from '$lib/geo/countries';

/** Everything about FFS101 is illustrative (research §0, §4e). */
export const HERO = {
  callsign: 'FFS101',
  airline: 'Full Flight Story Air (fictional)',
  aircraftType: 'A20N',
  aircraftName: 'Airbus A320neo',
  mtowT: 79, // [S35]
  registration: 'OO-FFS',
  date: '2026-07-10',
  std: '05:00', // UTC = 07:00 Brussels time
  sta: '07:05',
  cruiseFt: 36000,
  taxiOutMin: 15,
  ctotDelayMin: 27,
  rerouteCtotDelayMin: 7
} as const;

export const AIRPORTS = {
  EBBR: { icao: 'EBBR', name: 'Brussels Airport', lonlat: [4.484444, 50.901389] as LonLat },
  LIRF: { icao: 'LIRF', name: 'Rome Fiumicino', lonlat: [12.238889, 41.800278] as LonLat }
};

/** Illustrative tracks; the real filed route depends on RAD, FRA, winds and charges (research §0, §14). */
export const ROUTE_PLANNED: LonLat[] = [
  AIRPORTS.EBBR.lonlat, [4.95, 50.35], [6.05, 49.62], [6.45, 48.75], [7.3, 47.75], [7.85, 47.2],
  [8.6, 46.6], [8.95, 46.0], [9.25, 45.45], [10.35, 43.7], [11.3, 42.6], AIRPORTS.LIRF.lonlat
];
export const ROUTE_REROUTED: LonLat[] = [
  AIRPORTS.EBBR.lonlat, [5.6, 50.65], [6.9, 49.9], [8.2, 48.9], [8.6, 47.45],
  [8.6, 46.6], [8.95, 46.0], [9.25, 45.45], [10.35, 43.7], [11.3, 42.6], AIRPORTS.LIRF.lonlat
];

export type AnspKey = 'skeyes' | 'MUAC' | 'ANA' | 'DSNA' | 'DFS' | 'Skyguide' | 'ENAV';
export const ANSP_LABEL: Record<AnspKey, string> = {
  skeyes: 'skeyes · Brussels', MUAC: 'MUAC · Maastricht', ANA: 'ANA · Luxembourg', DSNA: 'DSNA · Reims ACC',
  DFS: 'DFS · Karlsruhe UAC', Skyguide: 'skyguide · Zurich ACC', ENAV: 'ENAV · Milano & Roma ACC'
};
const FL245 = 24500;

export function anspFor(iso: string, altFt: number): AnspKey | null {
  switch (iso) {
    case ISO.BE: return altFt >= FL245 ? 'MUAC' : 'skeyes';
    case ISO.LU: return altFt >= FL245 ? 'MUAC' : 'ANA';
    case ISO.NL: return altFt >= FL245 ? 'MUAC' : null;
    case ISO.FR: return 'DSNA';
    case ISO.DE: return 'DFS';
    case ISO.CH: return 'Skyguide';
    case ISO.IT: return 'ENAV';
    default: return null;
  }
}

/** Smooth illustrative profile: climb over 190 km, descend over the last 210 km (research §6, §8 rules of thumb). */
export function altitudeAtKm(d: number, totalKm: number, cruise: number = HERO.cruiseFt, climbKm = 190, descentKm = 210): number {
  if (d <= 0 || d >= totalKm) return 0;
  if (d < climbKm) return Math.round(cruise * Math.sin(((d / climbKm) * Math.PI) / 2));
  if (d > totalKm - descentKm) return Math.round(cruise * Math.sin((((totalKm - d) / descentKm) * Math.PI) / 2));
  return cruise;
}

const ROUTE_ISOS = Object.values(ISO);
export async function countrySpans(route: LonLat[], fc: CountryFC): Promise<Span[]> {
  return spansByRegion(route, regionsFor(fc, ROUTE_ISOS));
}

export function anspSpans(route: LonLat[], fc: CountryFC): Span<AnspKey>[] {
  const regions = regionsFor(fc, ROUTE_ISOS);
  const total = routeLengthKm(route);
  const samples = sampleRoute(route, 5).map(({ d, p }) => {
    const iso = regions.find((r) => geoContains(r.feature, p))?.id ?? null;
    return { d, id: iso ? anspFor(iso, altitudeAtKm(d, total)) : null };
  });
  return mergeSamples(samples, total);
}

export type Phase = 'strategic' | 'pretactical' | 'filing' | 'tactical' | 'ground' | 'departure' | 'enroute' | 'arrival' | 'postops';
export type Actor = 'airline' | 'slot-coordinator' | 'network-manager' | 'ifps' | 'fmp' | 'ansp' | 'airport' | 'ground-handler' | 'pilots' | 'military' | 'crco' | 'prc' | 'passengers';
export interface FlightEvent { id: string; at: string; phase: Phase; actor: Actor; label: string; msg?: string; sources: string[] }

const D = (hhmm: string, day = HERO.date) => `${day}T${hhmm}:00Z`;
const ILL = 'illustrative';

/** Times UTC. `sources` lists the research ids that justify the step; 'illustrative' marks invented specifics. */
export const EVENTS: FlightEvent[] = [
  { id: 'schedule', at: '2025-09-01T09:00:00Z', phase: 'strategic', actor: 'airline', label: 'Network planning puts a 07:00 Brussels–Rome rotation in the Summer 2026 schedule', sources: [ILL] },
  { id: 'slot-request', at: '2025-10-09T12:00:00Z', phase: 'strategic', actor: 'airline', label: 'Initial slot requests sent to BSC (Brussels) and Assoclearance (Rome)', sources: ['S25', 'S26', 'S27'] },
  { id: 'slot-conference', at: '2025-11-12T09:00:00Z', phase: 'strategic', actor: 'slot-coordinator', label: 'Airport slots confirmed around the IATA Slot Conference', sources: ['S22', 'S24'] },
  { id: 'season-start', at: '2026-03-29T00:00:00Z', phase: 'strategic', actor: 'airline', label: 'IATA Summer season S26 begins (last Sunday of March)', sources: ['S25'] },
  { id: 'pretactical', at: D('06:00', '2026-07-04'), phase: 'pretactical', actor: 'network-manager', label: 'D−6: NM starts comparing forecast demand with capacity', sources: ['S8'] },
  { id: 'aup', at: D('12:00', '2026-07-09'), phase: 'pretactical', actor: 'military', label: 'Military airspace bookings for tomorrow published (AUP → EAUP)', sources: ['S19'] },
  { id: 'adp', at: D('16:00', '2026-07-09'), phase: 'pretactical', actor: 'network-manager', label: 'D−1 16:00 UTC: the ATFCM Daily Plan moves into ETFMS — "tomorrow" becomes "today"', sources: ['S8'] },
  { id: 'fpl', at: D('17:00', '2026-07-09'), phase: 'filing', actor: 'airline', label: 'Dispatcher files the flight plan with IFPS', msg: 'FPL', sources: ['S9'] },
  { id: 'ack', at: '2026-07-09T17:00:20Z', phase: 'filing', actor: 'ifps', label: 'IFPS validates it automatically and replies ACK', msg: 'ACK', sources: ['S9', 'S10'] },
  { id: 'distribution', at: '2026-07-09T17:01:00Z', phase: 'filing', actor: 'ifps', label: 'Flight plan distributed to every ATC unit on the route and to ETFMS', sources: ['S7', 'S9'] },
  { id: 'regulation', at: D('02:30'), phase: 'tactical', actor: 'fmp', label: 'Reims FMP and NM regulate a sector group: staffing shortfall', sources: ['S7', ILL] },
  { id: 'e-dpi', at: D('02:00'), phase: 'tactical', actor: 'airport', label: 'Brussels A-CDM sends an Early DPI (EOBT−3h)', msg: 'E-DPI', sources: ['S7', 'S13'] },
  { id: 'sam', at: D('03:00'), phase: 'tactical', actor: 'network-manager', label: 'Slot Allocation Message: CTOT 05:42, 27 minutes late', msg: 'SAM', sources: ['S7', ILL] },
  { id: 'rrp', at: D('03:20'), phase: 'tactical', actor: 'network-manager', label: 'Rerouting proposal via Karlsruhe and Zurich: ~20 NM longer, CTOT 05:22', msg: 'RRP', sources: ['S7', 'S3', ILL] },
  { id: 'chg', at: D('03:34'), phase: 'tactical', actor: 'airline', label: 'Dispatcher weighs fuel, charges and delay, accepts by refiling', msg: 'CHG', sources: ['S7', ILL] },
  { id: 'srm', at: D('03:35'), phase: 'tactical', actor: 'network-manager', label: 'Slot Revision Message confirms CTOT 05:22', msg: 'SRM', sources: ['S7', ILL] },
  { id: 'ground-start', at: D('04:05'), phase: 'ground', actor: 'ground-handler', label: 'Ground handling starts: cleaning, catering, fuel, bags', sources: ['S13', ILL] },
  { id: 't-dpi-s', at: D('04:20'), phase: 'ground', actor: 'airport', label: 'TSAT 05:07 issued; Target DPI sent to NM (TOBT−40 min)', msg: 'T-DPI-s', sources: ['S7', 'S13'] },
  { id: 'boarding', at: D('04:25'), phase: 'ground', actor: 'passengers', label: 'Boarding starts', sources: ['S13', ILL] },
  { id: 'ready', at: D('04:58'), phase: 'ground', actor: 'pilots', label: 'Doors closed — aircraft ready', sources: ['S13', ILL] },
  { id: 'asat', at: D('05:07'), phase: 'departure', actor: 'ansp', label: 'skeyes approves start-up; clearance includes the CTOT', sources: ['S7', 'S28'] },
  { id: 'aobt', at: D('05:09'), phase: 'departure', actor: 'pilots', label: 'Push-back (off-block)', msg: 'A-DPI', sources: ['S7', 'S13'] },
  { id: 'atot', at: D('05:24'), phase: 'departure', actor: 'pilots', label: 'Take-off — inside the −5/+10 slot window', sources: ['S7', ILL] },
  { id: 'muac', at: D('05:33'), phase: 'enroute', actor: 'ansp', label: 'Passing FL245: skeyes hands over to MUAC', sources: ['S28', 'S5'] },
  { id: 'dfs', at: D('05:50'), phase: 'enroute', actor: 'ansp', label: 'MUAC → DFS Karlsruhe UAC (OLDI coordination)', sources: ['S43', ILL] },
  { id: 'skyguide', at: D('06:08'), phase: 'enroute', actor: 'ansp', label: 'DFS → skyguide Zurich ACC', sources: ['S31', ILL] },
  { id: 'enav', at: D('06:22'), phase: 'enroute', actor: 'ansp', label: 'skyguide → ENAV Milano ACC, later Roma ACC', sources: ['S30', ILL] },
  { id: 'tod', at: D('06:42'), phase: 'arrival', actor: 'pilots', label: 'Top of descent', sources: [ILL] },
  { id: 'aldt', at: D('07:04'), phase: 'arrival', actor: 'ansp', label: 'Landing at Fiumicino', sources: ['S13', ILL] },
  { id: 'aibt', at: D('07:12'), phase: 'arrival', actor: 'airport', label: 'On blocks: 7 min after schedule — "on time"', sources: ['S1', ILL] },
  { id: 'postops', at: D('09:00', '2026-07-11'), phase: 'postops', actor: 'network-manager', label: 'Post-ops: delay attributed to the regulation and its cause', sources: ['S8', 'S36'] },
  { id: 'billing', at: '2026-08-15T09:00:00Z', phase: 'postops', actor: 'crco', label: 'CRCO bills July route charges on the route actually flown', sources: ['S32', 'S33'] },
  { id: 'review', at: '2027-06-01T09:00:00Z', phase: 'postops', actor: 'prc', label: 'Performance Review Commission reports on the year', sources: ['S37', 'S38'] }
].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)) as FlightEvent[];

export const event = (id: string) => {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) throw new Error(`unknown event ${id}`);
  return e;
};
export const minutesOfDay = (iso: string) => new Date(iso).getUTCHours() * 60 + new Date(iso).getUTCMinutes();

export const ACDM = {
  eobt: '05:00', tobt: '05:00', tsat: '05:07', ttot: '05:22', ctotPlanned: '05:42', ctotFinal: '05:22',
  asat: '05:07', aobt: '05:09', atot: '05:24', aldt: '07:04', aibt: '07:12', sta: HERO.sta
} as const;

export interface TurnTask { id: string; label: string; actor: Actor; start: string; end: string }
/** First rotation of the day (aircraft night-stopped at BRU). Durations illustrative (research §5). */
export const TURNAROUND: TurnTask[] = [
  { id: 'crew', label: 'Crew briefing (route, NOTAMs, weather, CTOT)', actor: 'pilots', start: '04:00', end: '04:30' },
  { id: 'clean', label: 'Cabin cleaning', actor: 'ground-handler', start: '04:05', end: '04:25' },
  { id: 'cater', label: 'Catering', actor: 'ground-handler', start: '04:10', end: '04:30' },
  { id: 'fuel', label: 'Refuelling', actor: 'ground-handler', start: '04:15', end: '04:35' },
  { id: 'bags', label: 'Baggage loading', actor: 'ground-handler', start: '04:20', end: '04:55' },
  { id: 'board', label: 'Boarding', actor: 'passengers', start: '04:25', end: '04:52' },
  { id: 'doors', label: 'Doors closed, ready', actor: 'pilots', start: '04:52', end: '04:58' },
  { id: 'startup', label: 'Wait for TSAT, start-up, push-back', actor: 'ansp', start: '04:58', end: '05:09' }
];
```

Note: `EVENTS` is sorted at module load, so the declaration order above (regulation before e-dpi) does not matter; the test checks the sorted order and unique ids.

`src/lib/story/fpl.ts`
```ts
import type { LonLat } from '$lib/geo/route';
import { HERO, ROUTE_PLANNED } from './flight';

export interface FplField { item: string; label: string; value: string }

function dm(v: number, degDigits: number): [string, number] {
  const totalMin = Math.round(Math.abs(v) * 60);
  return [String(Math.floor(totalMin / 60)).padStart(degDigits, '0') + String(totalMin % 60).padStart(2, '0'), Math.sign(v)];
}
export function fplCoord([lon, lat]: LonLat): string {
  const [la, ls] = dm(lat, 2), [lo, os] = dm(lon, 3);
  return `${la}${ls < 0 ? 'S' : 'N'}${lo}${os < 0 ? 'W' : 'E'}`;
}

/** `lines`: each inner array is one dash-separated line of the message. */
export function buildFpl(lines: FplField[][]) {
  let text = '(FPL';
  const spans: { item: string; label: string; start: number; end: number }[] = [];
  lines.forEach((fields, li) => {
    text += li === 0 ? '' : '\n';
    for (const f of fields) {
      text += '-';
      spans.push({ item: f.item, label: f.label, start: text.length, end: text.length + f.value.length });
      text += f.value;
    }
  });
  return { text: text + ')', spans };
}

export function heroFplFields(route: LonLat[] = ROUTE_PLANNED): FplField[][] {
  const pts = route.slice(1, -1).map(fplCoord).join(' DCT ');
  const [y, m, d] = HERO.date.split('-');
  return [
    [
      { item: '7', label: 'Aircraft identification', value: HERO.callsign },
      { item: '8', label: 'Flight rules & type: IFR, scheduled', value: 'IS' }
    ],
    [
      { item: '9', label: 'Aircraft type / wake category', value: `${HERO.aircraftType}/M` },
      { item: '10', label: 'Equipment & surveillance', value: 'SDE1E2FGHIJ1RWY/LB1' }
    ],
    [{ item: '13', label: 'Departure aerodrome + EOBT', value: `EBBR${HERO.std.replace(':', '')}` }],
    [{ item: '15', label: 'Speed, level, route', value: `N0450F${HERO.cruiseFt / 100} ${pts}` }],
    [{ item: '16', label: 'Destination, total EET, alternate', value: 'LIRF0140 LIRN' }],
    [{ item: '18', label: 'Other information', value: `PBN/A1B1C1D1O1S2 DOF/${y.slice(2)}${m}${d} REG/${HERO.registration.replace('-', '')} RMK/ILLUSTRATIVE FLIGHT` }]
  ];
}

export const HERO_FPL = buildFpl(heroFplFields());
```

- [ ] **Step 4: Run tests** — `npx vitest run tests/unit/flight.test.ts tests/unit/fpl.test.ts` → PASS. If the ANSP sequence test fails because the illustrative track clips a neighbouring country (e.g. Germany near Basel), nudge the offending waypoint by ≤0.15° away from the border, re-run, and record the change in the commit body.

- [ ] **Step 5: Commit**

```bash
git add src/lib/story/flight.ts src/lib/story/fpl.ts tests/unit/flight.test.ts tests/unit/fpl.test.ts
git commit -m "feat: FFS101 hero flight model, ANSP spans and ICAO flight plan"
```

---

### Task 8: CASA slot allocation simulator and demand scenario

**Files:**
- Create: `src/lib/sim/casa.ts`, `src/lib/sim/demand.ts`, `src/lib/story/scenario.ts`
- Test: `tests/unit/casa.test.ts`, `tests/unit/scenario.test.ts`

**Interfaces:**
- Produces (`casa.ts`):
  - `type CasaFlight = { id: string; eto: number; etot: number }` (minutes since 00:00 UTC; `eto` = estimated entry into the regulated sector)
  - `type Regulation = { id: string; start: number; end: number; rate: number }` (rate per hour)
  - `type Allocation = { id: string; eto: number; slotIndex: number | null; entry: number; delay: number; ctot: number; regulated: boolean }`
  - `slotTimes(reg): number[]`, `allocateSlots(flights, reg): Allocation[]` (same order as input), `SLOT_TOLERANCE = { before: 5, after: 10 }`, `withinSlotWindow(atot: number, ctot: number): boolean`
- Produces (`demand.ts`): `mulberry32(seed): () => number`, `type DemandConfig`, `generateDemand(cfg): CasaFlight[]`, `hourlyCounts(flights: { eto: number }[], from: number, to: number, binMin = 60): { start: number; count: number }[]`
- Produces (`scenario.ts`): `REGULATION`, `DEMAND_CONFIG`, `HERO_CASA: CasaFlight`, `scenario(rate?: number): { flights: CasaFlight[]; allocations: Allocation[]; hero: Allocation }`

- [ ] **Step 1: Write failing tests**

`tests/unit/casa.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { slotTimes, allocateSlots, withinSlotWindow, type CasaFlight } from '$lib/sim/casa';
import { mulberry32, generateDemand, hourlyCounts } from '$lib/sim/demand';

const reg = { id: 'LFEEX1', start: 300, end: 540, rate: 28 };

describe('slotTimes', () => {
  it('reproduces the ATFCM manual example: 4 h at 28/h = 112 slots ~2 min apart [S7]', () => {
    const s = slotTimes(reg);
    expect(s.length).toBe(112);
    expect(s[1] - s[0]).toBeCloseTo(60 / 28, 6);
  });
});

describe('allocateSlots', () => {
  const mk = (n: number, every: number, start = 300): CasaFlight[] =>
    Array.from({ length: n }, (_, i) => ({ id: `F${i}`, eto: start + i * every, etot: start + i * every - 30 }));

  it('gives no delay when demand is under capacity', () => {
    expect(allocateSlots(mk(20, 5), reg).every((a) => a.delay === 0)).toBe(true);
  });
  it('queues first-planned first-served when demand doubles capacity', () => {
    const a = allocateSlots(mk(56, 60 / 56), reg);
    const entries = a.map((x) => x.entry);
    for (let i = 1; i < entries.length; i++) expect(entries[i]).toBeGreaterThan(entries[i - 1]);
    for (let i = 1; i < a.length; i++) expect(a[i].delay).toBeGreaterThanOrEqual(a[i - 1].delay - 1);
    // 56 flights in one hour need two hours of 28/h slots: the last one waits ≈ 59 min
    expect(a.at(-1)!.delay).toBeGreaterThan(55);
    expect(a.at(-1)!.delay).toBeLessThan(62);
    expect(new Set(a.map((x) => x.slotIndex)).size).toBe(a.length);
  });
  it('leaves flights outside the regulation untouched and keeps input order', () => {
    const f = [{ id: 'late', eto: 600, etot: 570 }, { id: 'in', eto: 310, etot: 280 }];
    const a = allocateSlots(f, reg);
    expect(a.map((x) => x.id)).toEqual(['late', 'in']);
    expect(a[0]).toMatchObject({ regulated: false, delay: 0, ctot: 570, slotIndex: null });
    expect(a[1]).toMatchObject({ regulated: true, delay: 0 });
  });
  it('ctot = etot + delay', () => {
    for (const x of allocateSlots(mk(56, 60 / 56), reg)) expect(x.ctot).toBe(x.eto - 30 + x.delay);
  });
});

describe('slot window', () => {
  it('is −5/+10 minutes around CTOT [S7]', () => {
    expect(withinSlotWindow(317, 322)).toBe(true);
    expect(withinSlotWindow(316, 322)).toBe(false);
    expect(withinSlotWindow(332, 322)).toBe(true);
    expect(withinSlotWindow(333, 322)).toBe(false);
  });
});

describe('demand', () => {
  it('is deterministic for a seed', () => {
    const cfg = { seed: 7, from: 240, to: 600, baseRate: 24, peakRate: 46, peakAt: 360, peakWidth: 60 };
    expect(generateDemand(cfg)).toEqual(generateDemand(cfg));
    expect(mulberry32(1)()).toBe(mulberry32(1)());
  });
  it('produces sorted flights inside the window and a peak', () => {
    const f = generateDemand({ seed: 3, from: 240, to: 600, baseRate: 20, peakRate: 50, peakAt: 360, peakWidth: 45 });
    expect(f.every((x) => x.eto >= 240 && x.eto < 600)).toBe(true);
    const bins = hourlyCounts(f, 240, 600);
    expect(bins.length).toBe(6);
    const peak = bins.reduce((m, b) => (b.count > m.count ? b : m));
    expect(peak.start).toBeGreaterThanOrEqual(300);
    expect(peak.start).toBeLessThanOrEqual(360);
  });
});
```

`tests/unit/scenario.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { scenario, REGULATION } from '$lib/story/scenario';
import { HERO } from '$lib/story/flight';

describe('hero scenario', () => {
  it('gives FFS101 exactly the story delay at the manual rate', () => {
    expect(scenario().hero.delay).toBe(HERO.ctotDelayMin);
    expect(scenario().hero.regulated).toBe(true);
  });
  it('more capacity means less delay for the hero', () => {
    expect(scenario(REGULATION.rate + 8).hero.delay).toBeLessThan(HERO.ctotDelayMin);
    expect(scenario(60).hero.delay).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/unit/casa.test.ts tests/unit/scenario.test.ts` → FAIL.

- [ ] **Step 3: Implement**

`src/lib/sim/casa.ts`
```ts
export interface CasaFlight { id: string; eto: number; etot: number }
export interface Regulation { id: string; start: number; end: number; rate: number }
export interface Allocation { id: string; eto: number; slotIndex: number | null; entry: number; delay: number; ctot: number; regulated: boolean }

export const SLOT_TOLERANCE = { before: 5, after: 10 } as const;
export const withinSlotWindow = (atot: number, ctot: number) => atot >= ctot - SLOT_TOLERANCE.before && atot <= ctot + SLOT_TOLERANCE.after;

export function slotTimes(reg: Regulation): number[] {
  const interval = 60 / reg.rate;
  const n = Math.round(((reg.end - reg.start) * reg.rate) / 60);
  return Array.from({ length: n }, (_, k) => reg.start + k * interval);
}

/**
 * Simplified CASA: flights entering during the regulation are ordered by ETO (first planned,
 * first served [S7]). Slot k covers [start + k·i, start + (k+1)·i). A flight keeps its ETO if its own
 * slot is free; otherwise it takes the next free slot and enters at that slot's start time.
 * Slots continue past `end` if demand overflows. Delays are whole minutes.
 */
export function allocateSlots(flights: CasaFlight[], reg: Regulation): Allocation[] {
  const interval = 60 / reg.rate;
  const inReg = flights
    .filter((f) => f.eto >= reg.start && f.eto < reg.end)
    .sort((a, b) => a.eto - b.eto || a.id.localeCompare(b.id));
  const byId = new Map<string, Allocation>();
  let nextFree = 0;
  for (const f of inReg) {
    const own = Math.floor((f.eto - reg.start) / interval);
    const k = Math.max(own, nextFree);
    const entry = k === own ? f.eto : reg.start + k * interval;
    const delay = Math.round(entry - f.eto);
    nextFree = k + 1;
    byId.set(f.id, { id: f.id, eto: f.eto, slotIndex: k, entry, delay, ctot: f.etot + delay, regulated: true });
  }
  return flights.map((f) => byId.get(f.id) ?? { id: f.id, eto: f.eto, slotIndex: null, entry: f.eto, delay: 0, ctot: f.etot, regulated: false });
}
```

`src/lib/sim/demand.ts`
```ts
import type { CasaFlight } from './casa';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DemandConfig { seed: number; from: number; to: number; baseRate: number; peakRate: number; peakAt: number; peakWidth: number }

/** Non-homogeneous Poisson arrivals (per hour) at the sector via thinning; Gaussian peak. */
export function generateDemand(cfg: DemandConfig): CasaFlight[] {
  const rnd = mulberry32(cfg.seed);
  const rate = (t: number) => cfg.baseRate + (cfg.peakRate - cfg.baseRate) * Math.exp(-0.5 * ((t - cfg.peakAt) / cfg.peakWidth) ** 2);
  const max = Math.max(cfg.baseRate, cfg.peakRate);
  const out: CasaFlight[] = [];
  let t = cfg.from;
  while (true) {
    t += (-Math.log(1 - rnd()) / max) * 60;
    if (t >= cfg.to) break;
    if (rnd() <= rate(t) / max) {
      const eto = Math.round(t * 10) / 10;
      out.push({ id: `F${String(out.length + 1).padStart(3, '0')}`, eto, etot: Math.round(eto - 20 - rnd() * 25) });
    }
  }
  return out;
}

export function hourlyCounts(flights: { eto: number }[], from: number, to: number, binMin = 60) {
  const bins = Array.from({ length: Math.ceil((to - from) / binMin) }, (_, i) => ({ start: from + i * binMin, count: 0 }));
  for (const f of flights) {
    const i = Math.floor((f.eto - from) / binMin);
    if (i >= 0 && i < bins.length) bins[i].count++;
  }
  return bins;
}
```

`src/lib/story/scenario.ts`
```ts
import { allocateSlots, type CasaFlight, type Regulation } from '$lib/sim/casa';
import { generateDemand, type DemandConfig } from '$lib/sim/demand';
import { HERO } from './flight';

const hm = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);

/** Illustrative regulation on a Reims sector group, 05:00–09:00 UTC at the ATFCM manual's 28/h [S7]. */
export const REGULATION: Regulation = { id: 'LFEERS10', start: 300, end: 540, rate: 28 };

/** Seed is tuned so FFS101 gets exactly HERO.ctotDelayMin (see Task 8 Step 4). */
export const DEMAND_CONFIG: DemandConfig = { seed: 1, from: 240, to: 600, baseRate: 24, peakRate: 46, peakAt: 360, peakWidth: 60 };

const etot = hm(HERO.std) + HERO.taxiOutMin; // 05:15
export const HERO_CASA: CasaFlight = { id: HERO.callsign, etot, eto: etot + 30 }; // reaches the Reims sector ~30 min after take-off

export function scenario(rate = REGULATION.rate) {
  const flights = [...generateDemand(DEMAND_CONFIG), HERO_CASA].sort((a, b) => a.eto - b.eto);
  const allocations = allocateSlots(flights, { ...REGULATION, rate });
  const hero = allocations.find((a) => a.id === HERO.callsign)!;
  return { flights, allocations, hero };
}
```

- [ ] **Step 4: Tune the seed, then run tests**

Run: `npx vitest run tests/unit/casa.test.ts` → PASS.

Find a seed that yields the story delay:
```bash
npx tsx -e "
import { generateDemand } from './src/lib/sim/demand.ts';
import { allocateSlots } from './src/lib/sim/casa.ts';
import { REGULATION, DEMAND_CONFIG, HERO_CASA } from './src/lib/story/scenario.ts';
for (let seed = 1; seed < 2000; seed++) {
  const f = [...generateDemand({ ...DEMAND_CONFIG, seed }), HERO_CASA];
  const h = allocateSlots(f, REGULATION).find((a) => a.id === HERO_CASA.id)!;
  const h2 = allocateSlots(f, { ...REGULATION, rate: REGULATION.rate + 8 }).find((a) => a.id === HERO_CASA.id)!;
  const h3 = allocateSlots(f, { ...REGULATION, rate: 60 }).find((a) => a.id === HERO_CASA.id)!;
  if (h.delay === 27 && h2.delay < 27 && h3.delay === 0) { console.log('seed', seed); break; }
}"
```
Expected: prints `seed N`. Set `DEMAND_CONFIG.seed = N`. If no seed is found, raise `peakRate` by 2 and repeat.

Run: `npx vitest run tests/unit/casa.test.ts tests/unit/scenario.test.ts tests/unit/flight.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sim/casa.ts src/lib/sim/demand.ts src/lib/story/scenario.ts tests/unit/casa.test.ts tests/unit/scenario.test.ts
git commit -m "feat: simplified CASA slot allocator with seeded demand scenario"
```

---

### Task 9: Route charges (CRCO formula)

**Files:**
- Create: `src/lib/sim/charges.ts`, `src/lib/story/charges-data.ts`
- Test: `tests/unit/charges.test.ts`

**Interfaces:**
- Consumes: `Span` (Task 6), `countrySpans`, `ROUTE_PLANNED`, `ROUTE_REROUTED`, `HERO` (Task 7).
- Produces:
  - `type ChargeZone = { id: string; label: string; isos: string[]; unitRateEur: number; source: string }`
  - `weightFactor(mtowT: number): number`, `distanceFactor(km: number): number`, `zoneCharge(km: number, mtowT: number, rate: number): number`
  - `type ZoneCharge = { zone: ChargeZone; km: number; chargeableKm: number; dFactor: number; charge: number }`
  - `routeCharges(spans: Span[], zones: ChargeZone[], mtowT: number): ZoneCharge[]` (zones in route order; departure zone −20 km, arrival zone −20 km)
  - `ZONES: ChargeZone[]` (`charges-data.ts`, rates from research §7a [S34])

- [ ] **Step 1: Write failing tests**

`tests/unit/charges.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { weightFactor, distanceFactor, zoneCharge, routeCharges } from '$lib/sim/charges';
import { ZONES } from '$lib/story/charges-data';
import { ISO } from '$lib/geo/countries';

describe('CRCO formula [S32][S33]', () => {
  it('weight factor for an A320neo (79 t) is 1.26', () => expect(weightFactor(79)).toBe(1.26));
  it('distance factor is km/100 to two decimals', () => expect(distanceFactor(172)).toBe(1.72));
  it('reproduces the research worked example per zone', () => {
    expect(zoneCharge(172, 79, 116.65)).toBeCloseTo(252.8, 2);
    expect(zoneCharge(248, 79, 79.58)).toBeCloseTo(248.67, 2);
    expect(zoneCharge(206, 79, 167.12)).toBeCloseTo(433.78, 2);
    expect(zoneCharge(506, 79, 73.71)).toBeCloseTo(469.95, 1);
  });
});

describe('routeCharges', () => {
  const spans = [
    { id: ISO.BE, startKm: 0, endKm: 150 }, { id: ISO.LU, startKm: 150, endKm: 192 },
    { id: ISO.FR, startKm: 192, endKm: 440 }, { id: ISO.CH, startKm: 440, endKm: 646 },
    { id: ISO.IT, startKm: 646, endKm: 1172 }
  ];
  it('groups Belgium and Luxembourg and deducts 20 km at each end', () => {
    const r = routeCharges(spans, ZONES, 79);
    expect(r.map((z) => z.zone.id)).toEqual(['BELU', 'FR', 'CH', 'IT']);
    expect(r[0]).toMatchObject({ km: 192, chargeableKm: 172 });
    expect(r[3]).toMatchObject({ km: 526, chargeableKm: 506 });
    const total = r.reduce((s, z) => s + z.charge, 0);
    expect(total).toBeGreaterThan(1395);
    expect(total).toBeLessThan(1415); // research: ≈ €1,400
  });
  it('Switzerland: ~18% of distance, ~31% of the bill (research §7a)', () => {
    const r = routeCharges(spans, ZONES, 79);
    const ch = r.find((z) => z.zone.id === 'CH')!;
    const total = r.reduce((s, z) => s + z.charge, 0);
    expect(ch.km / 1172).toBeCloseTo(0.18, 1);
    expect(ch.charge / total).toBeCloseTo(0.31, 1);
  });
  it('ignores spans outside any zone and never goes negative', () => {
    const r = routeCharges([{ id: ISO.BE, startKm: 0, endKm: 10 }, { id: '999', startKm: 10, endKm: 50 }], ZONES, 79);
    expect(r).toHaveLength(1);
    expect(r[0].chargeableKm).toBe(0);
    expect(r[0].charge).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/unit/charges.test.ts` → FAIL.

- [ ] **Step 3: Implement**

`src/lib/sim/charges.ts`
```ts
import type { Span } from '$lib/geo/route';

export interface ChargeZone { id: string; label: string; isos: string[]; unitRateEur: number; source: string }
export interface ZoneCharge { zone: ChargeZone; km: number; chargeableKm: number; dFactor: number; charge: number }

const r2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
export const weightFactor = (mtowT: number) => r2(Math.sqrt(mtowT / 50));
export const distanceFactor = (km: number) => r2(km / 100);
export const zoneCharge = (km: number, mtowT: number, rate: number) => r2(rate * distanceFactor(km) * weightFactor(mtowT));

export function routeCharges(spans: Span[], zones: ChargeZone[], mtowT: number): ZoneCharge[] {
  const zoneOf = (iso: string) => zones.find((z) => z.isos.includes(iso));
  const order: ChargeZone[] = [];
  const km = new Map<string, number>();
  for (const s of spans) {
    const z = zoneOf(s.id);
    if (!z) continue;
    if (!km.has(z.id)) order.push(z);
    km.set(z.id, (km.get(z.id) ?? 0) + (s.endKm - s.startKm));
  }
  const first = spans.length ? zoneOf(spans[0].id)?.id : undefined;
  const last = spans.length ? zoneOf(spans[spans.length - 1].id)?.id : undefined;
  return order.map((zone) => {
    const k = Math.round(km.get(zone.id)!);
    const deduct = (zone.id === first ? 20 : 0) + (zone.id === last ? 20 : 0);
    const chargeableKm = Math.max(0, k - deduct);
    return { zone, km: k, chargeableKm, dFactor: distanceFactor(chargeableKm), charge: zoneCharge(chargeableKm, mtowT, zone.unitRateEur) };
  });
}
```

`src/lib/story/charges-data.ts`
```ts
import type { ChargeZone } from '$lib/sim/charges';
import { ISO } from '$lib/geo/countries';

/** Global unit rates (EUR) applicable to October 2026 flights, CRCO [S34]. */
export const ZONES: ChargeZone[] = [
  { id: 'BELU', label: 'Belgium–Luxembourg', isos: [ISO.BE, ISO.LU], unitRateEur: 116.65, source: 'S34' },
  { id: 'FR', label: 'France', isos: [ISO.FR], unitRateEur: 79.58, source: 'S34' },
  { id: 'DE', label: 'Germany', isos: [ISO.DE], unitRateEur: 97.89, source: 'S34' },
  { id: 'CH', label: 'Switzerland', isos: [ISO.CH], unitRateEur: 167.12, source: 'S34' },
  { id: 'IT', label: 'Italy', isos: [ISO.IT], unitRateEur: 73.71, source: 'S34' }
];
```

- [ ] **Step 4: Run tests** — `npx vitest run tests/unit/charges.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sim/charges.ts src/lib/story/charges-data.ts tests/unit/charges.test.ts
git commit -m "feat: CRCO en-route charge calculator with 2026 unit rates"
```

---
### Task 10: Scroll engine, page shell, citations and glossary terms

**Files:**
- Create: `src/lib/scroll/Scrolly.svelte`, `src/lib/scroll/storyState.svelte.ts`, `src/lib/scroll/motion.ts`
- Create: `src/lib/ui/Chapter.svelte`, `src/lib/ui/StepCard.svelte`, `src/lib/ui/RichText.svelte`, `src/lib/ui/Cite.svelte`, `src/lib/ui/Term.svelte`, `src/lib/ui/MissionClock.svelte`, `src/lib/ui/ThemeToggle.svelte`, `src/lib/ui/FreshnessBadge.svelte`
- Create: `src/lib/story/glossary.ts`, `src/lib/story/clock.ts`
- Create: `src/routes/dev/scroll/+page.svelte` (test harness; keeps `noindex`)
- Test: `tests/unit/glossary.test.ts`, `tests/e2e/scroll.spec.ts`

**Interfaces:**
- Consumes: `parseRich`, `Run`, `getSource` (Task 2); `ChapterDef`, `StepDef` (Task 2 `types.ts`); `Freshness` (Task 5).
- Produces:
  - `Scrolly.svelte` props `{ children: Snippet; onstep?: (index, direction) => void; onprogress?: (index, progress) => void; offset?: number }`; every direct step element must carry `data-step`.
  - `Chapter.svelte` props `{ chapter: ChapterDef; graphic: Snippet<[{ step: number; progress: number }]> }`; renders `<section id={chapter.id}>`, header, sticky `.graphic`, step cards; updates `story`.
  - `story` ($state): `{ chapterId: string; chapterTitle: string; clock: number; clockLabel: string }`
  - `reducedMotion(): boolean`, `dur(ms: number): number`
  - `GLOSSARY: Record<string, { term: string; expansion: string; definition: string; sources: string[] }>`
  - `CLOCK_TICKS: { pos: number; label: string }[]`
  - `Cite.svelte` props `{ ids: string[] }`; `Term.svelte` props `{ id: string; text: string }`; `FreshnessBadge.svelte` props `{ freshness: Freshness | null }`

- [ ] **Step 1: Glossary + failing test**

`src/lib/story/glossary.ts` — one entry per acronym the story uses. Transcribe expansions from research §12 and write a one-sentence plain-English definition for each from the research section that discusses it, with its source ids. Required keys (the content test in Task 14 fails if a `{TERM}` used in copy is missing): `NM, NMOC, IFPS, ANSP, ACC, MUAC, FMP, ATFM, ATFCM, CASA, CTOT, SAM, SRM, SLC, RRP, REA, DPI, A-CDM, EOBT, TOBT, TSAT, TTOT, AOBT, ATOT, ALDT, AIBT, FPL, ACK, CHG, DLA, RAD, AIRAC, FRA, FUA, AUP, NOP, ETFMS, OLDI, CPDLC, SID, STAR, AMAN, FL, CRCO, MTOW, PRC, BSC, WASG, CODA, ADP, STAM`.

```ts
export interface GlossaryEntry { term: string; expansion: string; definition: string; sources: string[] }

export const GLOSSARY: Record<string, GlossaryEntry> = {
  NM: { term: 'NM', expansion: 'Network Manager', definition: 'EUROCONTROL’s role, set by EU law, of designing the European route network and balancing traffic demand against capacity across Europe.', sources: ['S20', 'S2'] },
  IFPS: { term: 'IFPS', expansion: 'Integrated Initial Flight Plan Processing System', definition: 'The Network Manager’s single system in Brussels that checks and distributes every IFR flight plan in the IFPS zone — up to 100,000 messages a day.', sources: ['S9', 'S10'] },
  CTOT: { term: 'CTOT', expansion: 'Calculated Take-Off Time', definition: 'The ATFM slot: the take-off time the Network Manager assigns to a regulated flight. The aircraft must take off between 5 minutes before and 10 minutes after it.', sources: ['S7'] },
  FL: { term: 'FL', expansion: 'Flight level', definition: 'Altitude in hundreds of feet on a standard pressure setting: FL245 is about 24,500 ft, roughly 7,500 m.', sources: ['S28'] }
  // … one entry for every required key above
};
```

`src/lib/story/clock.ts`
```ts
export const CLOCK_TICKS = [
  { pos: 0, label: 'T−10 mo' }, { pos: 0.14, label: 'Season' }, { pos: 0.27, label: 'D−6' },
  { pos: 0.37, label: 'D−1' }, { pos: 0.5, label: 'EOBT−3h' }, { pos: 0.62, label: 'Off-block' },
  { pos: 0.72, label: 'Airborne' }, { pos: 0.86, label: 'On-block' }, { pos: 1, label: 'Post-ops' }
];
```

`tests/unit/glossary.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { GLOSSARY } from '$lib/story/glossary';
import { SOURCES } from '$lib/story/sources';

const REQUIRED = 'NM NMOC IFPS ANSP ACC MUAC FMP ATFM ATFCM CASA CTOT SAM SRM SLC RRP REA DPI A-CDM EOBT TOBT TSAT TTOT AOBT ATOT ALDT AIBT FPL ACK CHG DLA RAD AIRAC FRA FUA AUP NOP ETFMS OLDI CPDLC SID STAR AMAN FL CRCO MTOW PRC BSC WASG CODA ADP STAM'.split(' ');

describe('glossary', () => {
  it('has every required term with a cited definition', () => {
    for (const k of REQUIRED) {
      const g = GLOSSARY[k];
      expect(g, k).toBeDefined();
      expect(g.definition.length, k).toBeGreaterThan(30);
      expect(g.sources.length, k).toBeGreaterThan(0);
      for (const s of g.sources) expect(SOURCES[s], `${k} → ${s}`).toBeDefined();
    }
  });
});
```

Run: `npx vitest run tests/unit/glossary.test.ts` → FAIL until all keys are filled; fill them; → PASS.

- [ ] **Step 2: Scroll primitives**

`src/lib/scroll/motion.ts`
```ts
export const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const dur = (ms: number) => (reducedMotion() ? 0 : ms);
```

`src/lib/scroll/storyState.svelte.ts`
```ts
export const story = $state({ chapterId: '', chapterTitle: '', clock: 0, clockLabel: '' });
```

`src/lib/scroll/Scrolly.svelte`
```svelte
<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import type { Scroller } from 'scrollama';

  let { children, onstep, onprogress, offset = 0.6 }: {
    children: Snippet;
    onstep?: (index: number, direction: 'up' | 'down') => void;
    onprogress?: (index: number, progress: number) => void;
    offset?: number;
  } = $props();

  let root: HTMLDivElement;

  onMount(() => {
    let scroller: Scroller | undefined;
    let alive = true;
    const ro = new ResizeObserver(() => scroller?.resize());
    import('scrollama').then(({ default: scrollama }) => {
      if (!alive) return;
      scroller = scrollama()
        .setup({ step: Array.from(root.querySelectorAll(':scope > [data-step]')), offset, progress: !!onprogress })
        .onStepEnter((e) => onstep?.(e.index, e.direction));
      if (onprogress) scroller.onStepProgress((e) => onprogress(e.index, e.progress));
      ro.observe(document.documentElement);
    });
    return () => {
      alive = false;
      ro.disconnect();
      scroller?.destroy();
    };
  });
</script>

<div class="steps" bind:this={root}>{@render children()}</div>
```

- [ ] **Step 3: Citation, term, rich text, step card**

`src/lib/ui/Cite.svelte`
```svelte
<script lang="ts">
  import { getSource } from '$lib/story/sources';
  let { ids }: { ids: string[] } = $props();
  const items = $derived(ids.map((id) => ({ id, s: getSource(id), label: id.startsWith('S') ? id.slice(1) : 'data' })));
</script>

<sup class="cites">
  {#each items as { id, s, label } (id)}
    <a class="cite" href={s.url} target="_blank" rel="noopener noreferrer" aria-label="Source {label}: {s.title}, {s.publisher}">
      {label}<span class="tip" role="tooltip"><strong>{s.publisher}</strong><br />{s.title}</span>
    </a>
  {/each}
</sup>

<style>
  .cites { display: inline-flex; gap: 2px; margin-left: 2px; vertical-align: super; line-height: 1; }
  .cite { position: relative; font-size: 11px; font-weight: 600; padding: 1px 5px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--ink); text-decoration: none; }
  .cite:hover, .cite:focus-visible { background: var(--accent); color: #fff; }
  .tip { display: none; position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); width: max-content; max-width: 260px; padding: 8px 10px; background: var(--surface-2); color: var(--ink); border: 1px solid var(--border); border-radius: 8px; font-size: 12px; font-weight: 400; line-height: 1.35; z-index: 20; white-space: normal; text-align: left; }
  .cite:hover .tip, .cite:focus-visible .tip { display: block; }
</style>
```

`src/lib/ui/Term.svelte`
```svelte
<script lang="ts">
  import { GLOSSARY } from '$lib/story/glossary';
  import Cite from './Cite.svelte';
  let { id, text }: { id: string; text: string } = $props();
  const g = $derived(GLOSSARY[id]);
  let open = $state(false);
</script>

<span class="term" onmouseenter={() => (open = true)} onmouseleave={() => (open = false)} role="presentation">
  <button type="button" aria-expanded={open} onclick={() => (open = !open)} onblur={() => (open = false)}>{text}</button>
  {#if open && g}
    <span class="pop" role="tooltip">
      <strong>{g.term}</strong> — {g.expansion}<br />{g.definition}<Cite ids={g.sources} />
    </span>
  {/if}
</span>

<style>
  .term { position: relative; }
  button { all: unset; cursor: help; border-bottom: 1px dotted var(--ink-2); }
  button:focus-visible { outline: 2px solid var(--accent); }
  .pop { position: absolute; left: 0; top: calc(100% + 6px); z-index: 30; width: min(300px, 80vw); padding: 10px 12px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; font-size: 14px; line-height: 1.45; color: var(--ink); }
</style>
```

`src/lib/ui/RichText.svelte`
```svelte
<script lang="ts">
  import { parseRich } from '$lib/story/richtext';
  import Cite from './Cite.svelte';
  import Term from './Term.svelte';
  let { text }: { text: string } = $props();
  const paragraphs = $derived(text.split(/\n\s*\n/).map((p) => parseRich(p.trim())));
</script>

{#each paragraphs as runs}
  <p>
    {#each runs as r}
      {#if r.kind === 'text'}{r.text}{:else if r.kind === 'strong'}<strong>{r.text}</strong>{:else if r.kind === 'em'}<em>{r.text}</em>{:else if r.kind === 'term'}<Term id={r.id} text={r.text} />{:else}<Cite ids={r.ids} />{/if}
    {/each}
  </p>
{/each}
```

`src/lib/ui/StepCard.svelte`
```svelte
<script lang="ts">
  import type { StepDef } from '$lib/story/types';
  import RichText from './RichText.svelte';
  let { step }: { step: StepDef } = $props();
</script>

<div class="card">
  {#if step.illustrative}<span class="badge" title="FFS101 is a fictional flight; the process is real">Illustrative</span>{/if}
  <RichText text={step.text} />
</div>

<style>
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; box-shadow: 0 10px 40px rgb(0 0 0 / 0.25); }
  .card :global(p) { margin: 0 0 0.7em; }
  .card :global(p:last-child) { margin-bottom: 0; }
  .badge { display: inline-block; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-2); border: 1px solid var(--border); border-radius: 999px; padding: 2px 8px; margin-bottom: 8px; }
</style>
```

`src/lib/ui/FreshnessBadge.svelte`
```svelte
<script lang="ts">
  import type { Freshness } from '$lib/data/live';
  let { freshness }: { freshness: Freshness | null } = $props();
</script>

{#if freshness}
  <span class="fresh {freshness}" title={freshness === 'live' ? 'Fetched live from the EUROCONTROL API in your browser' : 'Bundled snapshot (live fetch unavailable or not newer)'}>
    {freshness === 'live' ? '● Live' : '◌ Snapshot'}
  </span>
{/if}

<style>
  .fresh { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--border); white-space: nowrap; }
  .live { color: var(--status-good); }
  .snapshot { color: var(--ink-2); }
</style>
```

- [ ] **Step 4: Chapter, mission clock, theme toggle**

`src/lib/ui/Chapter.svelte`
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ChapterDef } from '$lib/story/types';
  import Scrolly from '$lib/scroll/Scrolly.svelte';
  import StepCard from './StepCard.svelte';
  import { story } from '$lib/scroll/storyState.svelte';

  let { chapter, graphic }: { chapter: ChapterDef; graphic: Snippet<[{ step: number; progress: number }]> } = $props();
  let step = $state(0);
  let progress = $state(0);

  function onstep(i: number) {
    step = i;
    progress = 0;
    story.chapterId = chapter.id;
    story.chapterTitle = chapter.title;
    story.clock = chapter.steps[i]?.clock ?? chapter.clock;
    story.clockLabel = chapter.clockLabel;
  }
</script>

<section class="chapter" id={chapter.id} aria-labelledby="{chapter.id}-title" data-active-step={step}>
  <header class="head">
    <p class="kicker">{chapter.kicker}</p>
    <h2 id="{chapter.id}-title">{chapter.title}</h2>
  </header>
  <div class="scrolly">
    <div class="graphic">{@render graphic({ step, progress })}</div>
    <div class="steps-wrap">
      <Scrolly {onstep} onprogress={(i, p) => { if (i === step) progress = p; }}>
        {#each chapter.steps as s, i (s.id)}
          <div class="step" data-step={i} class:active={i === step}><StepCard step={s} /></div>
        {/each}
      </Scrolly>
    </div>
  </div>
</section>

<style>
  .head { max-width: 760px; margin: 0 auto; padding: 28vh 16px 8vh; }
  .kicker { text-transform: uppercase; letter-spacing: 0.12em; font-size: 13px; color: var(--ink-2); margin: 0 0 8px; }
  h2 { font-size: clamp(32px, 5vw, 56px); margin: 0; }
  .scrolly { position: relative; }
  .graphic { position: sticky; top: var(--clock-h); height: calc(100svh - var(--clock-h)); padding-left: var(--step-col); overflow: hidden; }
  .steps-wrap { position: relative; z-index: 2; margin-top: calc(-100svh + var(--clock-h)); pointer-events: none; }
  .step { min-height: 95svh; display: flex; align-items: center; padding: 0 24px; }
  .step:last-child { min-height: 110svh; }
  .step :global(.card) { pointer-events: auto; width: min(100%, 380px); opacity: 0.35; transition: opacity 300ms; }
  .step.active :global(.card) { opacity: 1; }
  @media (max-width: 1023px) {
    .step { align-items: flex-end; padding: 0 16px 6svh; }
    .step :global(.card) { width: 100%; background: color-mix(in srgb, var(--surface) 94%, transparent); backdrop-filter: blur(6px); }
  }
</style>
```

`src/lib/ui/MissionClock.svelte`
```svelte
<script lang="ts">
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { story } from '$lib/scroll/storyState.svelte';
  import { CLOCK_TICKS } from '$lib/story/clock';
  import { dur } from '$lib/scroll/motion';
  import ThemeToggle from './ThemeToggle.svelte';

  const pos = new Tween(0, { duration: dur(500), easing: cubicOut });
  $effect(() => { pos.target = story.clock; });
</script>

<div class="clock" role="progressbar" aria-label="Where we are in the flight's life" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(story.clock * 100)} aria-valuetext={story.clockLabel || 'Start'}>
  <span class="now">{story.clockLabel || 'FFS101'}</span>
  <div class="rail">
    {#each CLOCK_TICKS as t}<span class="tick" style:left="{t.pos * 100}%"><span class="tl">{t.label}</span></span>{/each}
    <span class="fill" style:width="{pos.current * 100}%"></span>
    <span class="plane" style:left="{pos.current * 100}%" aria-hidden="true">✈</span>
  </div>
  <ThemeToggle />
</div>

<style>
  .clock { position: fixed; inset: 0 0 auto 0; height: var(--clock-h); z-index: 50; display: flex; align-items: center; gap: 16px; padding: 0 16px; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); font-size: 12px; }
  .now { min-width: 72px; font-weight: 600; white-space: nowrap; }
  .rail { position: relative; flex: 1; height: 2px; background: var(--grid); }
  .fill { position: absolute; left: 0; top: 0; height: 2px; background: var(--accent); }
  .tick { position: absolute; top: -3px; width: 1px; height: 8px; background: var(--axis); }
  .tl { position: absolute; top: 9px; transform: translateX(-50%); color: var(--muted); font-size: 10px; white-space: nowrap; }
  .plane { position: absolute; top: -9px; transform: translateX(-50%) rotate(90deg); color: var(--ink); font-size: 14px; }
  @media (max-width: 700px) { .tl { display: none; } .now { min-width: 0; } }
</style>
```

`src/lib/ui/ThemeToggle.svelte`
```svelte
<script lang="ts">
  let theme = $state<'dark' | 'light'>('dark');
  $effect(() => { theme = (document.documentElement.dataset.theme as 'dark' | 'light') ?? 'dark'; });
  function toggle() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch {}
  }
</script>

<button type="button" class="tt" onclick={toggle} aria-label="Switch to {theme === 'dark' ? 'light' : 'dark'} theme">{theme === 'dark' ? '☀' : '☾'}</button>

<style>
  .tt { all: unset; cursor: pointer; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; border: 1px solid var(--border); }
  .tt:focus-visible { outline: 2px solid var(--accent); }
</style>
```

- [ ] **Step 5: Dev harness and e2e test**

`src/routes/dev/scroll/+page.svelte`
```svelte
<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import MissionClock from '$lib/ui/MissionClock.svelte';
  import type { ChapterDef } from '$lib/story/types';
  const chapters: ChapterDef[] = ['one', 'two'].map((id, c) => ({
    id, kicker: `Chapter ${c + 1}`, title: `Test ${id}`, clockLabel: `C${c + 1}`, clock: c * 0.5,
    steps: [0, 1, 2].map((s) => ({ id: `${id}-${s}`, text: `Step ${s} of ${id} [D-eurocontrol] with {IFPS}.`, clock: c * 0.5 + s * 0.1 }))
  }));
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>
<MissionClock />
{#each chapters as ch (ch.id)}
  <Chapter chapter={ch}>
    {#snippet graphic({ step, progress })}<div class="g" data-testid="graphic-{ch.id}">step {step} · {progress.toFixed(2)}</div>{/snippet}
  </Chapter>
{/each}
<div style="height: 50vh"></div>
```

`tests/e2e/scroll.spec.ts` (scrolls with `window.scrollTo`, which works identically on the desktop and touch projects; Task 15 moves `scrollStepTo` into `tests/e2e/helpers.ts`)
```ts
import { test, expect, type Page } from '@playwright/test';

/** Put the top of `selector` at `frac` of the viewport height (above scrollama's 0.6 offset line). */
async function scrollStepTo(page: Page, selector: string, frac = 0.3) {
  await page.evaluate(([sel, f]) => {
    const el = document.querySelector(sel as string)!;
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * (f as number));
  }, [selector, frac]);
}

test('steps activate on scroll and drive the mission clock', async ({ page }) => {
  await page.goto('/dev/scroll/');
  await scrollStepTo(page, '#two [data-step="1"]');
  await expect(page.getByTestId('graphic-two')).toContainText('step 1');
  const clock = page.getByRole('progressbar');
  await expect(clock).toHaveAttribute('aria-valuetext', 'C2');
  await expect(clock).toHaveAttribute('aria-valuenow', '60');
});

test('scrolling back up re-activates earlier steps', async ({ page }) => {
  await page.goto('/dev/scroll/');
  await scrollStepTo(page, '#two [data-step="2"]');
  await expect(page.getByTestId('graphic-two')).toContainText('step 2');
  await scrollStepTo(page, '#one [data-step="1"]');
  await expect(page.getByTestId('graphic-one')).toContainText('step 1');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'C1');
});

test('deep link lands on the right chapter', async ({ page }) => {
  await page.goto('/dev/scroll/#two');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'C2');
});

test('citation chips link to sources and terms open definitions', async ({ page }) => {
  await page.goto('/dev/scroll/');
  await expect(page.locator('#one .cite').first()).toHaveAttribute('href', /eurocontrol/);
  await page.locator('#one .term button').first().click();
  await expect(page.locator('#one [role="tooltip"]').first()).toContainText('Integrated Initial Flight Plan');
});
```

Run: `npm run check && npm run test:e2e -- tests/e2e/scroll.spec.ts`
Expected: 0 type errors; 8 passed (4 tests × desktop/mobile).

- [ ] **Step 6: Commit**

```bash
git add src/lib/scroll src/lib/ui src/lib/story/glossary.ts src/lib/story/clock.ts src/routes/dev tests/unit/glossary.test.ts tests/e2e/scroll.spec.ts
git commit -m "feat: scrollytelling shell with mission clock, citations and glossary terms"
```

---

### Task 11: Chart primitives (Figure, tooltip, legend, table, line, stacked area, bars, hero number)

**Files:**
- Create: `src/lib/viz/types.ts`, `src/lib/viz/palette.ts`, `src/lib/viz/chart-utils.ts`
- Create: `src/lib/viz/Figure.svelte`, `Tooltip.svelte`, `Legend.svelte`, `DataTable.svelte`, `SourceLine.svelte`, `HeroNumber.svelte`, `LineChart.svelte`, `StackedArea.svelte`, `BarChart.svelte`
- Create: `src/routes/dev/charts/+page.svelte` (gallery for visual review)
- Test: `tests/unit/chart-utils.test.ts`, `tests/e2e/charts.spec.ts`

**Interfaces:**
- Consumes: `getSource`, `Cite`, `FreshnessBadge`, `Freshness`, `Series`, `stackByName`, `dayOfYear`, `AnspKey`.
- Produces:
  - `types.ts`: `type XY = { x: number; y: number }`, `type LineSeries = { id: string; label: string; color: string; width?: number; dash?: string; points: XY[] }`, `type Bar = { key: string; label: string; value: number; color?: string; emphasis?: boolean }`, `type Column = { key: string; label: string; format?: (v: any) => string }`, `type TableSpec = { caption: string; columns: Column[]; rows: Record<string, unknown>[] }`
  - `palette.ts`: `CAUSES`, `CAUSE_LABEL`, `CAUSE_COLOR`, `ANSP_COLOR`, `ZONE_COLOR`, `yearStyle(year, current)`, `ALT_BINS`, `altitudeBin(ft)`, `cssVar(name)`
  - `chart-utils.ts`: `fmtInt`, `fmtDec(n, d)`, `fmtDate(iso)`, `fmtHm(min)`, `doyLabel(doy)`, `roundedTopBar(x, y, w, h, r): string`, `nearestIndex(xs: number[], x: number): number`
  - Components (props as in code below). Every chart sits inside `<Figure>`, which renders title, the chart, a "Show data table" `<details>` and `<SourceLine>`.

- [ ] **Step 1: Failing unit test**

`tests/unit/chart-utils.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { fmtInt, fmtHm, doyLabel, roundedTopBar, nearestIndex, fmtDate } from '$lib/viz/chart-utils';
import { altitudeBin, CAUSES, CAUSE_COLOR, ANSP_COLOR } from '$lib/viz/palette';

describe('chart utils', () => {
  it('formats', () => {
    expect(fmtInt(37034)).toBe('37,034');
    expect(fmtHm(322)).toBe('05:22');
    expect(fmtHm(1440 + 5)).toBe('00:05');
    expect(doyLabel(1)).toBe('1 Jan');
    expect(doyLabel(182)).toBe('1 Jul');
    expect(fmtDate('2026-10-08')).toBe('8 Oct 2026');
  });
  it('rounded bar keeps baseline square and clamps radius', () => {
    expect(roundedTopBar(0, 10, 20, 30, 4)).toBe('M0,40V14Q0,10 4,10H16Q20,10 20,14V40Z');
    expect(roundedTopBar(0, 10, 4, 1, 4)).toBe('M0,11V10Q0,10 1,10H3Q4,10 4,10V11Z');
  });
  it('nearestIndex', () => {
    expect(nearestIndex([0, 10, 20], 14)).toBe(1);
    expect(nearestIndex([0, 10, 20], 16)).toBe(2);
    expect(nearestIndex([0, 10, 20], -5)).toBe(0);
  });
  it('palette maps fixed entities to fixed slots', () => {
    expect(CAUSES.map((c) => CAUSE_COLOR[c])).toEqual(['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)']);
    expect(ANSP_COLOR.MUAC).toBe('var(--series-2)');
    expect(altitudeBin(500)).toBe(0);
    expect(altitudeBin(39000)).toBe(4);
  });
});
```

Run: `npx vitest run tests/unit/chart-utils.test.ts` → FAIL.

- [ ] **Step 2: Implement utils and palette**

`src/lib/viz/types.ts`
```ts
export interface XY { x: number; y: number }
export interface LineSeries { id: string; label: string; color: string; width?: number; dash?: string; points: XY[] }
export interface Bar { key: string; label: string; value: number; color?: string; emphasis?: boolean }
export interface Column { key: string; label: string; format?: (v: any) => string }
export interface TableSpec { caption: string; columns: Column[]; rows: Record<string, unknown>[] }
```

`src/lib/viz/chart-utils.ts`
```ts
const nf = new Intl.NumberFormat('en-GB');
export const fmtInt = (n: number) => nf.format(Math.round(n));
export const fmtDec = (n: number, d = 1) => n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
export const fmtHm = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
/** Day-of-year label in a non-leap year (series are re-dated onto the current year). */
export const doyLabel = (doy: number) => {
  const d = new Date(Date.UTC(2026, 0, doy));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};
export function roundedTopBar(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}
export function nearestIndex(xs: number[], x: number): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
  return best;
}
```

`src/lib/viz/palette.ts`
```ts
import type { AnspKey } from '$lib/story/flight';

/** EUROCONTROL Data app delay-cause names, in fixed slot order (dataviz: never cycle). */
export const CAUSES = ['Capacity/Staffing (ATC)', 'Weather', 'Aerodrome capacity', 'Disruptions (ATC)', 'Other'] as const;
export type Cause = (typeof CAUSES)[number];
export const CAUSE_LABEL: Record<Cause, string> = {
  'Capacity/Staffing (ATC)': 'ATC capacity & staffing', Weather: 'Weather', 'Aerodrome capacity': 'Airport capacity',
  'Disruptions (ATC)': 'ATC disruptions (e.g. strikes)', Other: 'Other'
};
export const CAUSE_COLOR: Record<Cause, string> = Object.fromEntries(CAUSES.map((c, i) => [c, `var(--series-${i + 1})`])) as Record<Cause, string>;

export const ANSP_COLOR: Record<AnspKey, string> = {
  skeyes: 'var(--series-1)', MUAC: 'var(--series-2)', DSNA: 'var(--series-3)', DFS: 'var(--series-4)',
  Skyguide: 'var(--series-5)', ENAV: 'var(--series-6)', ANA: 'var(--muted)'
};
export const ZONE_COLOR: Record<string, string> = { BELU: 'var(--series-1)', FR: 'var(--series-3)', DE: 'var(--series-4)', CH: 'var(--series-5)', IT: 'var(--series-6)' };

/** Current year in series-1, last year series-2, reference years muted (2020 dashed). */
export function yearStyle(year: number, current: number) {
  if (year === current) return { color: 'var(--series-1)', width: 2.5 };
  if (year === current - 1) return { color: 'var(--series-2)', width: 2 };
  return { color: 'var(--muted)', width: 1.5, dash: year === 2020 ? '4 3' : undefined };
}

/** Sequential altitude bins (ft) → --seq-300 … --seq-700 (light→dark in light theme; dark→light in dark theme). */
export const ALT_BINS = [0, 10000, 20000, 30000, 36000];
export const altitudeBin = (ft: number) => ALT_BINS.reduce((b, lo, i) => (ft >= lo ? i : b), 0);
export const ALT_VARS = ['--seq-300', '--seq-400', '--seq-500', '--seq-600', '--seq-700'];
export const cssVar = (name: string, el: Element = document.documentElement) => getComputedStyle(el).getPropertyValue(name).trim();
```

Run: `npx vitest run tests/unit/chart-utils.test.ts` → PASS.

- [ ] **Step 3: Validate the palette against the real surfaces**

Load the `dataviz` skill (Skill tool) and run its validator from the skill's base directory:
```bash
V=<dataviz skill base dir>/scripts/validate_palette.js
node $V "#3987e5,#d95926,#199e70,#c98500,#d55181,#008300" --mode dark --surface "#10141d"
node $V "#2a78d6,#eb6834,#1baf7a,#eda100,#e87ba4,#008300" --mode light --surface "#fcfcfb"
```
Expected: no FAIL rows. If a dark slot FAILs contrast against `#10141d`, lighten `--surface` toward the reference `#1a1a19` (update `src/app.css`) and re-run. Light-mode contrast WARNs on slots 3–5 are covered by the mandatory direct labels and data tables (relief rule). Paste the summary lines into the commit body.

- [ ] **Step 4: Shared chrome components**

`src/lib/viz/Tooltip.svelte`
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { visible, x, y, containerWidth, children }: { visible: boolean; x: number; y: number; containerWidth: number; children: Snippet } = $props();
  const flip = $derived(x > containerWidth * 0.6);
</script>

{#if visible}
  <div class="tooltip" role="status" style:left="{x}px" style:top="{y}px" style:transform={flip ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)'}>
    {@render children()}
  </div>
{/if}

<style>
  .tooltip { position: absolute; pointer-events: none; z-index: 5; background: var(--surface-2); color: var(--ink); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 13px; line-height: 1.4; min-width: 150px; box-shadow: 0 6px 24px rgb(0 0 0 / 0.25); }
  .tooltip :global(.row) { display: flex; gap: 6px; align-items: center; }
  .tooltip :global(.sw) { width: 10px; height: 10px; border-radius: 2px; flex: none; }
  .tooltip :global(.v) { margin-left: auto; padding-left: 12px; font-variant-numeric: tabular-nums; }
</style>
```

`src/lib/viz/Legend.svelte`
```svelte
<script lang="ts">
  let { items }: { items: { label: string; color: string; dash?: string }[] } = $props();
</script>

<ul class="legend">
  {#each items as it (it.label)}
    <li><svg width="18" height="10" aria-hidden="true"><line x1="0" x2="18" y1="5" y2="5" stroke={it.color} stroke-width="3" stroke-dasharray={it.dash} stroke-linecap="round" /></svg>{it.label}</li>
  {/each}
</ul>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 4px 14px; list-style: none; margin: 0 0 6px; padding: 0; font-size: 13px; color: var(--ink-2); }
  li { display: flex; align-items: center; gap: 6px; }
</style>
```

`src/lib/viz/DataTable.svelte`
```svelte
<script lang="ts">
  import type { TableSpec } from './types';
  let { spec, maxRows = 400 }: { spec: TableSpec; maxRows?: number } = $props();
</script>

<details class="dt">
  <summary>Show data table</summary>
  <div class="scroll">
    <table>
      <caption class="visually-hidden">{spec.caption}</caption>
      <thead><tr>{#each spec.columns as c}<th scope="col">{c.label}</th>{/each}</tr></thead>
      <tbody>
        {#each spec.rows.slice(0, maxRows) as r}
          <tr>{#each spec.columns as c}<td>{c.format ? c.format(r[c.key]) : String(r[c.key] ?? '')}</td>{/each}</tr>
        {/each}
      </tbody>
    </table>
    {#if spec.rows.length > maxRows}<p class="more">Showing the first {maxRows} of {spec.rows.length} rows.</p>{/if}
  </div>
</details>

<style>
  .dt { margin-top: 6px; font-size: 13px; }
  summary { cursor: pointer; color: var(--ink-2); }
  .scroll { max-height: 260px; overflow: auto; margin-top: 6px; border: 1px solid var(--border); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
  th, td { padding: 4px 8px; text-align: left; border-bottom: 1px solid var(--grid); white-space: nowrap; }
  th { position: sticky; top: 0; background: var(--surface-2); }
</style>
```

`src/lib/viz/SourceLine.svelte`
```svelte
<script lang="ts">
  import { getSource } from '$lib/story/sources';
  import Cite from '$lib/ui/Cite.svelte';
  import FreshnessBadge from '$lib/ui/FreshnessBadge.svelte';
  import type { Freshness } from '$lib/data/live';
  import { fmtDate } from './chart-utils';
  let { ids, detail, freshness = null, dataDate = null, illustrative = false }: {
    ids: string[]; detail?: string; freshness?: Freshness | null; dataDate?: string | null; illustrative?: boolean;
  } = $props();
</script>

<p class="source">
  <span class="lbl">Source:</span>
  {#each ids as id, i (id)}{getSource(id).publisher} — {getSource(id).title}<Cite ids={[id]} />{i < ids.length - 1 ? '; ' : ''}{/each}
  {#if detail}<span> · {detail}</span>{/if}
  {#if dataDate}<span> · data to {fmtDate(dataDate)}</span>{/if}
  {#if freshness}<span> </span><FreshnessBadge {freshness} />{/if}
  {#if illustrative}<span class="ill"> · Illustrative (fictional flight FFS101)</span>{/if}
</p>

<style>
  .source { font-size: 12px; line-height: 1.5; color: var(--muted); margin: 8px 0 0; }
  .lbl { font-weight: 600; color: var(--ink-2); }
  .ill { font-style: italic; }
</style>
```

`src/lib/viz/Figure.svelte`
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Freshness } from '$lib/data/live';
  import type { TableSpec } from './types';
  import DataTable from './DataTable.svelte';
  import SourceLine from './SourceLine.svelte';
  let { title, subtitle, sources, detail, freshness = null, dataDate = null, illustrative = false, table, children }: {
    title: string; subtitle?: string; sources: string[]; detail?: string; freshness?: Freshness | null;
    dataDate?: string | null; illustrative?: boolean; table?: TableSpec; children: Snippet;
  } = $props();
</script>

<figure class="figure">
  <figcaption><h3>{title}</h3>{#if subtitle}<p>{subtitle}</p>{/if}</figcaption>
  <div class="plot">{@render children()}</div>
  {#if table}<DataTable spec={table} />{/if}
  <SourceLine ids={sources} {detail} {freshness} {dataDate} {illustrative} />
</figure>

<style>
  .figure { margin: 0; padding: 16px; height: 100%; display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
  h3 { font-family: var(--font-sans); font-size: 16px; font-weight: 650; margin: 0; }
  figcaption p { margin: 2px 0 8px; font-size: 13px; color: var(--ink-2); }
  .plot { position: relative; flex: 1; min-height: 0; }
</style>
```

`src/lib/viz/HeroNumber.svelte`
```svelte
<script lang="ts">
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { dur } from '$lib/scroll/motion';
  import { fmtInt } from './chart-utils';
  let { value, label, sub, format = fmtInt }: { value: number | null; label: string; sub?: string; format?: (n: number) => string } = $props();
  const t = new Tween(0, { duration: dur(1200), easing: cubicOut });
  $effect(() => { if (value !== null) t.target = value; });
</script>

<div class="hero">
  <div class="v" aria-live="polite">{value === null ? '—' : format(t.current)}</div>
  <div class="l">{label}</div>
  {#if sub}<div class="s">{sub}</div>{/if}
</div>

<style>
  .v { font-size: clamp(44px, 8vw, 96px); font-weight: 700; line-height: 1; letter-spacing: -0.02em; }
  .l { font-size: 16px; color: var(--ink-2); margin-top: 6px; }
  .s { font-size: 13px; color: var(--muted); margin-top: 2px; }
</style>
```

- [ ] **Step 5: Plot components**

`src/lib/viz/LineChart.svelte`
```svelte
<script lang="ts">
  import { scaleLinear, line as d3line, max, min } from 'd3';
  import type { LineSeries, XY } from './types';
  import Tooltip from './Tooltip.svelte';
  import Legend from './Legend.svelte';
  import { nearestIndex } from './chart-utils';

  let { series, label, height = 300, xDomain, yDomain, xTicks, yTicks = 5, xFormat = (x: number) => String(x),
    yFormat = (y: number) => y.toLocaleString('en-GB'), reveal = 1, markers = [], directLabels = true }: {
    series: LineSeries[]; label: string; height?: number; xDomain?: [number, number]; yDomain?: [number, number];
    xTicks?: number[]; yTicks?: number; xFormat?: (x: number) => string; yFormat?: (y: number) => string;
    reveal?: number; markers?: { x: number; label: string }[]; directLabels?: boolean;
  } = $props();

  const uid = $props.id();
  let width = $state(0);
  const m = { top: 12, right: 72, bottom: 26, left: 52 };
  const all = $derived(series.flatMap((s) => s.points));
  const xd = $derived(xDomain ?? ([min(all, (p) => p.x) ?? 0, max(all, (p) => p.x) ?? 1] as [number, number]));
  const yd = $derived(yDomain ?? ([0, (max(all, (p) => p.y) ?? 1) * 1.05] as [number, number]));
  const x = $derived(scaleLinear().domain(xd).range([m.left, Math.max(m.left + 1, width - m.right)]));
  const y = $derived(scaleLinear().domain(yd).nice().range([height - m.bottom, m.top]));
  const gen = $derived(d3line<XY>().x((p) => x(p.x)).y((p) => y(p.y)).defined((p) => Number.isFinite(p.y)));
  const clipW = $derived(m.left + (width - m.left - m.right) * Math.max(0, Math.min(1, reveal)) + 1);
  let hoverX: number | null = $state(null);
  const rows = $derived(
    hoverX === null ? [] : series.flatMap((s) => {
      const p = s.points[nearestIndex(s.points.map((q) => q.x), hoverX!)];
      return p ? [{ s, p }] : [];
    })
  );
  function onmove(e: PointerEvent) {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - r.left;
    hoverX = px < m.left || px > width - m.right ? null : x.invert(px);
  }
</script>

<div class="chart" bind:clientWidth={width}>
  {#if series.length > 1}<Legend items={series.map((s) => ({ label: s.label, color: s.color, dash: s.dash }))} />{/if}
  {#if width > 0}
    <svg {width} {height} role="img" aria-label={label} onpointermove={onmove} onpointerleave={() => (hoverX = null)}>
      <defs><clipPath id="clip-{uid}"><rect x="0" y="0" width={clipW} {height} /></clipPath></defs>
      {#each y.ticks(yTicks) as t}
        <line class="grid" x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} />
        <text class="tick" x={m.left - 6} y={y(t)} dy="0.32em" text-anchor="end">{yFormat(t)}</text>
      {/each}
      {#each xTicks ?? x.ticks(6) as t}<text class="tick" x={x(t)} y={height - 6} text-anchor="middle">{xFormat(t)}</text>{/each}
      <line class="axis" x1={m.left} x2={width - m.right} y1={y(y.domain()[0])} y2={y(y.domain()[0])} />
      {#each markers as mk}
        <line class="marker" x1={x(mk.x)} x2={x(mk.x)} y1={m.top} y2={height - m.bottom} />
        <text class="mtext" x={x(mk.x) + 4} y={m.top + 10}>{mk.label}</text>
      {/each}
      <g clip-path="url(#clip-{uid})">
        {#each series as s (s.id)}
          <path d={gen(s.points)} fill="none" stroke={s.color} stroke-width={s.width ?? 2} stroke-dasharray={s.dash} stroke-linejoin="round" stroke-linecap="round" />
        {/each}
      </g>
      {#if directLabels && series.length <= 4 && reveal >= 1}
        {#each series as s (s.id)}
          {@const last = s.points.at(-1)}
          {#if last}<text class="dl" x={x(last.x) + 6} y={y(last.y)} dy="0.32em">{s.label}</text>{/if}
        {/each}
      {/if}
      {#if rows.length}
        <line class="cross" x1={x(rows[0].p.x)} x2={x(rows[0].p.x)} y1={m.top} y2={height - m.bottom} />
        {#each rows as r (r.s.id)}<circle cx={x(r.p.x)} cy={y(r.p.y)} r="4" fill={r.s.color} stroke="var(--surface)" stroke-width="2" />{/each}
      {/if}
    </svg>
  {/if}
  <Tooltip visible={rows.length > 0} x={rows.length ? x(rows[0].p.x) : 0} y={m.top} containerWidth={width}>
    <strong>{rows.length ? xFormat(rows[0].p.x) : ''}</strong>
    {#each rows as r (r.s.id)}<div class="row"><span class="sw" style:background={r.s.color}></span>{r.s.label}<span class="v">{yFormat(r.p.y)}</span></div>{/each}
  </Tooltip>
</div>

<style>
  .chart { position: relative; width: 100%; }
  svg { display: block; overflow: visible; touch-action: pan-y; }
  .grid { stroke: var(--grid); stroke-width: 1; }
  .axis { stroke: var(--axis); }
  .tick, .mtext { fill: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }
  .dl { fill: var(--ink-2); font-size: 12px; }
  .marker { stroke: var(--axis); stroke-dasharray: 2 3; }
  .cross { stroke: var(--ink-2); stroke-width: 1; }
</style>
```

`src/lib/viz/StackedArea.svelte`
```svelte
<script lang="ts">
  import { scaleLinear, stack, area, curveMonotoneX, max } from 'd3';
  import Tooltip from './Tooltip.svelte';
  import Legend from './Legend.svelte';
  import { nearestIndex } from './chart-utils';

  type Row = { x: number; values: Record<string, number> };
  let { rows, keys, colors, labels, label, height = 300, xFormat = (x: number) => String(x), yFormat = (y: number) => y.toLocaleString('en-GB'), xTicks, reveal = 1 }: {
    rows: Row[]; keys: string[]; colors: Record<string, string>; labels: Record<string, string>; label: string;
    height?: number; xFormat?: (x: number) => string; yFormat?: (y: number) => string; xTicks?: number[]; reveal?: number;
  } = $props();

  const uid = $props.id();
  let width = $state(0);
  const m = { top: 10, right: 16, bottom: 26, left: 56 };
  const layers = $derived(stack<Row>().keys(keys).value((d, k) => d.values[k] ?? 0)(rows));
  const x = $derived(scaleLinear().domain([rows[0]?.x ?? 0, rows.at(-1)?.x ?? 1]).range([m.left, Math.max(m.left + 1, width - m.right)]));
  const y = $derived(scaleLinear().domain([0, (max(layers.at(-1) ?? [], (d) => d[1]) ?? 1) * 1.05]).nice().range([height - m.bottom, m.top]));
  const gen = $derived(area<[number, number] & { data: Row }>().x((d) => x(d.data.x)).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(curveMonotoneX));
  const clipW = $derived(m.left + (width - m.left - m.right) * Math.max(0, Math.min(1, reveal)) + 1);
  let hi: number | null = $state(null);
  function onmove(e: PointerEvent) {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - r.left;
    hi = px < m.left || px > width - m.right ? null : nearestIndex(rows.map((d) => d.x), x.invert(px));
  }
  const total = (r: Row) => keys.reduce((s, k) => s + (r.values[k] ?? 0), 0);
</script>

<div class="chart" bind:clientWidth={width}>
  <Legend items={keys.map((k) => ({ label: labels[k], color: colors[k] }))} />
  {#if width > 0}
    <svg {width} {height} role="img" aria-label={label} onpointermove={onmove} onpointerleave={() => (hi = null)}>
      <defs><clipPath id="clip-{uid}"><rect x="0" y="0" width={clipW} {height} /></clipPath></defs>
      {#each y.ticks(5) as t}
        <line class="grid" x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} />
        <text class="tick" x={m.left - 6} y={y(t)} dy="0.32em" text-anchor="end">{yFormat(t)}</text>
      {/each}
      {#each xTicks ?? x.ticks(6) as t}<text class="tick" x={x(t)} y={height - 6} text-anchor="middle">{xFormat(t)}</text>{/each}
      <g clip-path="url(#clip-{uid})">
        {#each layers as l (l.key)}<path d={gen(l as any)} fill={colors[l.key]} stroke="var(--surface)" stroke-width="1" />{/each}
      </g>
      {#if hi !== null}<line class="cross" x1={x(rows[hi].x)} x2={x(rows[hi].x)} y1={m.top} y2={height - m.bottom} />{/if}
    </svg>
  {/if}
  <Tooltip visible={hi !== null} x={hi !== null ? x(rows[hi].x) : 0} y={m.top} containerWidth={width}>
    {#if hi !== null}
      <strong>{xFormat(rows[hi].x)}</strong>
      {#each [...keys].reverse() as k (k)}<div class="row"><span class="sw" style:background={colors[k]}></span>{labels[k]}<span class="v">{yFormat(rows[hi].values[k] ?? 0)}</span></div>{/each}
      <div class="row"><strong>Total</strong><span class="v">{yFormat(total(rows[hi]))}</span></div>
    {/if}
  </Tooltip>
</div>

<style>
  .chart { position: relative; width: 100%; }
  svg { display: block; touch-action: pan-y; }
  .grid { stroke: var(--grid); }
  .tick { fill: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }
  .cross { stroke: var(--ink-2); }
</style>
```

`src/lib/viz/BarChart.svelte`
```svelte
<script lang="ts">
  import { scaleBand, scaleLinear, max } from 'd3';
  import type { Bar } from './types';
  import Tooltip from './Tooltip.svelte';
  import { roundedTopBar } from './chart-utils';

  let { bars, label, height = 260, refLine, yFormat = (v: number) => String(Math.round(v)), color = 'var(--series-1)', labelEvery = 1 }: {
    bars: Bar[]; label: string; height?: number; refLine?: { value: number; label: string };
    yFormat?: (v: number) => string; color?: string; labelEvery?: number;
  } = $props();

  let width = $state(0);
  const m = { top: 14, right: 12, bottom: 26, left: 40 };
  const x = $derived(scaleBand().domain(bars.map((b) => b.key)).range([m.left, Math.max(m.left + 1, width - m.right)]).padding(0.22));
  const y = $derived(scaleLinear().domain([0, Math.max(max(bars, (b) => b.value) ?? 1, refLine?.value ?? 0) * 1.1]).nice().range([height - m.bottom, m.top]));
  let hi: number | null = $state(null);
</script>

<div class="chart" bind:clientWidth={width}>
  {#if width > 0}
    <svg {width} {height} role="img" aria-label={label}>
      {#each y.ticks(4) as t}
        <line class="grid" x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} />
        <text class="tick" x={m.left - 6} y={y(t)} dy="0.32em" text-anchor="end">{yFormat(t)}</text>
      {/each}
      {#each bars as b, i (b.key)}
        <path d={roundedTopBar(x(b.key)!, y(b.value), x.bandwidth(), y(0) - y(b.value), 4)} fill={b.color ?? color} opacity={hi === null || hi === i ? 1 : 0.55} stroke={b.emphasis ? 'var(--ink)' : 'none'} stroke-width="1.5" />
        <rect role="presentation" x={x(b.key)! - (x.step() - x.bandwidth()) / 2} y={m.top} width={x.step()} height={height - m.top - m.bottom} fill="transparent" onpointerenter={() => (hi = i)} onpointerleave={() => (hi = null)} />
        {#if i % labelEvery === 0}<text class="tick" x={x(b.key)! + x.bandwidth() / 2} y={height - 6} text-anchor="middle">{b.label}</text>{/if}
      {/each}
      <line class="axis" x1={m.left} x2={width - m.right} y1={y(0)} y2={y(0)} />
      {#if refLine}
        <line class="ref" x1={m.left} x2={width - m.right} y1={y(refLine.value)} y2={y(refLine.value)} />
        <text class="reft" x={width - m.right} y={y(refLine.value) - 6} text-anchor="end">{refLine.label}</text>
      {/if}
    </svg>
  {/if}
  <Tooltip visible={hi !== null} x={hi !== null ? x(bars[hi].key)! + x.bandwidth() / 2 : 0} y={m.top} containerWidth={width}>
    {#if hi !== null}<strong>{bars[hi].label}</strong><div class="row">{yFormat(bars[hi].value)}</div>{/if}
  </Tooltip>
</div>

<style>
  .chart { position: relative; width: 100%; }
  svg { display: block; }
  .grid { stroke: var(--grid); }
  .axis { stroke: var(--axis); }
  .tick { fill: var(--muted); font-size: 11px; }
  .ref { stroke: var(--ink); stroke-width: 2; stroke-dasharray: 6 4; }
  .reft { fill: var(--ink); font-size: 12px; font-weight: 600; }
</style>
```

- [ ] **Step 6: Gallery page + e2e**

`src/routes/dev/charts/+page.svelte` — renders, inside `Figure`s with `sources={['D-eurocontrol']}`: a `LineChart` of the network traffic 2026/2025/2019 (from `ec.snapshot.bundles.network` via `startLoading()` in `onMount`, x = `dayOfYear`), a `StackedArea` of the network Y2D delay causes (`stackByName(delay.filter(s => s.chartType === 'category_evolution' && s.dateRange === 'Y2D'), [...CAUSES])`), a `BarChart` of `hourlyCounts(scenario().flights, 240, 600)` with `refLine={{ value: 28, label: 'Capacity 28/h' }}`, and a `HeroNumber` of `headline.flights`.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { ec, startLoading, bundle } from '$lib/data/liveState.svelte';
  import { dayOfYear, yearOfSeries, stackByName } from '$lib/data/series';
  import { CAUSES, CAUSE_COLOR, CAUSE_LABEL, yearStyle } from '$lib/viz/palette';
  import { doyLabel, fmtInt } from '$lib/viz/chart-utils';
  import { hourlyCounts } from '$lib/sim/demand';
  import { scenario, REGULATION } from '$lib/story/scenario';
  import { fmtHm } from '$lib/viz/chart-utils';
  import Figure from '$lib/viz/Figure.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import StackedArea from '$lib/viz/StackedArea.svelte';
  import BarChart from '$lib/viz/BarChart.svelte';
  import HeroNumber from '$lib/viz/HeroNumber.svelte';

  onMount(startLoading);
  const net = $derived(bundle('network'));
  const traffic = $derived(
    (net?.traffic ?? []).filter((s) => s.chartType === 'daily_evolution').map((s) => {
      const yr = yearOfSeries(s) ?? 0;
      return { id: s.name, label: s.name, ...yearStyle(yr, 2026), points: s.points.map((p) => ({ x: dayOfYear(p.date), y: p.value })) };
    })
  );
  const causes = $derived(
    stackByName((net?.delay ?? []).filter((s) => s.chartType === 'category_evolution' && s.dateRange === 'Y2D'), [...CAUSES])
      .map((r) => ({ x: dayOfYear(r.date), values: r.values }))
  );
  const demand = hourlyCounts(scenario().flights, 240, 600).map((b) => ({ key: String(b.start), label: fmtHm(b.start), value: b.count }));
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>
<main class="gallery">
  <Figure title="Flights per day" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}>
    <HeroNumber value={net?.headline.flights ?? null} label="flights yesterday" />
  </Figure>
  <Figure title="European network traffic, 7-day average" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}>
    <LineChart series={traffic} label="Daily flights by year" xFormat={doyLabel} yFormat={fmtInt} />
  </Figure>
  <Figure title="ATFM delay by cause, year to date" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}>
    <StackedArea rows={causes} keys={[...CAUSES]} colors={CAUSE_COLOR} labels={CAUSE_LABEL} label="Delay minutes by cause" xFormat={doyLabel} yFormat={fmtInt} />
  </Figure>
  <Figure title="Demand vs capacity" sources={['S7']} illustrative>
    <BarChart bars={demand} label="Flights per hour" refLine={{ value: REGULATION.rate, label: `Capacity ${REGULATION.rate}/h` }} />
  </Figure>
</main>

<style>
  .gallery { display: grid; gap: 24px; padding: 24px 16px; max-width: 1100px; margin: 0 auto; }
</style>
```

`tests/e2e/charts.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test('chart gallery renders from the snapshot with hover tooltips and tables', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dev/charts/');
  const line = page.getByRole('img', { name: 'Daily flights by year' });
  await expect(line).toBeVisible();
  const box = (await line.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await expect(page.getByRole('status').first()).toBeVisible();
  await expect(page.getByText('◌ Snapshot').first()).toBeVisible();
  await page.getByText('Show data table').first().click();
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'screenshots/charts.png', fullPage: true });
});
```

Run: `npm run check && npm run test:e2e -- tests/e2e/charts.spec.ts`
Expected: PASS on desktop and mobile. Open `screenshots/charts.png` with the Read tool and check for label collisions, clipped direct labels and legibility in dark mode; fix before committing.

- [ ] **Step 7: Commit**

```bash
git add src/lib/viz src/routes/dev/charts tests/unit/chart-utils.test.ts tests/e2e/charts.spec.ts src/app.css
git commit -m "feat: accessible chart primitives with tooltips, tables and source lines"
```

---

### Task 12: Maps — base map, live sky canvas, route map

**Files:**
- Modify: `src/lib/geo/projection.ts` (add `lerpProjection`), `src/lib/geo/route.ts` (add `sliceRoute`)
- Create: `src/lib/viz/BaseMap.svelte`, `src/lib/viz/SkyCanvas.svelte`, `src/lib/viz/RouteMap.svelte`, `src/lib/story/airspace.ts`
- Create: `src/routes/dev/maps/+page.svelte`
- Test: `tests/unit/map-helpers.test.ts`, `tests/e2e/maps.spec.ts`

**Interfaces:**
- Consumes: `makeProjection`, `EUROPE_FRAME`, `ROUTE_FRAME`, `loadCountries`, `pointAtKm`, `routeLengthKm`, `Span`, `AnspKey`, `ANSP_LABEL`, `ANSP_COLOR`, `Aircraft`, `ALT_BINS`, `ALT_VARS`, `cssVar`, `altitudeBin`.
- Produces:
  - `lerpProjection(width, height, from: GeoJSON.GeoJsonObject, to: GeoJSON.GeoJsonObject, t: number): GeoProjection`
  - `sliceRoute(route: LonLat[], fromKm: number, toKm: number): LonLat[]`
  - `airspace.ts`: `MILITARY_AREAS: GeoJSON.Feature<GeoJSON.Polygon, { name: string }>[]` (illustrative), `REGULATED_SECTOR: GeoJSON.Feature<GeoJSON.Polygon, { name: string }>` (illustrative Reims sector group)
  - `BaseMap.svelte` props `{ label: string; frame?; frameTo?; t?: number; highlight?: string[]; children?: Snippet<[{ projection; path; width; height }]>; overlay?: Snippet<[{ projection; width; height }]> }`
  - `SkyCanvas.svelte` props `{ aircraft: Aircraft[]; projection: GeoProjection; width: number; height: number; dim?: number }`
  - `RouteMap.svelte` props `{ projection; path; routes: { id: string; coords: LonLat[]; spans?: Span<AnspKey>[]; style: 'active' | 'ghost' | 'alt' }[]; progress?: number; showAnsp?: boolean; military?: boolean; regulated?: boolean; showPlane?: boolean }` (renders inside BaseMap's SVG)

- [ ] **Step 1: Failing helper tests**

`tests/unit/map-helpers.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { lerpProjection, makeProjection, EUROPE_FRAME, ROUTE_FRAME } from '$lib/geo/projection';
import { sliceRoute, routeLengthKm, type LonLat } from '$lib/geo/route';
import { MILITARY_AREAS, REGULATED_SECTOR } from '$lib/story/airspace';
import { geoArea } from 'd3-geo';

describe('lerpProjection', () => {
  it('matches the endpoints', () => {
    const a = makeProjection(800, 600, EUROPE_FRAME), b = makeProjection(800, 600, ROUTE_FRAME);
    expect(lerpProjection(800, 600, EUROPE_FRAME, ROUTE_FRAME, 0).scale()).toBeCloseTo(a.scale(), 6);
    expect(lerpProjection(800, 600, EUROPE_FRAME, ROUTE_FRAME, 1).scale()).toBeCloseTo(b.scale(), 6);
    const mid = lerpProjection(800, 600, EUROPE_FRAME, ROUTE_FRAME, 0.5).scale();
    expect(mid).toBeGreaterThan(a.scale());
    expect(mid).toBeLessThan(b.scale());
  });
});

describe('sliceRoute', () => {
  const r: LonLat[] = [[0, 0], [1, 0], [2, 0]];
  it('returns a sub-line with interpolated ends and inner vertices', () => {
    const L = routeLengthKm(r);
    const s = sliceRoute(r, L * 0.25, L * 0.75);
    expect(s[0][0]).toBeCloseTo(0.5, 4);
    expect(s[1]).toEqual([1, 0]);
    expect(s.at(-1)![0]).toBeCloseTo(1.5, 4);
  });
});

describe('airspace features', () => {
  it('are small, correctly wound polygons (area < 1% of sphere)', () => {
    for (const f of [...MILITARY_AREAS, REGULATED_SECTOR]) expect(geoArea(f)).toBeLessThan(0.01 * 4 * Math.PI);
  });
});
```

Run: `npx vitest run tests/unit/map-helpers.test.ts` → FAIL.

- [ ] **Step 2: Implement helpers and airspace data**

Append to `src/lib/geo/projection.ts`:
```ts
export function lerpProjection(width: number, height: number, from: GeoJSON.GeoJsonObject, to: GeoJSON.GeoJsonObject, t: number): GeoProjection {
  const a = makeProjection(width, height, from), b = makeProjection(width, height, to);
  const k = Math.max(0, Math.min(1, t));
  // log-scale interpolation gives a perceptually even zoom
  const scale = Math.exp(Math.log(a.scale()) * (1 - k) + Math.log(b.scale()) * k);
  // interpolate the geographic point shown at the viewport centre
  const ca = a.invert!([width / 2, height / 2])!, cb = b.invert!([width / 2, height / 2])!;
  const c: [number, number] = [ca[0] * (1 - k) + cb[0] * k, ca[1] * (1 - k) + cb[1] * k];
  const p = geoConicConformal().parallels([40, 58]).rotate([-10, 0]).scale(scale).translate([0, 0]);
  const [cx, cy] = p(c)!;
  return p.translate([width / 2 - cx, height / 2 - cy]);
}
```

Append to `src/lib/geo/route.ts`:
```ts
export function sliceRoute(route: LonLat[], fromKm: number, toKm: number): LonLat[] {
  const cum = cumulativeKm(route);
  const out: LonLat[] = [pointAtKm(route, fromKm).lonlat];
  for (let i = 1; i < route.length - 1; i++) if (cum[i] > fromKm && cum[i] < toKm) out.push(route[i]);
  out.push(pointAtKm(route, toKm).lonlat);
  return out;
}
```

`src/lib/story/airspace.ts` (illustrative shapes — research §2: military zones ≈ half of Belgian airspace [S28]; regulated sector group near Reims, research §4e)
```ts
type Poly = GeoJSON.Feature<GeoJSON.Polygon, { name: string }>;
/** Rings listed north → east → south → west so d3-geo treats them as small (clockwise) polygons. */
const box = (name: string, w: number, s: number, e: number, n: number): Poly => ({
  type: 'Feature', properties: { name },
  geometry: { type: 'Polygon', coordinates: [[[w, s], [w, n], [e, n], [e, s], [w, s]]] }
});

export const MILITARY_AREAS: Poly[] = [
  box('Training area (illustrative)', 4.6, 49.9, 5.9, 50.5),
  box('Training area (illustrative)', 5.6, 48.6, 6.9, 49.3),
  box('Exercise area (illustrative)', 7.3, 49.4, 8.4, 50.1)
];

export const REGULATED_SECTOR: Poly = box('Reims ACC sector group (illustrative)', 3.6, 47.9, 7.2, 49.7);
```

Run: `npx vitest run tests/unit/map-helpers.test.ts` → PASS. (If `lerpProjection` mid-scale assertion fails, that indicates the log interpolation is inverted—fix the formula, do not loosen the test.)

- [ ] **Step 3: BaseMap**

`src/lib/viz/BaseMap.svelte`
```svelte
<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { geoPath, geoGraticule10, type GeoProjection, type GeoPath } from 'd3-geo';
  import { loadCountries, type CountryFC } from '$lib/geo/countries';
  import { EUROPE_FRAME, lerpProjection, makeProjection } from '$lib/geo/projection';

  type Ctx = { projection: GeoProjection; path: GeoPath; width: number; height: number };
  let { label, frame = EUROPE_FRAME, frameTo, t = 0, highlight = [], children, overlay }: {
    label: string; frame?: GeoJSON.GeoJsonObject; frameTo?: GeoJSON.GeoJsonObject; t?: number; highlight?: string[];
    children?: Snippet<[Ctx]>; overlay?: Snippet<[Ctx]>;
  } = $props();

  let width = $state(0), height = $state(0);
  let countries: CountryFC | null = $state(null);
  onMount(() => { loadCountries().then((fc) => (countries = fc)); });
  const projection = $derived(frameTo ? lerpProjection(width, height, frame, frameTo, t) : makeProjection(width, height, frame));
  const path = $derived(geoPath(projection));
  const ctx = $derived({ projection, path, width, height });
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
  {#if width > 0 && height > 0}
    <svg {width} {height} role="img" aria-label={label}>
      <path class="graticule" d={path(geoGraticule10())} />
      {#if countries}
        {#each countries.features as f (f.id ?? f.properties.name)}
          <path class="country" class:hl={highlight.includes(String(f.id))} d={path(f)} />
        {/each}
      {/if}
      {@render children?.(ctx)}
    </svg>
    {@render overlay?.(ctx)}
  {/if}
</div>

<style>
  .map { position: relative; width: 100%; height: 100%; }
  svg { display: block; }
  .graticule { fill: none; stroke: var(--grid); stroke-width: 0.5; }
  .country { fill: var(--surface-2); stroke: var(--axis); stroke-width: 0.6; }
  .country.hl { fill: color-mix(in srgb, var(--accent) 14%, var(--surface-2)); }
</style>
```

- [ ] **Step 4: SkyCanvas (live aircraft)**

`src/lib/viz/SkyCanvas.svelte`
```svelte
<script lang="ts">
  import { quadtree } from 'd3';
  import type { GeoProjection } from 'd3-geo';
  import type { Aircraft } from '$lib/data/sky';
  import { ALT_VARS, altitudeBin, cssVar } from './palette';
  import Tooltip from './Tooltip.svelte';
  import { fmtInt } from './chart-utils';

  let { aircraft, projection, width, height, dim = 0 }: { aircraft: Aircraft[]; projection: GeoProjection; width: number; height: number; dim?: number } = $props();
  let canvas: HTMLCanvasElement;
  let hover: { a: Aircraft; x: number; y: number } | null = $state(null);

  const pts = $derived(aircraft.flatMap((a) => { const p = projection([a.lon, a.lat]); return p ? [{ a, x: p[0], y: p[1] }] : []; }));
  const qt = $derived(quadtree<{ a: Aircraft; x: number; y: number }>().x((d) => d.x).y((d) => d.y).addAll(pts));

  $effect(() => {
    if (!canvas || !width || !height) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const colors = ALT_VARS.map((v) => cssVar(v));
    ctx.globalAlpha = 1 - dim * 0.8;
    for (const { a, x, y } of pts) {
      ctx.fillStyle = colors[altitudeBin(a.alt)];
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  });

  function onmove(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const f = qt.find(e.clientX - r.left, e.clientY - r.top, 12);
    hover = f ?? null;
  }
</script>

<canvas bind:this={canvas} style:width="{width}px" style:height="{height}px" onpointermove={onmove} onpointerleave={() => (hover = null)} aria-hidden="true"></canvas>
<Tooltip visible={!!hover} x={hover?.x ?? 0} y={hover?.y ?? 0} containerWidth={width}>
  {#if hover}<strong>{hover.a.cs || hover.a.id}</strong><div class="row">FL{Math.round(hover.a.alt / 100)}<span class="v">{fmtInt(hover.a.gs)} kt</span></div>{/if}
</Tooltip>

<style>
  canvas { position: absolute; inset: 0; touch-action: pan-y; }
</style>
```

- [ ] **Step 5: RouteMap layer**

`src/lib/viz/RouteMap.svelte`
```svelte
<script lang="ts">
  import type { GeoProjection, GeoPath } from 'd3-geo';
  import { pointAtKm, routeLengthKm, sliceRoute, type LonLat, type Span } from '$lib/geo/route';
  import { ANSP_LABEL, type AnspKey } from '$lib/story/flight';
  import { ANSP_COLOR } from './palette';
  import { MILITARY_AREAS, REGULATED_SECTOR } from '$lib/story/airspace';

  type R = { id: string; coords: LonLat[]; spans?: Span<AnspKey>[]; style: 'active' | 'ghost' | 'alt' };
  let { projection, path, routes, progress = 1, showAnsp = false, military = false, regulated = false, showPlane = true }: {
    projection: GeoProjection; path: GeoPath; routes: R[]; progress?: number; showAnsp?: boolean; military?: boolean; regulated?: boolean; showPlane?: boolean;
  } = $props();

  const line = (c: LonLat[]) => path({ type: 'LineString', coordinates: c }) ?? '';
  const active = $derived(routes.find((r) => r.style === 'active'));
  const L = $derived(active ? routeLengthKm(active.coords) : 0);
  const plane = $derived.by(() => {
    if (!active) return null;
    const d = Math.max(0.5, Math.min(L - 0.5, progress * L));
    const p = projection(pointAtKm(active.coords, d).lonlat);
    const q = projection(pointAtKm(active.coords, Math.min(L, d + 3)).lonlat);
    if (!p || !q) return null;
    return { x: p[0], y: p[1], angle: (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI };
  });
</script>

{#if military}
  {#each MILITARY_AREAS as f, i (i)}<path class="mil" d={path(f)} />{/each}
{/if}
{#if regulated}<path class="reg" d={path(REGULATED_SECTOR)} />{/if}

{#each routes as r (r.id)}
  {#if r.style !== 'active'}
    <path class="route {r.style}" d={line(r.coords)} />
  {:else if showAnsp && r.spans}
    {#each r.spans as s (s.id + s.startKm)}
      {#if s.startKm < progress * L}
        <path class="route seg" style:stroke={ANSP_COLOR[s.id]} d={line(sliceRoute(r.coords, s.startKm, Math.min(s.endKm, progress * L)))} />
      {/if}
      {@const mid = projection(pointAtKm(r.coords, (s.startKm + s.endKm) / 2).lonlat)}
      {#if mid && s.startKm < progress * L}<text class="lbl" x={mid[0] + 10} y={mid[1]}>{ANSP_LABEL[s.id]}</text>{/if}
    {/each}
  {:else}
    <path class="route active" d={line(sliceRoute(r.coords, 0, Math.max(1, progress * L)))} />
  {/if}
{/each}

{#if showPlane && plane}
  <g transform="translate({plane.x},{plane.y}) rotate({plane.angle + 90})" class="plane" aria-hidden="true">
    <path d="M0,-11 L2,-4 L10,1 L10,3 L2,1 L1.5,7 L4,9 L4,10.5 L0,9.5 L-4,10.5 L-4,9 L-1.5,7 L-2,1 L-10,3 L-10,1 L-2,-4 Z" />
  </g>
{/if}

<style>
  .route { fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .route.active { stroke: var(--ink); stroke-width: 2.5; }
  .route.seg { stroke-width: 3.5; }
  .route.ghost { stroke: var(--muted); stroke-width: 1.5; stroke-dasharray: 4 4; }
  .route.alt { stroke: var(--series-4); stroke-width: 2; stroke-dasharray: 6 4; }
  .mil { fill: color-mix(in srgb, var(--status-serious) 18%, transparent); stroke: var(--status-serious); stroke-dasharray: 3 3; }
  .reg { fill: color-mix(in srgb, var(--status-critical) 22%, transparent); stroke: var(--status-critical); stroke-width: 1.5; }
  .lbl { fill: var(--ink); font-size: 12px; paint-order: stroke; stroke: var(--bg); stroke-width: 3px; }
  .plane path { fill: var(--ink); stroke: var(--bg); stroke-width: 1; }
</style>
```

- [ ] **Step 6: Dev page + e2e**

`src/routes/dev/maps/+page.svelte`
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { startLoading, sky } from '$lib/data/liveState.svelte';
  import { loadCountries, type CountryFC } from '$lib/geo/countries';
  import { ROUTE_FRAME, EUROPE_FRAME } from '$lib/geo/projection';
  import { ROUTE_PLANNED, ROUTE_REROUTED, anspSpans } from '$lib/story/flight';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import SkyCanvas from '$lib/viz/SkyCanvas.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';

  let fc: CountryFC | null = $state(null);
  let progress = $state(0.6);
  onMount(() => { startLoading(); loadCountries().then((c) => (fc = c)); });
  const spans = $derived(fc ? anspSpans(ROUTE_REROUTED, fc) : []);
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>
<div class="box">
  <BaseMap label="Aircraft over Europe" frame={EUROPE_FRAME}>
    {#snippet overlay({ projection, width, height })}
      {#if sky.snap}<SkyCanvas aircraft={sky.snap.aircraft} {projection} {width} {height} />{/if}
    {/snippet}
  </BaseMap>
</div>
<input type="range" min="0" max="1" step="0.01" bind:value={progress} aria-label="Progress" />
<div class="box">
  <BaseMap label="FFS101 route" frame={ROUTE_FRAME} highlight={['056', '442', '250', '276', '756', '380']}>
    {#snippet children({ projection, path })}
      <RouteMap {projection} {path} {progress} showAnsp military regulated routes={[
        { id: 'planned', coords: ROUTE_PLANNED, style: 'ghost' },
        { id: 'flown', coords: ROUTE_REROUTED, spans, style: 'active' }
      ]} />
    {/snippet}
  </BaseMap>
</div>

<style>
  .box { height: 70vh; position: relative; }
</style>
```

`tests/e2e/maps.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test('maps render countries, aircraft and the ANSP-coloured route', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dev/maps/');
  await expect(page.locator('path.country').first()).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('text.lbl', { hasText: 'MUAC' })).toBeVisible();
  await expect(page.locator('path.route.ghost')).toHaveCount(1);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'screenshots/maps.png', fullPage: true });
});
```

Run: `npm run check && npm run test:e2e -- tests/e2e/maps.spec.ts` → PASS. Read `screenshots/maps.png`; check the label positions don't collide with the plane, the regulated sector is visible but not overpowering, and that phones show the full route.

- [ ] **Step 7: Commit**

```bash
git add src/lib/geo src/lib/viz/BaseMap.svelte src/lib/viz/SkyCanvas.svelte src/lib/viz/RouteMap.svelte src/lib/story/airspace.ts src/routes/dev/maps tests/unit/map-helpers.test.ts tests/e2e/maps.spec.ts
git commit -m "feat: Europe base map, live sky canvas and scroll-scrubbed route map"
```

---

### Task 13: Story-specific visualizations

**Files:**
- Create: `src/lib/viz/FplAnatomy.svelte`, `src/lib/viz/CasaQueue.svelte`, `src/lib/viz/AcdmTimeline.svelte`, `src/lib/viz/ProfileChart.svelte`, `src/lib/viz/ChargesBar.svelte`, `src/lib/viz/StakeholderMatrix.svelte`
- Create: `src/lib/story/stakeholders.ts`
- Modify: `src/routes/dev/charts/+page.svelte` (add each new component)
- Test: `tests/unit/stakeholders.test.ts`, extend `tests/e2e/charts.spec.ts`

**Interfaces:**
- Consumes: `HERO_FPL`, `buildFpl`, `heroFplFields` (Task 7); `scenario`, `REGULATION`, `HERO_CASA` (Task 8); `allocateSlots`, `SLOT_TOLERANCE` (Task 8); `ACDM`, `TURNAROUND`, `EVENTS`, `Actor`, `Phase`, `altitudeAtKm`, `AnspKey`, `ANSP_LABEL` (Task 7); `routeCharges`, `ZoneCharge` (Task 9); `ZONES`; palette + chart-utils (Task 11).
- Produces:
  - `stakeholders.ts`: `ACTORS: { id: Actor; label: string; role: string; sources: string[] }[]`, `PHASES: { id: Phase; label: string }[]`, `matrix(events: FlightEvent[]): { actor: Actor; phase: Phase; events: FlightEvent[] }[]`
  - `FplAnatomy.svelte` props `{ active: string[]; stage: 'message' | 'validate' | 'distribute' }` (`['all']` highlights every item)
  - `CasaQueue.svelte` props `{ stage: 'demand' | 'regulation' | 'queue' | 'hero' | 'explore' }` (owns its own rate slider in `explore`)
  - `AcdmTimeline.svelte` props `{ stage: 'milestones' | 'turnaround' | 'window' }`
  - `ProfileChart.svelte` props `{ route: LonLat[]; spans: Span<AnspKey>[]; progress: number }`
  - `ChargesBar.svelte` props `{ planned: ZoneCharge[]; rerouted: ZoneCharge[]; mode: 'distance' | 'cost' | 'compare' }`
  - `StakeholderMatrix.svelte` props `{ upTo: Phase }` (highlights phases up to and including `upTo`)

- [ ] **Step 1: Stakeholders data + failing test**

`src/lib/story/stakeholders.ts`
```ts
import type { Actor, Phase, FlightEvent } from './flight';

export const PHASES: { id: Phase; label: string }[] = [
  { id: 'strategic', label: 'Strategic' }, { id: 'pretactical', label: 'Pre-tactical' }, { id: 'filing', label: 'Filing' },
  { id: 'tactical', label: 'Tactical' }, { id: 'ground', label: 'Ground' }, { id: 'departure', label: 'Departure' },
  { id: 'enroute', label: 'En route' }, { id: 'arrival', label: 'Arrival' }, { id: 'postops', label: 'Post-ops' }
];

/** Roles from research §11. */
export const ACTORS: { id: Actor; label: string; role: string; sources: string[] }[] = [
  { id: 'airline', label: 'Airline (OCC & dispatch)', role: 'Plans the schedule, requests slots, files and updates the flight plan, answers SAM/RRP, pays route charges.', sources: ['S7', 'S9'] },
  { id: 'slot-coordinator', label: 'Slot coordinators', role: 'BSC (Brussels) and Assoclearance (Rome) allocate airport slots under EU Regulation 95/93.', sources: ['S21', 'S26', 'S27'] },
  { id: 'network-manager', label: 'Network Manager (EUROCONTROL)', role: 'Designs the route network, plans and manages flow, issues ATFM slots.', sources: ['S7', 'S20'] },
  { id: 'ifps', label: 'IFPS', role: 'Validates and distributes every flight plan from Brussels.', sources: ['S9', 'S10'] },
  { id: 'fmp', label: 'Flow Management Positions', role: 'Each ANSP’s flow unit; agrees regulations with the Network Manager.', sources: ['S7', 'S8'] },
  { id: 'military', label: 'Military (AMC)', role: 'Books reserved airspace day by day through the Airspace Use Plan.', sources: ['S19', 'S28'] },
  { id: 'airport', label: 'Airport operators', role: 'Brussels Airport and Aeroporti di Roma run the infrastructure and the A-CDM platform.', sources: ['S13', 'S16'] },
  { id: 'ground-handler', label: 'Ground handlers', role: 'Turn the aircraft around and keep the TOBT honest.', sources: ['S13'] },
  { id: 'passengers', label: 'Passengers', role: 'Board on time — and feel every minute of delay.', sources: ['S1'] },
  { id: 'pilots', label: 'Pilots', role: 'Brief, request start-up, fly the clearance and the slot.', sources: ['S7'] },
  { id: 'ansp', label: 'Air navigation service providers', role: 'skeyes, MUAC, DSNA/DFS, skyguide and ENAV control the flight sector by sector.', sources: ['S5', 'S28', 'S30'] },
  { id: 'crco', label: 'CRCO (EUROCONTROL)', role: 'Bills the en-route charges for every state crossed.', sources: ['S32'] },
  { id: 'prc', label: 'Performance Review Commission', role: 'Independently reviews how Europe’s ATM system performed.', sources: ['S37'] }
];

export function matrix(events: FlightEvent[]) {
  return ACTORS.flatMap((a) =>
    PHASES.map((p) => ({ actor: a.id, phase: p.id, events: events.filter((e) => e.actor === a.id && e.phase === p.id) }))
  ).filter((c) => c.events.length > 0);
}
```

`tests/unit/stakeholders.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { ACTORS, PHASES, matrix } from '$lib/story/stakeholders';
import { EVENTS } from '$lib/story/flight';

describe('stakeholder matrix', () => {
  it('every event actor and phase is known', () => {
    const actors = new Set(ACTORS.map((a) => a.id)), phases = new Set(PHASES.map((p) => p.id));
    for (const e of EVENTS) { expect(actors.has(e.actor), e.id).toBe(true); expect(phases.has(e.phase), e.id).toBe(true); }
  });
  it('accounts for every event exactly once', () => {
    expect(matrix(EVENTS).reduce((s, c) => s + c.events.length, 0)).toBe(EVENTS.length);
  });
  it('every actor appears at least once in the hero timeline', () => {
    const seen = new Set(EVENTS.map((e) => e.actor));
    for (const a of ACTORS) expect(seen.has(a.id), a.id).toBe(true);
  });
});
```

Run: `npx vitest run tests/unit/stakeholders.test.ts` → PASS (the Task 7 timeline covers all 13 actors; if one is missing, add a cited event for it in `EVENTS` rather than dropping the actor).

- [ ] **Step 2: FplAnatomy**

`src/lib/viz/FplAnatomy.svelte`
```svelte
<script lang="ts">
  import { HERO_FPL } from '$lib/story/fpl';
  import { ANSP_LABEL } from '$lib/story/flight';
  let { active, stage }: { active: string[]; stage: 'message' | 'validate' | 'distribute' } = $props();

  const chunks = (() => {
    const out: { text: string; item: string | null; label?: string }[] = [];
    let i = 0;
    for (const s of HERO_FPL.spans) {
      if (s.start > i) out.push({ text: HERO_FPL.text.slice(i, s.start), item: null });
      out.push({ text: HERO_FPL.text.slice(s.start, s.end), item: s.item, label: s.label });
      i = s.end;
    }
    out.push({ text: HERO_FPL.text.slice(i), item: null });
    return out;
  })();
  const CHECKS = ['Syntax & format', 'Aerodromes & aircraft type', 'Route vs RAD restrictions', 'Airspace availability (AUP)', '4D profile calculated'];
  const UNITS = ['Brussels TWR/APP', ...['MUAC', 'DSNA', 'Skyguide', 'ENAV'].map((k) => ANSP_LABEL[k as keyof typeof ANSP_LABEL]), 'ETFMS (flow)', 'Airline (ACK)'];
</script>

<div class="fpl">
  <pre aria-label="ICAO flight plan for FFS101">{#each chunks as c}{#if c.item}<mark class:on={active.includes(c.item) || active.includes('all')} title="Item {c.item}: {c.label}">{c.text}</mark>{:else}{c.text}{/if}{/each}</pre>
  {#each HERO_FPL.spans.filter((x) => active.includes(x.item)) as s (s.item)}
    <p class="item"><strong>Item {s.item}</strong> — {s.label}</p>
  {/each}
  {#if stage !== 'message'}
    <ol class="checks">
      {#each CHECKS as c, i}<li style:animation-delay="{i * 180}ms">✓ {c}</li>{/each}
      <li class="ack" style:animation-delay="{CHECKS.length * 180}ms">ACK — accepted automatically</li>
    </ol>
  {/if}
  {#if stage === 'distribute'}
    <svg class="fan" viewBox="0 0 400 220" role="img" aria-label="IFPS distributes the flight plan to every unit on the route">
      <circle cx="40" cy="110" r="22" class="hub" /><text x="40" y="114" text-anchor="middle" class="hubt">IFPS</text>
      {#each UNITS as u, i}
        {@const y = 20 + i * (180 / (UNITS.length - 1))}
        <path d="M62,110 C180,110 180,{y} 250,{y}" class="edge" style:animation-delay="{i * 120}ms" />
        <circle cx="254" cy={y} r="4" class="node" /><text x="264" y={y + 4} class="nt">{u}</text>
      {/each}
    </svg>
  {/if}
</div>

<style>
  .fpl { display: flex; flex-direction: column; gap: 12px; height: 100%; justify-content: center; padding: 16px; }
  pre { font-size: clamp(12px, 1.5vw, 16px); line-height: 1.7; white-space: pre-wrap; word-break: break-all; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin: 0; }
  mark { background: transparent; color: var(--ink-2); border-radius: 3px; transition: background 250ms, color 250ms; }
  mark.on { background: color-mix(in srgb, var(--accent) 35%, transparent); color: var(--ink); }
  .item { margin: 0; font-size: 15px; }
  .checks { list-style: none; padding: 0; margin: 0; font-size: 14px; }
  .checks li { opacity: 0; animation: in 300ms forwards; color: var(--ink-2); }
  .checks .ack { color: var(--status-good); font-weight: 700; }
  @keyframes in { to { opacity: 1; } }
  .fan { width: 100%; max-height: 260px; }
  .hub { fill: var(--accent); } .hubt { fill: #fff; font-size: 11px; font-weight: 700; }
  .edge { fill: none; stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 300; stroke-dashoffset: 300; animation: draw 700ms forwards; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  .node { fill: var(--ink); } .nt { fill: var(--ink-2); font-size: 11px; }
</style>
```

- [ ] **Step 3: CasaQueue (demand, regulation, conveyor belt, interactive rate)**

`src/lib/viz/CasaQueue.svelte`
```svelte
<script lang="ts">
  import { scaleLinear } from 'd3';
  import { scenario, REGULATION, HERO_CASA } from '$lib/story/scenario';
  import { hourlyCounts } from '$lib/sim/demand';
  import { fmtHm, fmtInt } from './chart-utils';
  import BarChart from './BarChart.svelte';
  import Tooltip from './Tooltip.svelte';

  let { stage }: { stage: 'demand' | 'regulation' | 'queue' | 'hero' | 'explore' } = $props();
  let rate = $state(REGULATION.rate);
  $effect(() => { if (stage !== 'explore') rate = REGULATION.rate; });
  const sc = $derived(scenario(rate));
  const bars = $derived(hourlyCounts(sc.flights, 240, 600).map((b) => ({ key: String(b.start), label: fmtHm(b.start), value: b.count, color: b.start >= REGULATION.start && b.start < REGULATION.end && b.count > rate ? 'var(--status-critical)' : 'var(--series-1)' })));
  const regulated = $derived(sc.allocations.filter((a) => a.regulated));
  const totalDelay = $derived(regulated.reduce((s, a) => s + a.delay, 0));
  let width = $state(0);
  const h = 170, m = { l: 12, r: 12 };
  const x = $derived(scaleLinear().domain([REGULATION.start - 10, REGULATION.end + 60]).range([m.l, Math.max(m.l + 1, width - m.r)]));
  let hi: (typeof regulated)[number] | null = $state(null);
</script>

<div class="casa">
  <BarChart {bars} label="Flights wanting to enter the sector, per hour" refLine={stage === 'demand' ? undefined : { value: rate, label: `Capacity ${rate}/h` }} height={200} />
  {#if stage !== 'demand' && stage !== 'regulation'}
    <div class="belt" bind:clientWidth={width}>
      {#if width}
        <svg {width} height={h} role="img" aria-label="Each flight's wanted versus allocated entry time">
          <text class="rl" x={m.l} y="18">Wanted (ETO)</text>
          <text class="rl" x={m.l} y={h - 52}>Given slot</text>
          {#each regulated as a (a.id)}
            {@const hero = a.id === HERO_CASA.id}
            <line x1={x(a.eto)} y1="30" x2={x(a.entry)} y2={h - 64} class="link" class:hero opacity={stage === 'hero' && !hero ? 0.25 : 0.7} />
            <circle cx={x(a.eto)} cy="30" r={hero ? 6 : 3} class="dot" class:hero />
            <circle cx={x(a.entry)} cy={h - 64} r={hero ? 6 : 3} class="dot" class:hero role="presentation" onpointerenter={() => (hi = a)} onpointerleave={() => (hi = null)} />
          {/each}
          {#each [300, 360, 420, 480, 540, 600] as t}<text class="tick" x={x(t)} y={h - 30} text-anchor="middle">{fmtHm(t)}</text>{/each}
        </svg>
      {/if}
      <Tooltip visible={!!hi} x={hi ? x(hi.entry) : 0} y={h - 64} containerWidth={width}>
        {#if hi}<strong>{hi.id}</strong><div class="row">wanted {fmtHm(hi.eto)}<span class="v">+{hi.delay} min</span></div>{/if}
      </Tooltip>
    </div>
    <p class="stat">
      <strong>FFS101:</strong> +{sc.hero.delay} min → CTOT {fmtHm(sc.hero.ctot)} ·
      <strong>All regulated flights:</strong> {fmtInt(totalDelay)} delay minutes across {regulated.length} flights
    </p>
  {/if}
  {#if stage === 'explore'}
    <label class="slider">Sector capacity: <strong>{rate} flights/hour</strong>
      <input type="range" min="20" max="56" step="1" bind:value={rate} />
    </label>
  {/if}
</div>

<style>
  .casa { display: flex; flex-direction: column; gap: 8px; height: 100%; justify-content: center; padding: 16px; }
  .belt { position: relative; }
  svg { display: block; }
  .rl, .tick { fill: var(--muted); font-size: 11px; }
  .link { stroke: var(--muted); stroke-width: 1; }
  .link.hero { stroke: var(--status-critical); stroke-width: 2; }
  .dot { fill: var(--series-1); stroke: var(--surface); stroke-width: 1; }
  .dot.hero { fill: var(--status-critical); stroke: var(--ink); stroke-width: 1.5; }
  .stat { font-size: 14px; margin: 0; }
  .slider { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
  input[type='range'] { width: 100%; accent-color: var(--accent); }
</style>
```

- [ ] **Step 4: AcdmTimeline**

`src/lib/viz/AcdmTimeline.svelte`
```svelte
<script lang="ts">
  import { scaleLinear } from 'd3';
  import { ACDM, TURNAROUND } from '$lib/story/flight';
  import { SLOT_TOLERANCE } from '$lib/sim/casa';
  import { fmtHm } from './chart-utils';

  let { stage }: { stage: 'milestones' | 'turnaround' | 'window' } = $props();
  const hm = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);
  let width = $state(0);
  const rowH = 26, top = 30;
  const x = $derived(scaleLinear().domain([hm('03:55'), hm('05:50')]).range([150, Math.max(151, width - 16)]));
  const ms = [
    { k: 'EOBT', t: ACDM.eobt, note: 'flight plan' }, { k: 'TOBT', t: ACDM.tobt, note: 'ready (handler)' },
    { k: 'TSAT', t: ACDM.tsat, note: 'start-up (ATC)' }, { k: 'AOBT', t: ACDM.aobt, note: 'push-back' },
    { k: 'CTOT', t: ACDM.ctotFinal, note: 'slot' }, { k: 'ATOT', t: ACDM.atot, note: 'take-off' }
  ];
  const h = $derived(top + TURNAROUND.length * rowH + 70);
</script>

<div class="acdm" bind:clientWidth={width}>
  {#if width}
    <svg {width} height={h} role="img" aria-label="FFS101 turnaround and A-CDM milestones at Brussels">
      {#if stage === 'window'}
        {@const c = hm(ACDM.ctotFinal)}
        <rect class="win" x={x(c - SLOT_TOLERANCE.before)} y={top - 10} width={x(c + SLOT_TOLERANCE.after) - x(c - SLOT_TOLERANCE.before)} height={h - top - 20} />
        <text class="wt" x={x(c + SLOT_TOLERANCE.after) + 4} y={top}>slot window −5/+10</text>
        <line class="old" x1={x(hm(ACDM.ctotPlanned))} x2={x(hm(ACDM.ctotPlanned))} y1={top - 10} y2={h - 30} />
        <text class="oldt" x={x(hm(ACDM.ctotPlanned)) + 4} y={h - 34}>first CTOT {ACDM.ctotPlanned} (before reroute)</text>
      {/if}
      {#each TURNAROUND as t, i (t.id)}
        <text class="task" x="0" y={top + i * rowH + 15}>{t.label}</text>
        <rect class="bar" class:dim={stage === 'milestones'} x={x(hm(t.start))} y={top + i * rowH + 4} width={Math.max(2, x(hm(t.end)) - x(hm(t.start)))} height={rowH - 10} rx="4" />
      {/each}
      {#each ms as mk, i (mk.k)}
        {@const px = x(hm(mk.t))}
        <line class="ms" x1={px} x2={px} y1={top - 10} y2={h - 40} />
        <text class="msk" x={px} y={h - 26 + (i % 2) * 14} text-anchor="middle">{mk.k} {mk.t}</text>
      {/each}
      {#each [hm('04:00'), hm('04:30'), hm('05:00'), hm('05:30')] as t}<text class="tick" x={x(t)} y="12" text-anchor="middle">{fmtHm(t)} UTC</text>{/each}
    </svg>
  {/if}
</div>

<style>
  .acdm { width: 100%; padding: 16px; }
  svg { display: block; }
  .task { fill: var(--ink-2); font-size: 12px; }
  .bar { fill: var(--series-1); transition: opacity 300ms; } .bar.dim { opacity: 0.25; }
  .ms { stroke: var(--ink); stroke-width: 1; stroke-dasharray: 2 3; }
  .msk { fill: var(--ink); font-size: 11px; font-weight: 600; }
  .tick { fill: var(--muted); font-size: 11px; }
  .win { fill: color-mix(in srgb, var(--status-good) 18%, transparent); stroke: var(--status-good); }
  .wt { fill: var(--status-good); font-size: 12px; font-weight: 600; }
  .old { stroke: var(--status-critical); stroke-width: 2; stroke-dasharray: 4 3; }
  .oldt { fill: var(--status-critical); font-size: 12px; }
</style>
```

- [ ] **Step 5: ProfileChart, ChargesBar, StakeholderMatrix**

`src/lib/viz/ProfileChart.svelte`
```svelte
<script lang="ts">
  import { scaleLinear, area as d3area } from 'd3';
  import { altitudeAtKm, ANSP_LABEL, type AnspKey } from '$lib/story/flight';
  import { routeLengthKm, type LonLat, type Span } from '$lib/geo/route';
  import { ANSP_COLOR } from './palette';
  import { fmtInt } from './chart-utils';

  let { route, spans, progress }: { route: LonLat[]; spans: Span<AnspKey>[]; progress: number } = $props();
  let width = $state(0);
  const height = 200, m = { t: 16, r: 16, b: 28, l: 56 };
  const L = $derived(routeLengthKm(route));
  const pts = $derived(Array.from({ length: 241 }, (_, i) => (i / 240) * L).map((d) => ({ d, alt: altitudeAtKm(d, L) })));
  const x = $derived(scaleLinear().domain([0, L]).range([m.l, Math.max(m.l + 1, width - m.r)]));
  const y = $derived(scaleLinear().domain([0, 40000]).range([height - m.b, m.t]));
  const gen = $derived(d3area<{ d: number; alt: number }>().x((p) => x(p.d)).y0(height - m.b).y1((p) => y(p.alt)));
</script>

<div class="profile" bind:clientWidth={width}>
  {#if width}
    <svg {width} {height} role="img" aria-label="Vertical profile of FFS101 coloured by the controlling ANSP">
      {#each spans as s (s.id + s.startKm)}
        <path d={gen(pts.filter((p) => p.d >= s.startKm && p.d <= s.endKm && p.d <= progress * L))} fill={ANSP_COLOR[s.id]} opacity="0.85" />
      {/each}
      <line class="fl" x1={m.l} x2={width - m.r} y1={y(24500)} y2={y(24500)} />
      <text class="flt" x={width - m.r} y={y(24500) - 4} text-anchor="end">FL245 — above: MUAC over Benelux</text>
      {#each [0, 10000, 20000, 30000, 40000] as t}<text class="tick" x={m.l - 6} y={y(t)} dy="0.32em" text-anchor="end">{t === 0 ? '0' : `FL${t / 100}`}</text>{/each}
      {#each [0, 300, 600, 900, 1200].filter((k) => k <= L) as k}<text class="tick" x={x(k)} y={height - 8} text-anchor="middle">{fmtInt(k)} km</text>{/each}
    </svg>
    <ul class="legend">{#each spans as s (s.id + s.startKm)}<li><span class="sw" style:background={ANSP_COLOR[s.id]}></span>{ANSP_LABEL[s.id]}</li>{/each}</ul>
  {/if}
</div>

<style>
  .profile { width: 100%; }
  svg { display: block; }
  .fl { stroke: var(--ink-2); stroke-dasharray: 4 4; } .flt { fill: var(--ink-2); font-size: 11px; }
  .tick { fill: var(--muted); font-size: 11px; }
  .legend { display: flex; flex-wrap: wrap; gap: 4px 12px; list-style: none; padding: 0; margin: 6px 0 0; font-size: 12px; color: var(--ink-2); }
  .sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; }
</style>
```

`src/lib/viz/ChargesBar.svelte`
```svelte
<script lang="ts">
  import type { ZoneCharge } from '$lib/sim/charges';
  import { ZONE_COLOR } from './palette';
  import { fmtInt } from './chart-utils';
  let { planned, rerouted, mode }: { planned: ZoneCharge[]; rerouted: ZoneCharge[]; mode: 'distance' | 'cost' | 'compare' } = $props();
  const sum = (z: ZoneCharge[], k: 'km' | 'charge') => z.reduce((s, x) => s + x[k], 0);
  const rows = $derived([
    ...(mode !== 'cost' ? [{ id: 'pd', label: 'Planned · distance', zones: planned, k: 'km' as const, unit: 'km' }] : []),
    ...(mode !== 'distance' ? [{ id: 'pc', label: 'Planned · charges', zones: planned, k: 'charge' as const, unit: '€' }] : []),
    ...(mode === 'compare' ? [{ id: 'rc', label: 'Rerouted · charges', zones: rerouted, k: 'charge' as const, unit: '€' }] : [])
  ]);
  const maxTotal = $derived(Math.max(...rows.filter((r) => r.k === 'charge').map((r) => sum(r.zones, 'charge')), 1));
</script>

<div class="charges">
  {#each rows as r (r.id)}
    {@const total = sum(r.zones, r.k)}
    <div class="row">
      <div class="lbl">{r.label} <span class="tot">{r.unit === '€' ? `€${fmtInt(total)}` : `${fmtInt(total)} km`}</span></div>
      <div class="track" style:width={r.k === 'charge' ? `${(total / maxTotal) * 100}%` : '100%'}>
        {#each r.zones as z (z.zone.id)}
          {@const share = z[r.k] / total}
          <div class="seg" style:flex-grow={share} style:background={ZONE_COLOR[z.zone.id]} title="{z.zone.label}: {r.unit === '€' ? `€${fmtInt(z.charge)}` : `${fmtInt(z.km)} km`} ({Math.round(share * 100)}%)">
            {#if share > 0.09}<span>{z.zone.label.split('–')[0]} {Math.round(share * 100)}%</span>{/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
  <table class="visually-hidden"><caption>Route charges by zone</caption><thead><tr><th>Route</th><th>Zone</th><th>km</th><th>€</th></tr></thead>
    <tbody>{#each [{ n: 'Planned', zs: planned }, { n: 'Rerouted', zs: rerouted }] as g (g.n)}{#each g.zs as z (z.zone.id)}<tr><td>{g.n}</td><td>{z.zone.label}</td><td>{z.km}</td><td>{z.charge}</td></tr>{/each}{/each}</tbody></table>
</div>

<style>
  .charges { display: flex; flex-direction: column; gap: 14px; padding: 16px; width: 100%; }
  .lbl { font-size: 13px; color: var(--ink-2); margin-bottom: 4px; } .tot { color: var(--ink); font-weight: 650; margin-left: 6px; }
  .track { display: flex; gap: 2px; height: 34px; transition: width 500ms; }
  .seg { min-width: 2px; border-radius: 4px; display: flex; align-items: center; padding: 0 6px; overflow: hidden; transition: flex-grow 500ms; }
  .seg span { font-size: 11px; font-weight: 650; color: #fff; white-space: nowrap; text-shadow: 0 1px 2px rgb(0 0 0 / 0.5); }
</style>
```

`src/lib/viz/StakeholderMatrix.svelte`
```svelte
<script lang="ts">
  import { ACTORS, PHASES, matrix } from '$lib/story/stakeholders';
  import { EVENTS, type Phase } from '$lib/story/flight';
  import Tooltip from './Tooltip.svelte';
  let { upTo }: { upTo: Phase } = $props();
  const cells = matrix(EVENTS);
  const limit = $derived(PHASES.findIndex((p) => p.id === upTo));
  let width = $state(0);
  const rowH = 26, left = 190, top = 28;
  const colW = $derived(Math.max(24, (width - left - 8) / PHASES.length));
  let hi: (typeof cells)[number] | null = $state(null);
</script>

<div class="sm" bind:clientWidth={width}>
  {#if width}
    <svg {width} height={top + ACTORS.length * rowH + 8} role="img" aria-label="Which stakeholder acted in which phase of FFS101's life">
      {#each PHASES as p, j (p.id)}<text class="ph" x={left + j * colW + colW / 2} y="14" text-anchor="middle" opacity={j <= limit ? 1 : 0.35}>{width > 700 ? p.label : p.label.slice(0, 3)}</text>{/each}
      {#each ACTORS as a, i (a.id)}
        <text class="ac" x="0" y={top + i * rowH + 16}>{a.label}</text>
        <line class="g" x1={left} x2={width - 8} y1={top + i * rowH + 12} y2={top + i * rowH + 12} />
      {/each}
      {#each cells as c (c.actor + c.phase)}
        {@const i = ACTORS.findIndex((a) => a.id === c.actor)}
        {@const j = PHASES.findIndex((p) => p.id === c.phase)}
        <circle role="presentation" cx={left + j * colW + colW / 2} cy={top + i * rowH + 12} r={4 + Math.min(4, c.events.length * 1.5)} class="dot" opacity={j <= limit ? 1 : 0.12} onpointerenter={() => (hi = c)} onpointerleave={() => (hi = null)} />
      {/each}
    </svg>
  {/if}
  <Tooltip visible={!!hi} x={hi ? left + PHASES.findIndex((p) => p.id === hi!.phase) * colW + colW / 2 : 0} y={hi ? top + ACTORS.findIndex((a) => a.id === hi!.actor) * rowH : 0} containerWidth={width}>
    {#if hi}{#each hi.events as e (e.id)}<div>{e.label}</div>{/each}{/if}
  </Tooltip>
</div>

<style>
  .sm { position: relative; width: 100%; padding: 16px; }
  svg { display: block; }
  .ph { fill: var(--ink-2); font-size: 11px; } .ac { fill: var(--ink); font-size: 12px; }
  .g { stroke: var(--grid); } .dot { fill: var(--accent); stroke: var(--surface); stroke-width: 2; transition: opacity 300ms; }
</style>
```

- [ ] **Step 6: Add to gallery, extend e2e, review screenshots**

Append to `src/routes/dev/charts/+page.svelte` a section rendering each component with its final stage (`<FplAnatomy active={['15']} stage="distribute" />`, `<CasaQueue stage="explore" />`, `<AcdmTimeline stage="window" />`, `<ProfileChart route={ROUTE_REROUTED} spans={spans} progress={1} />` (spans from `anspSpans` after `loadCountries()`), `<ChargesBar planned={...} rerouted={...} mode="compare" />` (from `routeCharges(await countrySpans(route, fc), ZONES, HERO.mtowT)`), `<StakeholderMatrix upTo="postops" />`), each wrapped in a `Figure` with the right `sources`/`illustrative`.

Append to `tests/e2e/charts.spec.ts`:
```ts
test('story visualizations render and the CASA slider recomputes delay', async ({ page }) => {
  await page.goto('/dev/charts/');
  await expect(page.getByLabel('ICAO flight plan for FFS101')).toContainText('(FPL-FFS101-IS');
  const stat = page.locator('.casa .stat');
  const before = await stat.textContent();
  await page.locator('.casa input[type=range]').fill('56');
  await expect(stat).not.toHaveText(before!);
  await expect(page.getByRole('img', { name: /turnaround and A-CDM/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Vertical profile/ })).toBeVisible();
  await expect(page.locator('.charges .row')).toHaveCount(3);
  await expect(page.getByRole('img', { name: /Which stakeholder/ })).toBeVisible();
  await page.screenshot({ path: 'screenshots/story-viz.png', fullPage: true });
});
```

Run: `npm test && npm run check && npm run test:e2e -- tests/e2e/charts.spec.ts` → PASS. Read `screenshots/story-viz.png` (desktop and mobile) and fix overlaps, especially the A-CDM milestone labels and the stakeholder matrix at 390 px.

- [ ] **Step 7: Commit**

```bash
git add src/lib/viz src/lib/story/stakeholders.ts src/routes/dev/charts tests/unit/stakeholders.test.ts tests/e2e/charts.spec.ts
git commit -m "feat: flight plan anatomy, CASA simulator, A-CDM timeline, profile, charges and stakeholder views"
```

---
### Task 14: Story copy, data derivations and chapter assembly

**Files:**
- Create: `src/lib/story/chapters.ts`, `src/lib/story/derive.ts`
- Create: `src/lib/chapters/C00ColdOpen.svelte`, `C01Strategic.svelte`, `C02Airspace.svelte`, `C03Filing.svelte`, `C04Twist.svelte`, `C05Delay.svelte`, `C06Reroute.svelte`, `C07Ground.svelte`, `C08Enroute.svelte`, `C09Arrival.svelte`, `C10PostOps.svelte`, `C11Sources.svelte`
- Create: `tests/fixtures/eurocontrol/punctualities_charts-network.json`, `co2_charts-network.json`
- Modify: `src/routes/+page.svelte` (replace placeholder), `src/app.css` (shared `.stage` styles), `src/lib/viz/palette.ts` (add `CAUSE_SHORT`), `src/lib/geo/projection.ts` (add `ROME_FRAME`)
- Test: `tests/unit/story-content.test.ts`, `tests/unit/derive.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `CHAPTERS: ChapterDef[]`, `chapter(id: string): ChapterDef` (throws on unknown id)
  - `derive.ts`: `dayNum(iso): number`, `dayNumLabel(n): string`, `trafficLines(b, years?, current?): LineSeries[]`, `forecastLines(b): LineSeries[]`, `causeRows(b, range?): { x: number; values: Record<string, number> }[]`, `causeBars(b): Bar[]`, `punctualityLines(b, days?): LineSeries[]`, `co2Lines(b): LineSeries[]`, `linesTable(lines, xLabel, xFormat, yFormat, caption): TableSpec`

- [ ] **Step 1: Capture two more fixtures**

```bash
cd tests/fixtures/eurocontrol
B=https://api-data-app.eurocontrol.int/api
NET=$(node -e 'console.log(require("./sync-network.json").data[0].id)')
curl -sg "$B/punctualities_charts?sync.id=$NET&itemsPerPage=100" > punctualities_charts-network.json
curl -sg "$B/co2_charts?sync.id=$NET&itemsPerPage=100" > co2_charts-network.json
cd -
```

- [ ] **Step 2: Failing tests for derivations and content**

`tests/unit/derive.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import traffic from '../fixtures/eurocontrol/traffic_charts-network.json';
import delay from '../fixtures/eurocontrol/delay_charts-network.json';
import punct from '../fixtures/eurocontrol/punctualities_charts-network.json';
import co2 from '../fixtures/eurocontrol/co2_charts-network.json';
import { parseCharts, type EntityBundle } from '$lib/data/eurocontrol';
import { trafficLines, forecastLines, causeRows, causeBars, punctualityLines, co2Lines, linesTable, dayNum, dayNumLabel } from '$lib/story/derive';
import { CAUSES } from '$lib/viz/palette';

const b: EntityBundle = {
  key: 'network', label: 'European network', syncId: 1, dataDate: '2026-10-08',
  traffic: parseCharts(traffic), delay: parseCharts(delay), punctuality: parseCharts(punct), co2: parseCharts(co2),
  headline: { flights: 1, delayMinutes: 1, delayPerFlight: 1 }
};

describe('derive', () => {
  it('traffic lines: 2019, 2025, 2026 with the current year drawn last', () => {
    const l = trafficLines(b);
    expect(l.map((s) => s.id)).toEqual(['2019', '2025', '2026']);
    expect(l[2].color).toBe('var(--series-1)');
    for (const p of l[0].points) { expect(p.x).toBeGreaterThanOrEqual(1); expect(p.x).toBeLessThanOrEqual(366); }
  });
  it('forecast in million flights per year', () => {
    const f = forecastLines(b);
    expect(f.map((s) => s.id).sort()).toEqual(['Actual', 'Base', 'High', 'Low']);
    const actual = f.find((s) => s.id === 'Actual')!;
    expect(actual.points[0].x).toBe(2019);
    expect(actual.points.at(-1)!.y).toBeGreaterThan(8);
    expect(actual.points.at(-1)!.y).toBeLessThan(15);
  });
  it('cause rows and bars use the fixed cause order', () => {
    const rows = causeRows(b);
    expect(rows.length).toBeGreaterThan(30);
    expect(Object.keys(rows[0].values)).toEqual([...CAUSES]);
    const bars = causeBars(b);
    expect(bars.map((x) => x.key)).toEqual([...CAUSES]);
    expect(bars.every((x) => x.value >= 0)).toBe(true);
  });
  it('punctuality and CO₂ lines', () => {
    expect(punctualityLines(b).map((s) => s.id)).toEqual(['Departure punct.', 'Arrival punct.']);
    expect(punctualityLines(b, 30)[0].points.length).toBeLessThanOrEqual(30);
    expect(co2Lines(b).map((s) => s.id)).toEqual(['CO2 index', 'Departures index']);
  });
  it('dayNum round-trips', () => {
    expect(dayNumLabel(dayNum('2026-10-08'))).toBe('8 Oct 2026');
  });
  it('linesTable aligns series by x', () => {
    const t = linesTable([
      { id: 'a', label: 'A', color: '', points: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
      { id: 'b', label: 'B', color: '', points: [{ x: 2, y: 5 }] }
    ], 'Day', String, String, 'cap');
    expect(t.rows).toEqual([{ x: '1', a: '10', b: '' }, { x: '2', a: '20', b: '5' }]);
    expect(t.columns.map((c) => c.label)).toEqual(['Day', 'A', 'B']);
  });
});
```

`tests/unit/story-content.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { CHAPTERS, chapter } from '$lib/story/chapters';
import { citedIds, termIds } from '$lib/story/richtext';
import { SOURCES } from '$lib/story/sources';
import { GLOSSARY } from '$lib/story/glossary';

const steps = CHAPTERS.flatMap((c) => c.steps.map((s) => ({ c, s })));

describe('story content', () => {
  it('has unique chapter and step ids', () => {
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
    expect(new Set(steps.map(({ s }) => s.id)).size).toBe(steps.length);
  });
  it('every step cites a source or is flagged illustrative (sources everywhere)', () => {
    for (const { s } of steps) expect(citedIds(s.text).length > 0 || s.illustrative === true, s.id).toBe(true);
  });
  it('every non-illustrative factual step has at least one citation', () => {
    for (const { s } of steps) if (!s.illustrative) expect(citedIds(s.text).length, s.id).toBeGreaterThan(0);
  });
  it('every citation resolves and every term is in the glossary', () => {
    for (const { s } of steps) {
      for (const id of citedIds(s.text)) expect(SOURCES[id], `${s.id} → ${id}`).toBeDefined();
      for (const t of termIds(s.text)) expect(GLOSSARY[t], `${s.id} → {${t}}`).toBeDefined();
    }
  });
  it('mission clock never runs backwards', () => {
    const clocks = steps.map(({ c, s }) => s.clock ?? c.clock);
    for (let i = 1; i < clocks.length; i++) expect(clocks[i], steps[i].s.id).toBeGreaterThanOrEqual(clocks[i - 1]);
  });
  it('mentions no [unverified] research claim', () => {
    for (const { s } of steps) expect(s.text).not.toMatch(/unverified/i);
  });
  it('chapter() throws for unknown ids', () => {
    expect(() => chapter('nope')).toThrow();
  });
});
```

Run: `npx vitest run tests/unit/derive.test.ts tests/unit/story-content.test.ts` → FAIL (modules missing).

- [ ] **Step 3: Implement derivations**

Add to `src/lib/viz/palette.ts`:
```ts
export const CAUSE_SHORT: Record<Cause, string> = {
  'Capacity/Staffing (ATC)': 'ATC capacity', Weather: 'Weather', 'Aerodrome capacity': 'Airport', 'Disruptions (ATC)': 'Disruptions', Other: 'Other'
};
```

Add to `src/lib/geo/projection.ts`:
```ts
export const ROME_FRAME: GeoJSON.MultiPoint = { type: 'MultiPoint', coordinates: [[10.4, 43.4], [13.4, 43.4], [13.4, 41.3], [10.4, 41.3]] };
```

`src/lib/story/derive.ts`
```ts
import type { EntityBundle } from '$lib/data/eurocontrol';
import { dayOfYear, yearOfSeries, stackByName } from '$lib/data/series';
import { CAUSES, CAUSE_COLOR, CAUSE_SHORT, yearStyle } from '$lib/viz/palette';
import { fmtDate } from '$lib/viz/chart-utils';
import type { Bar, LineSeries, TableSpec } from '$lib/viz/types';

export const dayNum = (iso: string) => Math.round(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / 86_400_000);
export const dayNumLabel = (n: number) => fmtDate(new Date(n * 86_400_000).toISOString());

export function trafficLines(b: EntityBundle | undefined, years = [2019, 2025, 2026], current = 2026): LineSeries[] {
  return (b?.traffic ?? [])
    .filter((s) => s.chartType === 'daily_evolution')
    .map((s) => ({ s, yr: yearOfSeries(s) }))
    .filter((d): d is { s: (typeof d)['s']; yr: number } => d.yr !== null && years.includes(d.yr))
    .sort((a, b) => a.yr - b.yr)
    .map(({ s, yr }) => ({ id: String(yr), label: String(yr), ...yearStyle(yr, current), points: s.points.map((p) => ({ x: dayOfYear(p.date), y: p.value })) }));
}

const FORECAST_STYLE: Record<string, Partial<LineSeries>> = {
  Actual: { color: 'var(--series-1)', width: 2.5 }, Base: { color: 'var(--series-2)', width: 2 },
  High: { color: 'var(--muted)', width: 1.5, dash: '4 3' }, Low: { color: 'var(--muted)', width: 1.5, dash: '4 3' }
};
export function forecastLines(b: EntityBundle | undefined): LineSeries[] {
  return (b?.traffic ?? [])
    .filter((s) => s.chartType === 'forecast' && s.name in FORECAST_STYLE)
    .map((s) => ({ id: s.name, label: s.name === 'Actual' ? 'Actual' : `${s.name} forecast`, color: '', ...FORECAST_STYLE[s.name], points: s.points.map((p) => ({ x: +p.date.slice(0, 4), y: p.value / 1e6 })) }));
}

export function causeRows(b: EntityBundle | undefined, range = 'Y2D') {
  return stackByName((b?.delay ?? []).filter((s) => s.chartType === 'category_evolution' && s.dateRange === range), [...CAUSES])
    .map((r) => ({ x: dayOfYear(r.date), values: r.values }));
}

export function causeBars(b: EntityBundle | undefined): Bar[] {
  return CAUSES.map((c) => {
    const s = (b?.delay ?? []).find((x) => x.chartType === 'category_evolution' && x.dateRange === 'DY' && x.name === c);
    return { key: c, label: CAUSE_SHORT[c], value: s?.points.at(-1)?.value ?? 0, color: CAUSE_COLOR[c] };
  });
}

export function punctualityLines(b: EntityBundle | undefined, days = 365): LineSeries[] {
  const style = [{ color: 'var(--series-1)', width: 2 }, { color: 'var(--series-2)', width: 2 }];
  return ['Departure punct.', 'Arrival punct.'].flatMap((name, i) => {
    const s = (b?.punctuality ?? []).find((x) => x.chartType === 'evo_chart' && x.name === name);
    return s ? [{ id: name, label: name.replace(' punct.', ' punctuality'), ...style[i], points: s.points.slice(-days).map((p) => ({ x: dayNum(p.date), y: p.value })) }] : [];
  });
}

export function co2Lines(b: EntityBundle | undefined): LineSeries[] {
  const style = [{ color: 'var(--series-1)', width: 2 }, { color: 'var(--series-2)', width: 2 }];
  return ['CO2 index', 'Departures index'].flatMap((name, i) => {
    const s = (b?.co2 ?? []).find((x) => x.chartType === 'evo_chart' && x.name === name);
    return s ? [{ id: name, label: name.replace('CO2', 'CO₂'), ...style[i], points: s.points.map((p) => ({ x: dayNum(p.date), y: p.value })) }] : [];
  });
}

export function linesTable(lines: LineSeries[], xLabel: string, xFormat: (x: number) => string, yFormat: (y: number) => string, caption: string): TableSpec {
  const xs = [...new Set(lines.flatMap((l) => l.points.map((p) => p.x)))].sort((a, b) => a - b);
  const maps = lines.map((l) => new Map(l.points.map((p) => [p.x, p.y])));
  return {
    caption,
    columns: [{ key: 'x', label: xLabel }, ...lines.map((l) => ({ key: l.id, label: l.label }))],
    rows: xs.map((x) => ({ x: xFormat(x), ...Object.fromEntries(lines.map((l, i) => [l.id, maps[i].has(x) ? yFormat(maps[i].get(x)!) : ''])) }))
  };
}
```

- [ ] **Step 4: Write the story copy**

`src/lib/story/chapters.ts` — final copy. Facts come from `docs/research/flight-lifecycle.md`; numbers on screen come from the live data. Keep steps to ≤ 75 words.
```ts
import type { ChapterDef } from './types';

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'cold-open', kicker: 'Prologue', title: 'The sky over Europe', clockLabel: 'Now', clock: 0,
    steps: [
      { id: 'co-sky', text: 'Every dot is an aircraft over Europe, captured from the positions they broadcast shortly before this page was last built [D-opensky].' },
      { id: 'co-yesterday', text: 'Yesterday the European network handled the number on screen. In 2025 it handled 11.1 million flights, and on its busiest day — 18 July 2025 — 37,034: one new flight every 2.3 seconds [S1, D-eurocontrol].' },
      { id: 'co-hero', illustrative: true, text: 'None of them just took off. Behind each is a choreography of airlines, airports, air traffic controllers and EUROCONTROL’s **Network Manager**. This is the story of one: **FFS101**, a fictional 07:00 Airbus A320neo from Brussels to Rome [S35].' }
    ]
  },
  {
    id: 'strategic', kicker: 'Chapter 1 · Strategic phase', title: 'A flight is born on paper', clockLabel: 'T−10 months', clock: 0.02,
    steps: [
      { id: 'st-schedule', illustrative: true, clock: 0.02, text: 'FFS101 first exists in an airline network plan, almost a year before it flies: a 07:00 local departure from Brussels for the Summer 2026 season, which runs from the last Sunday of March to the last Saturday of October [S25].' },
      { id: 'st-slots', clock: 0.08, text: 'Brussels Airport has been slot-coordinated since 2003: nobody takes off or lands there without an airport slot from Belgium Slot Coordination ({BSC}) [S26]. Rome Fiumicino’s come from Assoclearance [S27]. EU Regulation 95/93 and the {WASG} set the rules — including “use it or lose it” at 80% [S21, S22].' },
      { id: 'st-not-ctot', clock: 0.12, text: 'Those two airport slots — one to leave Brussels, one to land in Rome — are not the take-off “slot” a pilot apologises for on board. That one, the {CTOT}, only appears on the day itself [S7].' },
      { id: 'st-nop', clock: 0.14, text: 'Meanwhile the {NM} — EUROCONTROL, with 42 member states — agrees with every air navigation service provider ({ANSP}) how much capacity each piece of sky will offer, in the Network Operations Plan ({NOP}) [S2, S8, S3].' },
      { id: 'st-forecast', clock: 0.16, text: 'They plan for a lot of traffic. 2025 was back at 2019 levels, and EUROCONTROL’s seven-year forecast keeps climbing [S1, D-eurocontrol].' }
    ]
  },
  {
    id: 'airspace', kicker: 'Chapter 2 · The sky in between', title: 'Thirty-seven landlords', clockLabel: 'Months → D−1', clock: 0.2,
    steps: [
      { id: 'as-patchwork', clock: 0.2, text: 'Europe’s sky is a patchwork: 37 en-route air navigation service providers share 11.5 million km² of continental airspace [S49]. FFS101’s straight line crosses Belgium, Luxembourg, France, Switzerland and Italy.' },
      { id: 'as-rad', clock: 0.23, text: 'Airlines can’t just draw a line. The Route Availability Document ({RAD}) says which routes are open when, renewed every 28-day {AIRAC} cycle [S17]. Inside Free Route Airspace ({FRA}) — about 76 control centres by the end of 2025 — they may fly direct between entry and exit points [S18].' },
      { id: 'as-military', clock: 0.3, text: 'Part of the sky belongs to the military, part of the time: training zones cover about half of Belgian airspace [S28]. Under Flexible Use of Airspace ({FUA}) each country publishes tomorrow’s bookings in an Airspace Use Plan ({AUP}), which the Network Manager merges for all of Europe [S19].' },
      { id: 'as-pretactical', clock: 0.37, text: 'Six days out, the Network Manager starts comparing forecast demand with expected capacity. On the eve of the flight, at 16:00 UTC in summer, the plan moves into the live system, {ETFMS}: tomorrow becomes today [S8].' }
    ]
  },
  {
    id: 'filing', kicker: 'Chapter 3 · D−1, 17:00 UTC', title: 'The flight plan', clockLabel: 'D−1 · filing', clock: 0.42,
    steps: [
      { id: 'fp-file', illustrative: true, text: 'The evening before, a dispatcher files FFS101’s flight plan. It may be filed up to 120 hours ahead and, where possible, at least three hours before off-block [S9].' },
      { id: 'fp-ident', text: 'Item 7 is the callsign; item 8 says the flight follows instrument rules and is scheduled; items 9 and 10 give the aircraft type and what it can do — radios, navigation, datalink [S9].' },
      { id: 'fp-eobt', text: 'Item 13: from Brussels at 05:00 UTC. That is the {EOBT}, the estimated off-block time — the moment every later deadline counts from [S9, S7].' },
      { id: 'fp-route', text: 'Item 15 is the route: cruise speed, flight level and the points in between — here a chain of coordinates joined by direct segments, as {FRA} allows [S9, S18].' },
      { id: 'fp-other', text: 'Item 18 carries the rest: date of flight, registration and navigation approvals [S9].' },
      { id: 'fp-ifps', text: 'It goes to one place: {IFPS}, the Network Manager’s flight-plan system in Brussels — up to 100,000 messages a day, more than 99% without human hands [S10]. It checks syntax, the route against the RAD and airspace availability, then replies {ACK} [S9].' },
      { id: 'fp-distribute', text: 'Within seconds the plan reaches every air traffic control unit on the route and the flow-management system. Filing it is also, in effect, a request for a slot [S7, S9].' }
    ]
  },
  {
    id: 'twist', kicker: 'Chapter 4 · D-day, before dawn', title: 'Too many flights, one sector', clockLabel: 'D-day · 03:00 UTC', clock: 0.5,
    steps: [
      { id: 'tw-demand', illustrative: true, text: 'Overnight the flow managers spot trouble: in a Reims sector group on FFS101’s path, more flights want to pass between 05:00 and 07:00 than its controllers can safely handle [S7].' },
      { id: 'tw-regulation', text: 'When demand exceeds capacity, the Network Manager and the local Flow Management Position ({FMP}) impose a regulation: a place, a time window and an entry rate. Four hours at 28 flights an hour make 112 slots, about two minutes apart [S7].' },
      { id: 'tw-queue', text: '{CASA}, the slot allocator, queues flights first-planned, first-served by when they would reach the sector. A flight that doesn’t fit is pushed to the next free slot — and the queue grows [S7].' },
      { id: 'tw-sam', illustrative: true, text: 'FFS101 is in that queue. At 03:00 UTC — two hours before off-block — a Slot Allocation Message ({SAM}) arrives: {CTOT} 05:42, 27 minutes late [S7].' },
      { id: 'tw-explore', text: 'Your turn: drag the sector’s capacity and watch the delay ripple through every flight in the queue. *A simplified model of CASA, not the real algorithm* [S7].' }
    ]
  },
  {
    id: 'delay', kicker: 'Zoom out', title: 'Why Europe waits', clockLabel: 'Zoom out · Europe', clock: 0.5,
    steps: [
      { id: 'de-yesterday', text: 'FFS101 is not alone. Yesterday, flow-management ({ATFM}) delay across the network added up to the minutes on screen [D-eurocontrol].' },
      { id: 'de-causes', text: 'Mostly not because of weather: in 2025, ATC capacity and staffing caused 58% of en-route ATFM delay, weather 28% [S1]. Yesterday’s split is on screen [D-eurocontrol].' },
      { id: 'de-year', text: 'Across the year the pattern repeats — summer storms and staffing peaks. France accounted for 36% of en-route delay in 2025 [S1, D-eurocontrol].' },
      { id: 'de-report', text: 'Every week the Network Manager writes up what happened. This is its latest network situation report, fetched live [D-situation].' }
    ]
  },
  {
    id: 'reroute', kicker: 'Chapter 5 · D-day, 03:20 UTC', title: 'The way around', clockLabel: 'D-day · 03:20 UTC', clock: 0.53,
    steps: [
      { id: 'rr-path', illustrative: true, text: 'The regulated sector sits right on FFS101’s planned path over north-east France — the country that generated the most en-route delay in 2025 [S1].' },
      { id: 'rr-rrp', illustrative: true, text: 'At 03:20 the Network Manager offers a Rerouting Proposal ({RRP}): east over Germany and Zurich, about 20 NM longer, with a new CTOT of 05:22 [S7]. In 2025 such reroutes saved 277,000 minutes of delay [S3].' },
      { id: 'rr-weigh', text: 'The dispatcher weighs 20 fewer minutes of delay against fuel and different route charges. In 2025, hand-picked proposals saved on average 90 NM, 450 kg of fuel and €112 per flight [S3].' },
      { id: 'rr-accept', illustrative: true, text: 'Accepted. The plan is refiled, and a Slot Revision Message ({SRM}) confirms CTOT 05:22 [S7].' }
    ]
  },
  {
    id: 'ground', kicker: 'Chapter 6 · Brussels Airport', title: 'Everyone on one clock', clockLabel: 'Brussels · 04:00–05:24 UTC', clock: 0.56,
    steps: [
      { id: 'gr-acdm', clock: 0.56, text: 'Brussels runs Airport Collaborative Decision Making ({A-CDM}): the airport, airline, ground handlers, air traffic control and the Network Manager share one timeline of milestones [S13, S14].' },
      { id: 'gr-tobt', illustrative: true, clock: 0.58, text: 'Cleaners, caterers, fuel and baggage teams work around the aircraft while passengers board. Handler and airline commit to a Target Off-Block Time — the {TOBT} — when it will really be ready [S13].' },
      { id: 'gr-tsat', illustrative: true, clock: 0.6, text: 'Air traffic control turns all the TOBTs and slots into a start-up sequence: FFS101 gets a {TSAT} of 05:07 so it reaches the runway for its CTOT. The airport keeps the Network Manager updated with {DPI} messages [S7, S13].' },
      { id: 'gr-window', illustrative: true, clock: 0.66, text: 'The CTOT is part of the clearance: take-off no more than 5 minutes early or 10 minutes late [S7]. Wheels up at 05:24 — inside the window.' },
      { id: 'gr-punctuality', clock: 0.66, text: 'Brussels’ punctuality, day by day [D-eurocontrol]. In 2025 its departure punctuality was just below 2024 [S1].' }
    ]
  },
  {
    id: 'enroute', kicker: 'Chapter 7 · Airborne', title: 'Five hand-overs to Rome', clockLabel: 'Airborne · 05:24–07:04 UTC', clock: 0.7,
    steps: [
      { id: 'er-skeyes', clock: 0.7, text: 'FFS101 climbs out under skeyes, the Belgian air navigation service provider, which controls the airspace up to {FL} 245 — about 7,500 m [S28].' },
      { id: 'er-muac', clock: 0.73, text: 'Above FL245 it belongs to {MUAC}, EUROCONTROL’s Maastricht centre for the upper airspace of Belgium, the Netherlands, Luxembourg and north-west Germany: 1.83 million flights in 2025, more than 16% of Europe’s traffic, about 60% of clearances by datalink ({CPDLC}) [S5, S6].' },
      { id: 'er-handovers', illustrative: true, clock: 0.78, text: 'Then Germany’s Karlsruhe centre, Zurich, and Italy’s Milano and Roma centres. Each hand-over is agreed computer-to-computer with {OLDI} messages before the pilot changes frequency [S43, S30].' },
      { id: 'er-charges', clock: 0.8, text: 'Every country crossed sends a bill. EUROCONTROL’s Central Route Charges Office ({CRCO}) charges per zone: distance ÷ 100 × √({MTOW}/50) × the zone’s unit rate [S32, S33].' },
      { id: 'er-switzerland', clock: 0.8, text: 'Switzerland charges €167.12 per unit, Italy €73.71 [S34]. On the original route Switzerland is about 18% of the distance but about 31% of the bill. Europe-wide, €11.8 billion of en-route charges were billed in 2025 [S1].' }
    ]
  },
  {
    id: 'arrival', kicker: 'Chapter 8 · Rome Fiumicino', title: 'On blocks', clockLabel: 'Rome · 07:04 UTC', clock: 0.86,
    steps: [
      { id: 'ar-descent', illustrative: true, text: 'Some 200 km out, FFS101 starts down. ENAV’s Roma controllers fit it into Fiumicino’s arrival sequence [S30].' },
      { id: 'ar-onblocks', illustrative: true, text: 'Landing at 07:04, on blocks at 07:12 — seven minutes after schedule. By the industry’s 15-minute definition that counts as on time, like 76.1% of arrivals in 2025 [S1].' },
      { id: 'ar-fco', text: 'Fiumicino averaged 884 flights a day in 2025 and improved its departure punctuality by 10 percentage points [S1]. Its punctuality, day by day [D-eurocontrol].' }
    ]
  },
  {
    id: 'postops', kicker: 'Chapter 9 · After landing', title: 'The flight becomes data', clockLabel: 'T+1 day → T+1 year', clock: 0.92,
    steps: [
      { id: 'po-analysis', clock: 0.92, text: 'The flight is over; its data life begins. Post-operations analysis compares plan with reality and feeds the lessons into the next season’s plan [S8].' },
      { id: 'po-billing', clock: 0.95, text: 'Delay is attributed to the regulation and its cause, and all-causes delay is collected by {CODA} [S36]. The {CRCO} bills the route actually flown [S32]. The Performance Review Commission ({PRC}) reports on the year [S37].' },
      { id: 'po-matrix', clock: 0.97, text: 'Thirteen kinds of stakeholders touched FFS101 — most of them invisible from seat 14C [S7, S13].' },
      { id: 'po-co2', clock: 0.98, text: 'The climate cost is counted too: gate-to-gate CO₂ in the network reached 216 Mt in 2025 [S1]. On screen, the Data app’s CO₂ and departures indices [D-eurocontrol].' },
      { id: 'po-everyone', clock: 1, text: 'More than 30,000 flights a day go through the same choreography [S3]. Here is this year’s traffic for each control provider on FFS101’s path [D-eurocontrol].' }
    ]
  }
];

export function chapter(id: string): ChapterDef {
  const c = CHAPTERS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown chapter ${id}`);
  return c;
}
```

Run: `npx vitest run tests/unit/derive.test.ts tests/unit/story-content.test.ts` → PASS. If a `{TERM}` is reported missing, add it to `GLOSSARY` (with sources), never drop it from the copy silently.

- [ ] **Step 5: Shared stage styles**

Append to `src/app.css`:
```css
.stage { position: relative; height: 100%; padding: 16px; display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.stage .map-wrap { position: relative; flex: 1; min-height: 0; }
.hud { position: absolute; left: calc(var(--step-col) + 24px); top: 24px; max-width: 420px; z-index: 3; background: color-mix(in srgb, var(--bg) 70%, transparent); padding: 12px 14px; border-radius: 10px; }
@media (max-width: 1023px) { .hud { left: 16px; right: 16px; top: 12px; } }
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
```

- [ ] **Step 6: Chapter components**

Each component: `const ch = chapter('<id>')`, renders `<Chapter chapter={ch}>` with a `graphic` snippet that switches on `step`. Every visual carries a `Figure` or `SourceLine`. Copy these exactly.

`src/lib/chapters/C00ColdOpen.svelte`
```svelte
<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import SkyCanvas from '$lib/viz/SkyCanvas.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import HeroNumber from '$lib/viz/HeroNumber.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { sky, ec, bundle } from '$lib/data/liveState.svelte';
  import { ageLabel, minutesAgo } from '$lib/data/sky';
  import { ROUTE_PLANNED } from '$lib/story/flight';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('cold-open');
  const net = $derived(bundle('network'));
  const stale = $derived(sky.snap ? minutesAgo(sky.snap.fetchedAt) > 360 : false);
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      <div class="map-wrap">
        <BaseMap label="Aircraft over Europe from the latest ADS-B snapshot">
          {#snippet children({ projection, path })}
            {#if step >= 2}<RouteMap {projection} {path} routes={[{ id: 'p', coords: ROUTE_PLANNED, style: 'active' }]} progress={1} showPlane={false} />{/if}
          {/snippet}
          {#snippet overlay({ projection, width, height })}
            {#if sky.snap && sky.snap.count > 0}<SkyCanvas aircraft={sky.snap.aircraft} {projection} {width} {height} dim={step >= 2 ? 1 : 0} />{/if}
          {/snippet}
        </BaseMap>
      </div>
      <div class="hud">
        {#if step === 0}
          {#if sky.snap && sky.snap.count > 0}
            <HeroNumber value={sky.snap.count} label="aircraft airborne over Europe" sub="snapshot {ageLabel(sky.snap.fetchedAt)}{stale ? ' — the live feed may be paused' : ''}" />
          {:else if sky.status !== 'loading'}
            <p class="empty" data-testid="sky-empty">The live sky snapshot is unavailable right now — the rest of the story is unaffected.</p>
          {/if}
          <SourceLine ids={[sky.snap?.source === 'adsb.lol' ? 'D-adsblol' : 'D-opensky', 'D-naturalearth']} />
        {:else if step === 1}
          <HeroNumber value={net?.headline.flights ?? null} label="flights in the European network yesterday" />
          <SourceLine ids={['D-eurocontrol']} detail="network-wide" freshness={ec.freshness.network ?? null} dataDate={net?.dataDate} />
        {:else}
          <p class="callout"><strong>FFS101</strong> · Brussels (EBBR) → Rome Fiumicino (LIRF)</p>
          <SourceLine ids={['D-naturalearth']} illustrative />
        {/if}
      </div>
    </div>
  {/snippet}
</Chapter>

<style>
  .callout { font-size: 22px; margin: 0; }
  .empty { margin: 0; color: var(--ink-2); }
</style>
```

`src/lib/chapters/C01Strategic.svelte`
```svelte
<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { trafficLines, forecastLines, linesTable } from '$lib/story/derive';
  import { doyLabel, fmtInt, fmtDec } from '$lib/viz/chart-utils';
  import { HERO } from '$lib/story/flight';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('strategic');
  const net = $derived(bundle('network'));
  const lines = $derived(trafficLines(net));
  const fc = $derived(forecastLines(net));
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      {#if step <= 2}
        <Figure title="Two airport slots, months ahead" sources={['S26', 'S27', 'S7']} illustrative>
          <div class="tickets">
            <div class="ticket"><span class="k">Airport slot · Brussels</span><strong>Departure {HERO.std} UTC</strong><span>Belgium Slot Coordination</span></div>
            <div class="ticket"><span class="k">Airport slot · Rome Fiumicino</span><strong>Arrival {HERO.sta} UTC</strong><span>Assoclearance</span></div>
            {#if step >= 2}<div class="ticket ctot"><span class="k">ATFM slot (CTOT)</span><strong>Not yet</strong><span>Issued on the day by the Network Manager</span></div>{/if}
          </div>
        </Figure>
      {:else if step === 3}
        <Figure title="Flights per day in the European network" subtitle="7-day average, by year" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}
          table={linesTable(lines, 'Day', doyLabel, fmtInt, 'Daily flights by year')}>
          <LineChart series={lines} label="Daily flights in the European network by year" xFormat={doyLabel} yFormat={fmtInt} reveal={0.25 + progress * 1.5} />
        </Figure>
      {:else}
        <Figure title="Flights per year: actual and forecast" subtitle="Million IFR flights, EUROCONTROL forecast scenarios" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}
          table={linesTable(fc, 'Year', String, (v) => fmtDec(v, 2), 'Annual flights, actual and forecast (millions)')}>
          <LineChart series={fc} label="Annual flights actual and forecast" xFormat={(x) => String(Math.round(x))} yFormat={(v) => `${fmtDec(v, 1)} M`} />
        </Figure>
      {/if}
    </div>
  {/snippet}
</Chapter>

<style>
  .tickets { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
  .ticket { display: flex; flex-direction: column; gap: 4px; padding: 16px; border: 1px dashed var(--axis); border-radius: 10px; }
  .ticket .k { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-2); }
  .ticket strong { font-size: 22px; }
  .ticket.ctot { border-color: var(--status-warning); }
</style>
```

`src/lib/chapters/C02Airspace.svelte`
```svelte
<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { EUROPE_FRAME, ROUTE_FRAME } from '$lib/geo/projection';
  import { ISO } from '$lib/geo/countries';
  import { AIRPORTS, ROUTE_PLANNED } from '$lib/story/flight';
  import { chapter } from '$lib/story/chapters';
  const ch = chapter('airspace');
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      <div class="map-wrap">
        <BaseMap label="FFS101's route across Europe's airspace" frame={EUROPE_FRAME} frameTo={ROUTE_FRAME} t={step === 0 ? progress : 1}
          highlight={[ISO.BE, ISO.LU, ISO.FR, ISO.CH, ISO.IT]}>
          {#snippet children({ projection, path })}
            <RouteMap {projection} {path} military={step === 2} showPlane={false} progress={step === 0 ? progress : 1}
              routes={[
                ...(step >= 1 ? [{ id: 'gc', coords: [AIRPORTS.EBBR.lonlat, AIRPORTS.LIRF.lonlat], style: 'ghost' as const }] : []),
                { id: 'planned', coords: ROUTE_PLANNED, style: 'active' as const }
              ]} />
          {/snippet}
        </BaseMap>
      </div>
      <SourceLine ids={step === 2 ? ['D-naturalearth', 'S28', 'S19'] : ['D-naturalearth', 'S17', 'S18']} illustrative detail={step >= 1 ? 'dashed: great circle; solid: filed route' : undefined} />
    </div>
  {/snippet}
</Chapter>
```

`src/lib/chapters/C03Filing.svelte`
```svelte
<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import FplAnatomy from '$lib/viz/FplAnatomy.svelte';
  import { chapter } from '$lib/story/chapters';
  const ch = chapter('filing');
  const ACTIVE = [['all'], ['7', '8', '9', '10'], ['13'], ['15'], ['18'], [], []];
  const STAGE = ['message', 'message', 'message', 'message', 'message', 'validate', 'distribute'] as const;
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      <Figure title="FFS101's ICAO flight plan" subtitle="ICAO 2012 format, as sent to IFPS" sources={['S9', 'S10']} illustrative>
        <FplAnatomy active={ACTIVE[step] ?? []} stage={STAGE[step] ?? 'message'} />
      </Figure>
    </div>
  {/snippet}
</Chapter>
```

`src/lib/chapters/C04Twist.svelte`
```svelte
<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import CasaQueue from '$lib/viz/CasaQueue.svelte';
  import { REGULATION } from '$lib/story/scenario';
  import { fmtHm } from '$lib/viz/chart-utils';
  import { chapter } from '$lib/story/chapters';
  const ch = chapter('twist');
  const STAGES = ['demand', 'regulation', 'queue', 'hero', 'explore'] as const;
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      <Figure title="Demand vs capacity in a Reims sector group" subtitle="Regulation {REGULATION.id}: {fmtHm(REGULATION.start)}–{fmtHm(REGULATION.end)} UTC, simulated traffic" sources={['S7']} illustrative>
        <CasaQueue stage={STAGES[step] ?? 'explore'} />
      </Figure>
    </div>
  {/snippet}
</Chapter>
```

`src/lib/chapters/C05Delay.svelte`
```svelte
<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import HeroNumber from '$lib/viz/HeroNumber.svelte';
  import BarChart from '$lib/viz/BarChart.svelte';
  import StackedArea from '$lib/viz/StackedArea.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { causeBars, causeRows } from '$lib/story/derive';
  import { CAUSES, CAUSE_COLOR, CAUSE_LABEL } from '$lib/viz/palette';
  import { doyLabel, fmtInt, fmtDec } from '$lib/viz/chart-utils';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('delay');
  const net = $derived(bundle('network'));
  const fresh = $derived(ec.freshness.network ?? null);
  const report = $derived(ec.snapshot?.report ?? null);
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      {#if step === 0}
        <Figure title="ATFM delay in the European network, yesterday" sources={['D-eurocontrol']} freshness={fresh} dataDate={net?.dataDate}>
          <HeroNumber value={net?.headline.delayMinutes ?? null} label="minutes of ATFM delay"
            sub={net?.headline.delayPerFlight != null ? `${fmtDec(net.headline.delayPerFlight, 2)} min per flight` : undefined} />
        </Figure>
      {:else if step === 1}
        <Figure title="Yesterday's ATFM delay by cause" subtitle="Minutes" sources={['D-eurocontrol']} freshness={fresh} dataDate={net?.dataDate}
          table={{ caption: 'ATFM delay minutes by cause, yesterday', columns: [{ key: 'label', label: 'Cause' }, { key: 'value', label: 'Minutes', format: fmtInt }], rows: causeBars(net) }}>
          <BarChart bars={causeBars(net)} label="ATFM delay minutes by cause yesterday" yFormat={fmtInt} />
        </Figure>
      {:else if step === 2}
        <Figure title="ATFM delay by cause, this year" subtitle="Daily minutes, 7-day average" sources={['D-eurocontrol']} freshness={fresh} dataDate={net?.dataDate}
          table={{ caption: 'Delay by cause, year to date', columns: [{ key: 'day', label: 'Day' }, ...CAUSES.map((c) => ({ key: c, label: CAUSE_LABEL[c], format: fmtInt }))], rows: causeRows(net).map((r) => ({ day: doyLabel(r.x), ...r.values })) }}>
          <StackedArea rows={causeRows(net)} keys={[...CAUSES]} colors={CAUSE_COLOR} labels={CAUSE_LABEL} label="ATFM delay minutes by cause this year" xFormat={doyLabel} yFormat={fmtInt} reveal={0.2 + progress * 1.6} />
        </Figure>
      {:else}
        <article class="panel report" aria-live="polite">
          {#if report}
            <h3>{report.title}</h3>
            {#each report.blocks.slice(0, 16) as b, i (i)}
              <p class:li={b.kind === 'li'}>{#each b.runs as r, j (j)}{#if r.bold}<strong>{r.text}</strong>{:else}{r.text}{/if}{/each}</p>
            {/each}
            <SourceLine ids={['D-situation']} freshness={ec.reportFreshness} dataDate={report.date} />
          {:else}
            <p>The latest situation report could not be loaded.</p>
            <SourceLine ids={['D-situation']} />
          {/if}
        </article>
      {/if}
    </div>
  {/snippet}
</Chapter>

<style>
  .report { max-height: 100%; overflow: auto; font-size: 15px; }
  .report h3 { margin-top: 0; font-family: var(--font-sans); }
  .report p { margin: 0 0 6px; }
  .report .li { padding-left: 14px; position: relative; }
  .report .li::before { content: '•'; position: absolute; left: 0; color: var(--muted); }
</style>
```

`src/lib/chapters/C06Reroute.svelte`
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ROUTE_FRAME } from '$lib/geo/projection';
  import { loadCountries } from '$lib/geo/countries';
  import { routeLengthKm } from '$lib/geo/route';
  import { ROUTE_PLANNED, ROUTE_REROUTED, HERO, countrySpans } from '$lib/story/flight';
  import { routeCharges, type ZoneCharge } from '$lib/sim/charges';
  import { ZONES } from '$lib/story/charges-data';
  import { fmtInt } from '$lib/viz/chart-utils';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('reroute');
  let charges: { planned: ZoneCharge[]; rerouted: ZoneCharge[] } | null = $state(null);
  onMount(async () => {
    const fc = await loadCountries();
    charges = {
      planned: routeCharges(await countrySpans(ROUTE_PLANNED, fc), ZONES, HERO.mtowT),
      rerouted: routeCharges(await countrySpans(ROUTE_REROUTED, fc), ZONES, HERO.mtowT)
    };
  });
  const sum = (z: ZoneCharge[]) => z.reduce((s, x) => s + x.charge, 0);
  const extraKm = Math.round(routeLengthKm(ROUTE_REROUTED) - routeLengthKm(ROUTE_PLANNED));
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      <div class="map-wrap">
        <BaseMap label="Planned route through the regulated sector and the proposed reroute" frame={ROUTE_FRAME}>
          {#snippet children({ projection, path })}
            <RouteMap {projection} {path} regulated showPlane={false}
              progress={step === 1 ? progress : 1}
              routes={step < 3
                ? [{ id: 'planned', coords: ROUTE_PLANNED, style: 'ghost' }, ...(step >= 1 ? [{ id: 'rrp', coords: ROUTE_REROUTED, style: 'active' as const }] : [])]
                : [{ id: 'planned', coords: ROUTE_PLANNED, style: 'ghost' }, { id: 'flown', coords: ROUTE_REROUTED, style: 'active' }]} />
          {/snippet}
        </BaseMap>
        {#if step === 2 && charges}
          <table class="panel decision">
            <caption>Planned vs rerouted (illustrative)</caption>
            <thead><tr><th></th><th>Via Reims</th><th>Via Karlsruhe</th></tr></thead>
            <tbody>
              <tr><th scope="row">ATFM delay</th><td>+{HERO.ctotDelayMin} min</td><td>+{HERO.rerouteCtotDelayMin} min</td></tr>
              <tr><th scope="row">Extra distance</th><td>—</td><td>+{extraKm} km</td></tr>
              <tr><th scope="row">En-route charges</th><td>€{fmtInt(sum(charges.planned))}</td><td>€{fmtInt(sum(charges.rerouted))}</td></tr>
            </tbody>
          </table>
        {/if}
      </div>
      <SourceLine ids={step === 2 ? ['S7', 'S3', 'S34', 'D-naturalearth'] : ['S7', 'S1', 'D-naturalearth']} illustrative />
    </div>
  {/snippet}
</Chapter>

<style>
  .decision { position: absolute; right: 16px; bottom: 16px; font-size: 14px; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  .decision caption { text-align: left; font-weight: 650; padding-bottom: 6px; }
  .decision th, .decision td { padding: 4px 10px; text-align: left; border-bottom: 1px solid var(--grid); }
</style>
```

`src/lib/chapters/C07Ground.svelte`
```svelte
<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import AcdmTimeline from '$lib/viz/AcdmTimeline.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { punctualityLines, linesTable, dayNumLabel } from '$lib/story/derive';
  import { fmtDec } from '$lib/viz/chart-utils';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('ground');
  const STAGES = ['milestones', 'turnaround', 'milestones', 'window'] as const;
  const ebbr = $derived(bundle('EBBR'));
  const lines = $derived(punctualityLines(ebbr, 365));
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      {#if step <= 3}
        <Figure title="FFS101 at Brussels: turnaround and A-CDM milestones" subtitle="Times UTC" sources={['S13', 'S7']} illustrative>
          <AcdmTimeline stage={STAGES[step]} />
        </Figure>
      {:else}
        <Figure title="Brussels Airport punctuality" subtitle="% of flights within 15 minutes of schedule, last 12 months" sources={['D-eurocontrol']} detail="Brussels (EBBR)" freshness={ec.freshness.EBBR ?? null} dataDate={ebbr?.dataDate}
          table={linesTable(lines, 'Date', dayNumLabel, (v) => fmtDec(v, 1), 'Brussels punctuality')}>
          <LineChart series={lines} label="Brussels departure and arrival punctuality" xFormat={dayNumLabel} yFormat={(v) => `${Math.round(v)}%`} yDomain={[0, 100]} />
        </Figure>
      {/if}
    </div>
  {/snippet}
</Chapter>
```

`src/lib/chapters/C08Enroute.svelte`
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import ProfileChart from '$lib/viz/ProfileChart.svelte';
  import ChargesBar from '$lib/viz/ChargesBar.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ROUTE_FRAME } from '$lib/geo/projection';
  import { loadCountries } from '$lib/geo/countries';
  import type { Span } from '$lib/geo/route';
  import { ROUTE_PLANNED, ROUTE_REROUTED, HERO, anspSpans, countrySpans, type AnspKey } from '$lib/story/flight';
  import { routeCharges, type ZoneCharge } from '$lib/sim/charges';
  import { ZONES } from '$lib/story/charges-data';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('enroute');
  const KEY = [0.04, 0.2, 0.75, 1, 1];
  let spans: Span<AnspKey>[] = $state([]);
  let charges: { planned: ZoneCharge[]; rerouted: ZoneCharge[] } | null = $state(null);
  onMount(async () => {
    const fc = await loadCountries();
    spans = anspSpans(ROUTE_REROUTED, fc);
    charges = {
      planned: routeCharges(await countrySpans(ROUTE_PLANNED, fc), ZONES, HERO.mtowT),
      rerouted: routeCharges(await countrySpans(ROUTE_REROUTED, fc), ZONES, HERO.mtowT)
    };
  });
  const along = (step: number, p: number) => KEY[step] + ((KEY[step + 1] ?? 1) - KEY[step]) * p;
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      {#if step <= 2}
        <div class="map-wrap">
          <BaseMap label="FFS101 en route, coloured by the air navigation service provider in control" frame={ROUTE_FRAME}>
            {#snippet children({ projection, path })}
              <RouteMap {projection} {path} showAnsp progress={along(step, progress)} routes={[{ id: 'flown', coords: ROUTE_REROUTED, spans, style: 'active' }]} />
            {/snippet}
          </BaseMap>
        </div>
        <ProfileChart route={ROUTE_REROUTED} {spans} progress={along(step, progress)} />
        <SourceLine ids={['S28', 'S5', 'S30', 'D-naturalearth']} illustrative detail="ANSP assignment approximated from country and flight level" />
      {:else if charges}
        <Figure title="Who gets paid: en-route charges by zone" subtitle="A320neo (MTOW 79 t), unit rates for October 2026" sources={['S32', 'S33', 'S34', 'S35']} illustrative
          table={{ caption: 'Route charges by zone', columns: [{ key: 'route', label: 'Route' }, { key: 'zone', label: 'Zone' }, { key: 'km', label: 'km' }, { key: 'charge', label: '€' }],
            rows: [...charges.planned.map((z) => ({ route: 'Planned', zone: z.zone.label, km: z.km, charge: z.charge })), ...charges.rerouted.map((z) => ({ route: 'Rerouted', zone: z.zone.label, km: z.km, charge: z.charge }))] }}>
          <ChargesBar planned={charges.planned} rerouted={charges.rerouted} mode={step === 3 ? 'distance' : 'compare'} />
        </Figure>
      {/if}
    </div>
  {/snippet}
</Chapter>
```

`src/lib/chapters/C09Arrival.svelte`
```svelte
<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import HeroNumber from '$lib/viz/HeroNumber.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ROUTE_FRAME, ROME_FRAME } from '$lib/geo/projection';
  import { ROUTE_REROUTED, ACDM } from '$lib/story/flight';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { punctualityLines, linesTable, dayNumLabel } from '$lib/story/derive';
  import { fmtDec } from '$lib/viz/chart-utils';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('arrival');
  const lirf = $derived(bundle('LIRF'));
  const lines = $derived(punctualityLines(lirf, 365));
  const hm = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      {#if step === 0}
        <div class="map-wrap">
          <BaseMap label="FFS101 descending into Rome Fiumicino" frame={ROUTE_FRAME} frameTo={ROME_FRAME} t={progress}>
            {#snippet children({ projection, path })}
              <RouteMap {projection} {path} progress={0.85 + 0.149 * progress} routes={[{ id: 'flown', coords: ROUTE_REROUTED, style: 'active' }]} />
            {/snippet}
          </BaseMap>
        </div>
        <SourceLine ids={['S30', 'D-naturalearth']} illustrative />
      {:else if step === 1}
        <Figure title="Arrival vs schedule" sources={['S1']} illustrative>
          <HeroNumber value={hm(ACDM.aibt) - hm(ACDM.sta)} label="minutes after the scheduled 07:05 — on time" format={(n) => `+${Math.round(n)}`} sub="In-block {ACDM.aibt} UTC · 76.1% of European arrivals were on time in 2025" />
        </Figure>
      {:else}
        <Figure title="Rome Fiumicino punctuality" subtitle="% within 15 minutes of schedule, last 12 months" sources={['D-eurocontrol']} detail="Rome Fiumicino (LIRF)" freshness={ec.freshness.LIRF ?? null} dataDate={lirf?.dataDate}
          table={linesTable(lines, 'Date', dayNumLabel, (v) => fmtDec(v, 1), 'Rome Fiumicino punctuality')}>
          <LineChart series={lines} label="Rome Fiumicino departure and arrival punctuality" xFormat={dayNumLabel} yFormat={(v) => `${Math.round(v)}%`} yDomain={[0, 100]} />
        </Figure>
      {/if}
    </div>
  {/snippet}
</Chapter>
```

`src/lib/chapters/C10PostOps.svelte`
```svelte
<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import StakeholderMatrix from '$lib/viz/StakeholderMatrix.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { co2Lines, trafficLines, linesTable, dayNumLabel } from '$lib/story/derive';
  import { doyLabel, fmtInt, fmtDec } from '$lib/viz/chart-utils';
  import { ENTITIES, type EntityKey } from '$lib/data/eurocontrol';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('postops');
  const net = $derived(bundle('network'));
  const ANSPS: EntityKey[] = ['skeyes', 'MUAC', 'DSNA', 'DFS', 'Skyguide', 'ENAV'];
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      {#if step <= 2}
        <Figure title="Who touched FFS101, and when" subtitle="Each dot: a stakeholder acting in a phase (hover for details)" sources={['S7', 'S13', 'S8']} illustrative>
          <StakeholderMatrix upTo={step === 0 ? 'arrival' : 'postops'} />
        </Figure>
      {:else if step === 3}
        <Figure title="CO₂ and departures, indexed" subtitle="EUROCONTROL Data app monthly indices" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}
          table={linesTable(co2Lines(net), 'Month', dayNumLabel, (v) => fmtDec(v, 1), 'CO2 and departures indices')}>
          <LineChart series={co2Lines(net)} label="CO2 index and departures index" xFormat={dayNumLabel} yFormat={(v) => fmtDec(v, 0)} />
        </Figure>
      {:else}
        <div class="sm">
          {#each ANSPS as k (k)}
            {@const b = bundle(k)}
            <div class="cell panel">
              <h4>{ENTITIES[k].label}</h4>
              <LineChart series={trafficLines(b, [2019, 2026])} label="{ENTITIES[k].label} daily flights 2026 vs 2019" height={110} xFormat={doyLabel} yFormat={fmtInt} directLabels={false} xTicks={[1, 182]} yTicks={2} />
            </div>
          {/each}
        </div>
        <SourceLine ids={['D-eurocontrol']} detail="daily flights handled, 7-day average; blue 2026, grey 2019" freshness={ec.freshness.MUAC ?? null} dataDate={bundle('MUAC')?.dataDate} />
      {/if}
    </div>
  {/snippet}
</Chapter>

<style>
  .sm { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; overflow: auto; }
  .cell { padding: 10px; }
  h4 { margin: 0 0 4px; font-size: 13px; font-weight: 650; }
</style>
```

`src/lib/chapters/C11Sources.svelte`
```svelte
<script lang="ts">
  import { SOURCES } from '$lib/story/sources';
  import { GLOSSARY } from '$lib/story/glossary';
  import { ec, sky } from '$lib/data/liveState.svelte';
  import { ageLabel } from '$lib/data/sky';
  const list = Object.values(SOURCES).sort((a, b) => {
    const n = (id: string) => (id.startsWith('S') ? +id.slice(1) : 1000);
    return n(a.id) - n(b.id) || a.id.localeCompare(b.id);
  });
</script>

<section class="sources" id="sources" aria-labelledby="sources-title">
  <h2 id="sources-title">Sources & method</h2>
  <h3>How this was made</h3>
  <ul>
    <li><strong>FFS101 is fictional.</strong> Its callsign, times, route, turnaround and regulation are illustrative, built to follow the real procedures described in the sources below. Every general fact carries a citation.</li>
    <li><strong>Live data.</strong> European traffic, delay, punctuality and CO₂ come from the EUROCONTROL Data app API. Your browser fetches them live; if that fails, the page uses a snapshot refreshed when the site was built (snapshot: {ec.snapshot ? new Date(ec.snapshot.generatedAt).toUTCString() : '—'}).</li>
    <li><strong>The sky snapshot</strong> comes from OpenSky Network state vectors (fallback: adsb.lol), fetched by a scheduled build about every 30 minutes ({sky.snap ? ageLabel(sky.snap.fetchedAt) : 'unavailable'}).</li>
    <li><strong>Simplifications.</strong> The slot simulator is a first-planned-first-served model of CASA. Route charges use along-track distances on the illustrative route; real billing uses the route recorded by the Network Manager. Control-centre assignment is approximated from country and flight level. Prior years' traffic is aligned by day of year; daily values are 7-day averages.</li>
  </ul>
  <h3>Sources</h3>
  <ol class="src">
    {#each list as s (s.id)}
      <li id="src-{s.id}"><span class="id">{s.id.startsWith('S') ? s.id.slice(1) : 'data'}</span> {s.publisher}, <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>. Accessed {s.accessed}.</li>
    {/each}
  </ol>
  <h3>Glossary</h3>
  <dl class="gl">
    {#each Object.values(GLOSSARY).sort((a, b) => a.term.localeCompare(b.term)) as g (g.term)}
      <dt>{g.term}</dt><dd><em>{g.expansion}.</em> {g.definition}</dd>
    {/each}
  </dl>
</section>

<style>
  .sources { max-width: 820px; margin: 0 auto; padding: 20vh 16px 120px; font-size: 16px; }
  .src { list-style: none; padding: 0; }
  .src li { margin: 0 0 6px; overflow-wrap: anywhere; }
  .id { display: inline-block; min-width: 38px; font-weight: 650; color: var(--ink-2); }
  .gl dt { font-weight: 700; margin-top: 8px; }
  .gl dd { margin: 0 0 0 16px; color: var(--ink-2); }
</style>
```

`src/routes/+page.svelte`
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { startLoading } from '$lib/data/liveState.svelte';
  import MissionClock from '$lib/ui/MissionClock.svelte';
  import C00ColdOpen from '$lib/chapters/C00ColdOpen.svelte';
  import C01Strategic from '$lib/chapters/C01Strategic.svelte';
  import C02Airspace from '$lib/chapters/C02Airspace.svelte';
  import C03Filing from '$lib/chapters/C03Filing.svelte';
  import C04Twist from '$lib/chapters/C04Twist.svelte';
  import C05Delay from '$lib/chapters/C05Delay.svelte';
  import C06Reroute from '$lib/chapters/C06Reroute.svelte';
  import C07Ground from '$lib/chapters/C07Ground.svelte';
  import C08Enroute from '$lib/chapters/C08Enroute.svelte';
  import C09Arrival from '$lib/chapters/C09Arrival.svelte';
  import C10PostOps from '$lib/chapters/C10PostOps.svelte';
  import C11Sources from '$lib/chapters/C11Sources.svelte';
  onMount(startLoading);
</script>

<svelte:head>
  <title>A Full Flight Story — how a flight becomes a flight in Europe</title>
  <meta name="description" content="Follow FFS101 from Brussels to Rome — from airport slots ten months ahead to the flight plan, an ATFM slot, a reroute and post-ops — with live EUROCONTROL data." />
</svelte:head>

<MissionClock />
<main>
  <header class="intro">
    <p class="kicker">A data story · with live EUROCONTROL data</p>
    <h1>A Full Flight Story</h1>
    <p class="dek">How a flight becomes a flight in Europe: following FFS101 from Brussels to Rome, from ten months before take-off to long after landing.</p>
    <p class="note">FFS101 is fictional; the procedures, the stakeholders and every number are real and sourced. Times are UTC. <a href="#sources">Sources & method</a></p>
    <p class="hint" aria-hidden="true">Scroll ↓</p>
  </header>
  <C00ColdOpen /><C01Strategic /><C02Airspace /><C03Filing /><C04Twist /><C05Delay />
  <C06Reroute /><C07Ground /><C08Enroute /><C09Arrival /><C10PostOps /><C11Sources />
</main>

<style>
  .intro { min-height: 100svh; display: flex; flex-direction: column; justify-content: center; max-width: 820px; margin: 0 auto; padding: calc(var(--clock-h) + 24px) 16px 24px; }
  .kicker { text-transform: uppercase; letter-spacing: 0.12em; font-size: 13px; color: var(--ink-2); }
  h1 { font-size: clamp(48px, 9vw, 112px); margin: 0.1em 0; }
  .dek { font-size: clamp(20px, 2.4vw, 26px); color: var(--ink-2); max-width: 36ch; }
  .note { font-size: 15px; color: var(--muted); }
  .hint { margin-top: 10vh; color: var(--muted); }
</style>
```

- [ ] **Step 7: Verify**

Run: `npm test && npm run check && npm run build`
Expected: all unit tests pass; svelte-check 0 errors; build completes and prerenders `/`.

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts` → PASS (the h1 still reads "A Full Flight Story").

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "feat: assemble the FFS101 story — copy, chapters and live data views"
```

---

### Task 15: End-to-end QA — fallbacks, responsiveness, accessibility, visual review

**Files:**
- Create: `tests/e2e/helpers.ts`, `tests/e2e/story.spec.ts`, `tests/e2e/fallbacks.spec.ts`, `tests/e2e/responsive.spec.ts`, `tests/e2e/a11y.spec.ts`
- Modify: `tests/e2e/scroll.spec.ts` (import `scrollStepTo` from helpers), any component that fails a check below

**Interfaces:**
- Produces: `scrollStepTo(page, selector, frac?)`, `walkStory(page, onStep?)`, `trackErrors(page): string[]`, `mockEurocontrolLive(page, date)`

- [ ] **Step 1: Helpers**

`npm i -D @axe-core/playwright`

`tests/e2e/helpers.ts`
```ts
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

export async function scrollStepTo(page: Page, selector: string, frac = 0.3) {
  await page.evaluate(([sel, f]) => {
    const el = document.querySelector(sel as string)!;
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * (f as number));
  }, [selector, frac]);
}

export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  return errors;
}

/** Visit every step of every chapter in order. */
export async function walkStory(page: Page, onStep?: (chapterId: string, i: number) => Promise<void>) {
  const chapters = await page.locator('section.chapter').evaluateAll((els) => els.map((e) => ({ id: e.id, n: e.querySelectorAll('[data-step]').length })));
  for (const c of chapters) {
    for (let i = 0; i < c.n; i++) {
      await scrollStepTo(page, `#${c.id} [data-step="${i}"]`);
      await page.waitForFunction(([id, idx]) => document.getElementById(id as string)?.dataset.activeStep === String(idx), [c.id, i]);
      await onStep?.(c.id, i);
    }
  }
}

const fx = (f: string) => readFileSync(`tests/fixtures/eurocontrol/${f}`, 'utf8');

/** Serve fixture data from the live API, stamped with a newer sync date so the page upgrades to "Live". */
export async function mockEurocontrolLive(page: Page, date = '2099-01-01') {
  await page.route('https://api-data-app.eurocontrol.int/api/**', (route) => {
    const u = new URL(route.request().url());
    const body: Record<string, string> = {
      '/api/syncs': JSON.stringify({ data: [{ id: 1, syncDate: `${date}T00:00:00+00:00` }] }),
      '/api/traffic_charts': fx('traffic_charts-network.json'),
      '/api/delay_charts': fx('delay_charts-network.json'),
      '/api/punctualities_charts': fx('punctualities_charts-network.json'),
      '/api/co2_charts': fx('co2_charts-network.json'),
      '/api/traffic_networks': fx('traffic_networks-network.json'),
      '/api/delay_networks': fx('delay_networks-network.json'),
      '/api/situation_reports': fx('situation_reports.json')
    };
    return route.fulfill({ status: 200, contentType: 'application/json', body: body[u.pathname] ?? '{"data":[]}' });
  });
}
```

Update `tests/e2e/scroll.spec.ts`: delete its local `scrollStepTo` and add `import { scrollStepTo } from './helpers';`.

- [ ] **Step 2: Full story walk**

`tests/e2e/story.spec.ts`
```ts
import { test, expect } from '@playwright/test';
import { walkStory, trackErrors } from './helpers';

test('walks every step with no errors; every step and figure is sourced', async ({ page }, info) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort()); // deterministic: snapshot path
  const errors = trackErrors(page);
  await page.goto('/');
  await walkStory(page, async (id, i) => {
    const card = page.locator(`#${id} [data-step="${i}"] .card`);
    await expect(card.locator('.cite, .badge').first()).toBeVisible();
    const graphic = page.locator(`#${id} .graphic`);
    await expect(graphic.locator('.source').first()).toBeVisible();
    await page.screenshot({ path: `screenshots/${info.project.name}/${id}-${i}.png` });
  });
  await expect(page.locator('#sources li').first()).toBeVisible();
  // aborted live fetches surface as console.info, never console.error
  expect(errors.filter((e) => !e.includes('net::ERR_FAILED'))).toEqual([]);
});
```

Run: `npm run test:e2e -- tests/e2e/story.spec.ts` → PASS. Fix any step whose graphic lacks a `.source` line (add a `SourceLine` or wrap in `Figure`).

- [ ] **Step 3: Fallbacks and live upgrade**

`tests/e2e/fallbacks.spec.ts`
```ts
import { test, expect } from '@playwright/test';
import { scrollStepTo, mockEurocontrolLive, trackErrors } from './helpers';

test('EUROCONTROL down → snapshot badges, no errors', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  const errors = trackErrors(page);
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="1"]');
  await expect(page.locator('#cold-open .fresh')).toHaveText(/Snapshot/);
  expect(errors.filter((e) => !e.includes('net::ERR_FAILED'))).toEqual([]);
});

test('EUROCONTROL newer than snapshot → live badge', async ({ page }) => {
  await mockEurocontrolLive(page);
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="1"]');
  await expect(page.locator('#cold-open .fresh')).toHaveText(/Live/);
});

test('slow API (beyond 8 s timeout) still shows the snapshot', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', async (r) => { await new Promise((res) => setTimeout(res, 12_000)); await r.abort(); });
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="1"]');
  await expect(page.locator('#cold-open .fresh')).toHaveText(/Snapshot/, { timeout: 5_000 });
});

test('empty sky snapshot → honest empty state', async ({ page }) => {
  await page.route('**/data/sky.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'none', count: 0, aircraft: [] }) }));
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="0"]');
  await expect(page.getByTestId('sky-empty')).toBeVisible();
});

test('stale sky snapshot → says how old it is', async ({ page }) => {
  const old = new Date(Date.now() - 3 * 86_400_000).toISOString();
  await page.route('**/data/sky.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ fetchedAt: old, source: 'opensky', count: 1, aircraft: [{ id: 'a', cs: 'TEST1', lon: 4.5, lat: 50.9, alt: 35000, trk: 90, gs: 450 }] }) }));
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="0"]');
  await expect(page.locator('#cold-open .hud')).toContainText('3 days ago');
  await expect(page.locator('#cold-open .hud')).toContainText('may be paused');
});
```

Run: `npm run test:e2e -- tests/e2e/fallbacks.spec.ts` → PASS.

- [ ] **Step 4: Responsive and reduced motion**

`tests/e2e/responsive.spec.ts`
```ts
import { test, expect } from '@playwright/test';
import { walkStory } from './helpers';

test('no horizontal overflow at any step', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  await page.goto('/');
  await walkStory(page, async (id, i) => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${id} step ${i}`).toBeLessThanOrEqual(0);
  });
});

test('charts redraw on resize', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/');
  const svg = page.getByRole('img', { name: 'Daily flights in the European network by year' });
  await page.locator('#strategic [data-step="3"]').scrollIntoViewIfNeeded();
  await page.evaluate(() => { const el = document.querySelector('#strategic [data-step="3"]')!; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3); });
  const w1 = Number(await svg.getAttribute('width'));
  await page.setViewportSize({ width: 1000, height: 800 });
  await expect.poll(async () => Number(await svg.getAttribute('width'))).toBeLessThan(w1);
});

test('reduced motion shows final numbers immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  await page.goto('/');
  await page.evaluate(() => { const el = document.querySelector('#cold-open [data-step="1"]')!; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3); });
  const v = page.locator('#cold-open .hero .v');
  await expect(v).not.toHaveText('—');
  const first = await v.textContent();
  await page.waitForTimeout(300);
  expect(await v.textContent()).toBe(first); // no count-up animation
});
```

`tests/e2e/a11y.spec.ts`
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { scrollStepTo } from './helpers';

for (const theme of ['dark', 'light'] as const) {
  test(`no serious axe violations (${theme})`, async ({ page }) => {
    await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await page.goto('/');
    for (const sel of ['#cold-open [data-step="1"]', '#twist [data-step="4"]', '#ground [data-step="3"]', '#sources']) {
      await scrollStepTo(page, sel);
      const r = await new AxeBuilder({ page }).analyze();
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), sel).toEqual([]);
    }
  });
}
```

Run: `npm run test:e2e -- tests/e2e/responsive.spec.ts tests/e2e/a11y.spec.ts` → PASS. Fix violations at the source (contrast via tokens, labels on inputs, roles), not by excluding rules.

- [ ] **Step 5: Visual review**

Read (Read tool) the screenshots from Step 2 for both projects: `screenshots/desktop/*.png`, `screenshots/mobile/*.png`. Checklist per image: text card never hides the key part of the graphic on mobile; no overlapping labels; tooltips not clipped; direct labels inside the frame; the map route fully visible; both themes legible (repeat Step 2 once with `localStorage.theme = 'light'` via `page.addInitScript` and spot-check 5 images). Fix issues, re-run Steps 2–4.

- [ ] **Step 6: Full suite and commit**

Run: `npm test && npm run check && npm run test:e2e`
Expected: everything passes.

```bash
git add tests src package.json package-lock.json
git commit -m "test: end-to-end story walk, fallbacks, responsiveness and accessibility"
```

---

### Task 16: Deployment (GitHub Pages + 30-minute data refresh) and README

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: npm scripts `fetch:eurocontrol`, `fetch:sky`, `test`, `build`; `BASE_PATH` env.
- Produces: a Pages site at `https://<owner>.github.io/a-full-flight-story/`, rebuilt every 30 minutes with fresh `static/data/*.json`.

- [ ] **Step 1: Workflow**

`.github/workflows/deploy.yml`
```yaml
name: Build & deploy

on:
  push:
    branches: [main]
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Refresh EUROCONTROL snapshot (keeps committed snapshot on failure)
        run: npm run fetch:eurocontrol
        continue-on-error: true
      - name: Refresh airborne-traffic snapshot (OpenSky, fallback adsb.lol)
        run: npm run fetch:sky
        continue-on-error: true
        env:
          OPENSKY_CLIENT_ID: ${{ secrets.OPENSKY_CLIENT_ID }}
          OPENSKY_CLIENT_SECRET: ${{ secrets.OPENSKY_CLIENT_SECRET }}
      - name: Unit tests
        if: github.event_name != 'schedule'
        run: npm test
      - name: Build
        run: npm run build
        env:
          BASE_PATH: /${{ github.event.repository.name }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Validate locally: `BASE_PATH=/a-full-flight-story npm run build && ls build/index.html build/data/eurocontrol.json build/data/sky.json` → all three exist; `grep -c '/a-full-flight-story/_app' build/index.html` → ≥ 1.

- [ ] **Step 2: README**

`README.md`
````markdown
# A Full Flight Story

A scrollytelling data story about how a flight becomes a flight in Europe — following the fictional FFS101 from Brussels to Rome, from airport slots ten months ahead to post-operations — with live EUROCONTROL data.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # unit tests (Vitest)
npm run test:e2e       # Playwright: desktop + 390 px mobile
```

## Data

| Data | How it gets here |
|---|---|
| Traffic, ATFM delay, punctuality, CO₂, weekly situation report | EUROCONTROL Data app API. `npm run fetch:eurocontrol` writes `static/data/eurocontrol.json`; the browser also fetches live and falls back to the snapshot. |
| Aircraft currently airborne | `npm run fetch:sky` writes `static/data/sky.json` from OpenSky Network (fallback adsb.lol). Optional `OPENSKY_CLIENT_ID` / `OPENSKY_CLIENT_SECRET` raise rate limits. |
| Facts and citations | `docs/research/flight-lifecycle.md`; `npm run sources` regenerates `src/lib/story/sources.generated.json` from its Sources table. |

The GitHub Action rebuilds and redeploys every 30 minutes so the sky snapshot stays fresh. GitHub pauses scheduled workflows after 60 days without repository activity; re-enable it from the Actions tab.

## Method

FFS101 is fictional; the process, stakeholders and numbers are real and cited. See the "Sources & method" section at the end of the story for the simplifications (CASA model, route charges, ANSP assignment).
````

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: deploy to GitHub Pages with a 30-minute data refresh"
```

- [ ] **Step 4: Publish — ask first**

Creating a GitHub repository, pushing and enabling Pages are outward-facing. **Stop and ask Quinten** to confirm: repository name/owner (`quinten-goens/a-full-flight-story`), public vs private (Pages on a private repo needs a paid plan), and whether to add OpenSky credentials as secrets. Only after a yes:

```bash
gh repo create quinten-goens/a-full-flight-story --public --source . --remote origin --push
gh api -X POST repos/quinten-goens/a-full-flight-story/pages -f build_type=workflow
gh workflow run deploy.yml && gh run watch
```
Expected: the run succeeds and `gh api repos/quinten-goens/a-full-flight-story/pages --jq .html_url` prints the site URL. Open it, scroll the whole story, and confirm the badges switch to "● Live" for EUROCONTROL data.
