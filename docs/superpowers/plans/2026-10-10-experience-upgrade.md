# Experience Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the FFS101 story feel alive and current on every visit and make the ATM phases (strategic, pre-tactical, tactical, post-ops) legible, with smoother transitions, navigation, honest freshness, faster phones and share/SEO metadata.

**Architecture:** Same SvelteKit 2 / Svelte 5 static site. New pure, unit-tested modules (`phases.ts`, `timescale.ts`, `freshness.ts`, `label-layout.ts`, `map-transform.ts`) feed new components (phase band, dividers, overview timeline, chapter drawer, sky-age label). Chapter graphics become lazily loaded components so the first view ships ≤250 KB gzip JS; the map uses a pre-filtered Europe topology drawn once per size and zoomed with an exact SVG transform. The GitHub Actions refresh runs every 10 minutes; the browser polls the deployed `sky.json`.

**Tech Stack:** unchanged (SvelteKit ^2.70, Svelte ^5.57, D3 ^7.9, Scrollama, Vitest, Playwright) + dev deps `topojson-server`, `topojson-simplify` (+ their `@types/*`).

**Spec:** `docs/superpowers/specs/2026-10-10-experience-upgrade-design.md` (approved). Base spec still applies: `docs/superpowers/specs/2026-10-09-full-flight-story-design.md`.

## Global Constraints

- Sources everywhere: every new visual/copy carries `SourceLine`/citation chips or the Illustrative label; `tests/unit/story-content.test.ts` must keep passing.
- Never render third-party text with `{@html}`. The only `{@html}` allowed is our own JSON-LD (Task 11), with `<` escaped.
- Every animation goes through `dur(ms)` from `$lib/scroll/motion` (0 under `prefers-reduced-motion: reduce`); CSS transitions are already neutralised by the global reduced-motion rule in `app.css`.
- Phase colours are never the only cue: always paired with the phase's text label.
- 390 px wide: no horizontal scroll (existing `responsive.spec.ts` must pass).
- New user-facing UI strings (not story copy) go in `src/lib/ui/ui-strings.ts` (prep for the multilingual project).
- Refresh cadence: workflow cron `*/10 * * * *`; no OpenSky secrets (anonymous + adsb.lol fallback).
- Verified fact (GitHub docs, 2026-10-10): the 10 builds/hour Pages soft limit "does not apply if you build and publish your site with a custom GitHub Actions workflow".
- Budgets: initial JS ≤250 KB gzip; no long task >200 ms during scripted scroll at 4× CPU throttle; FCP ≤2.5 s at 1.6 Mbps/150 ms RTT; `src/lib/geo/europe.topo.json` ≤120 KB.
- Commits: brief subject (+ body when needed), **no Claude co-author/"Generated with" lines**. Pushing/deploying needs Quinten's go-ahead.
- npm: `npm_config_cache=/private/tmp/claude-501/npm-cache` if `~/.npm` gives EACCES.

## Review Focus

1. **Data older than yesterday or missing** (weekend publication lag, API down + old snapshot) → copy says "on Thu 8 Oct" / "on the latest day available", never a false "yesterday". Pinned in Task 7 (`freshness.test.ts`).
2. **Poll returns an older, empty or malformed `sky.json`** (cron lag, failed refresh) → current dots stay; never regress to older data; no errors. Pinned in Task 8 (`sky.test.ts` `newerSky`, `sky-refresh.spec.ts`).
3. **Deep link / reload into a chapter whose graphic is lazy-loaded** → graphic loads, clock + phase correct. Pinned in Task 10 (`nav.spec.ts` extension).
4. **Keyboard & screen-reader use of the chapter drawer** (Esc, focus return, focus inside) and **reduced motion** (animations instant). Pinned in Tasks 5 and 6.
5. **Theme toggle with phase colours** → phase band, pills and dividers legible in both themes (axe colour-contrast). Pinned in Task 12 (`a11y.spec.ts` extension).

---

## File Structure

```
src/lib/story/types.ts            (modify) AtmPhase type; ChapterDef.phase
src/lib/story/phases.ts           (new)    ATM_PHASES, phaseOf, atmPhaseOfEvent, firstChapterOfPhase, phaseClockRanges
src/lib/story/chapters.ts         (modify) phase per chapter; chapter 2 split → 'airspace' + 'week-before'; freshness tokens
src/lib/story/timescale.ts        (new)    hoursFromEobt, timeScale, TIME_TICKS, phaseSpans
src/lib/story/freshness.ts        (new)    dayPhrase, livePhrase, currentYear, fmtDayShort
src/lib/story/richtext.ts         (modify) {{name:arg}} var runs
src/lib/viz/label-layout.ts       (new)    stackRows, spreadAlong
src/lib/geo/map-transform.ts      (new)    projectionTransform
src/lib/geo/europe.topo.json      (gen)    Europe-only topology
scripts/build-geo.ts              (new)
scripts/og-image.ts               (new)    static/og.png
src/lib/site.ts                   (new)    SITE_URL, SITE_TITLE, SITE_DESCRIPTION
src/lib/ui/ui-strings.ts          (new)
src/lib/ui/PhaseDivider.svelte · ChapterDrawer.svelte · SkyAge.svelte · Swap.svelte   (new)
src/lib/viz/OverviewTimeline.svelte                                                  (new)
src/lib/scroll/reveal.ts · near.ts                                                   (new) Svelte actions
src/lib/chapters/graphics/G00…G10 (+ G02b).svelte   (new; replace C00–C10)
src/lib/chapters/registry.ts       (new)    lazy graphic loaders by chapter id
src/lib/ui/Chapter.svelte · MissionClock.svelte · RichText.svelte                    (modify)
src/lib/viz/BaseMap.svelte · BarChart.svelte · CasaQueue.svelte · RouteMap.svelte · SkyCanvas.svelte (modify)
src/lib/data/sky.ts · liveState.svelte.ts                                           (modify)
src/routes/+page.svelte · src/app.css · static/{favicon.svg,og.png,robots.txt,sitemap.xml}
.github/workflows/deploy.yml · scripts/fetch-sky.ts · README.md
tests/unit/{phases,timescale,freshness,label-layout,map-transform,geo-build}.test.ts (new)
tests/e2e/{phase,nav,transitions,sky-refresh,perf,seo}.spec.ts (new); fallbacks.spec.ts, scroll dev page (modify)
```

---

### Task 1: Phase model, chapter split and phase colours

**Files:**
- Modify: `src/lib/story/types.ts`, `src/lib/story/chapters.ts`, `src/app.css`, `src/routes/dev/scroll/+page.svelte`
- Create: `src/lib/story/phases.ts`
- Test: `tests/unit/phases.test.ts`

**Interfaces:**
- Produces:
  - `type AtmPhase = 'strategic' | 'pretactical' | 'tactical' | 'postops'` (in `types.ts`); `ChapterDef.phase: AtmPhase | null`
  - `interface PhaseDef { id: AtmPhase; label: string; horizon: string; decides: string; sources: string[]; color: string }` (`color` = `'var(--phase-<id>)'`)
  - `ATM_PHASES: PhaseDef[]`, `phaseOf(id: AtmPhase): PhaseDef`, `phaseIndex(id: AtmPhase): number`
  - `atmPhaseOfEvent(p: Phase): AtmPhase` (maps flight.ts event phases)
  - `firstChapterOfPhase(chapters: ChapterDef[]): Record<AtmPhase, string>`
  - `phaseClockRanges(chapters: ChapterDef[]): { id: AtmPhase; start: number; end: number }[]`
  - New chapter id `'week-before'` (steps `as-military`, `as-pretactical` moved from `'airspace'`).

- [ ] **Step 1: Failing test** — `tests/unit/phases.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { ATM_PHASES, phaseIndex, atmPhaseOfEvent, firstChapterOfPhase, phaseClockRanges } from '$lib/story/phases';
import { CHAPTERS } from '$lib/story/chapters';
import { EVENTS } from '$lib/story/flight';
import { SOURCES } from '$lib/story/sources';

describe('ATM phases', () => {
  it('are ordered and cited', () => {
    expect(ATM_PHASES.map((p) => p.id)).toEqual(['strategic', 'pretactical', 'tactical', 'postops']);
    for (const p of ATM_PHASES) {
      expect(p.sources.length).toBeGreaterThan(0);
      for (const s of p.sources) expect(SOURCES[s], `${p.id} → ${s}`).toBeDefined();
      expect(p.color).toBe(`var(--phase-${p.id})`);
    }
  });
  it('every chapter except the cold open has a phase and phases never go backwards', () => {
    expect(CHAPTERS[0].phase).toBeNull();
    const idx = CHAPTERS.slice(1).map((c) => phaseIndex(c.phase!));
    expect(idx.every((i) => i >= 0)).toBe(true);
    for (let i = 1; i < idx.length; i++) expect(idx[i]).toBeGreaterThanOrEqual(idx[i - 1]);
  });
  it('chapter 2 is split so the pre-tactical steps open their own chapter', () => {
    expect(CHAPTERS.find((c) => c.id === 'airspace')!.phase).toBe('strategic');
    const wb = CHAPTERS.find((c) => c.id === 'week-before')!;
    expect(wb.phase).toBe('pretactical');
    expect(wb.steps.map((s) => s.id)).toEqual(['as-military', 'as-pretactical']);
  });
  it('maps flight events to ATM phases', () => {
    expect(atmPhaseOfEvent('filing')).toBe('pretactical');
    expect(atmPhaseOfEvent('ground')).toBe('tactical');
    expect(atmPhaseOfEvent('arrival')).toBe('tactical');
    for (const e of EVENTS) expect(phaseIndex(atmPhaseOfEvent(e.phase))).toBeGreaterThanOrEqual(0);
  });
  it('finds the first chapter of each phase', () => {
    expect(firstChapterOfPhase(CHAPTERS)).toEqual({ strategic: 'strategic', pretactical: 'week-before', tactical: 'twist', postops: 'postops' });
  });
  it('derives contiguous clock ranges ending at 1', () => {
    const r = phaseClockRanges(CHAPTERS);
    expect(r.map((x) => x.id)).toEqual(['strategic', 'pretactical', 'tactical', 'postops']);
    for (let i = 0; i < r.length; i++) {
      expect(r[i].start).toBeLessThan(r[i].end);
      if (i > 0) expect(r[i].start).toBe(r[i - 1].end);
    }
    expect(r.at(-1)!.end).toBe(1);
  });
});
```
- [ ] **Step 2: Run** `npx vitest run tests/unit/phases.test.ts` → FAIL (module not found).
- [ ] **Step 3: Implement**

`src/lib/story/types.ts` — add above `StepDef` and extend `ChapterDef`:
```ts
export type AtmPhase = 'strategic' | 'pretactical' | 'tactical' | 'postops';
```
```ts
export interface ChapterDef {
  id: string;
  kicker: string;
  title: string;
  clockLabel: string;
  clock: number;
  /** ATFCM phase this chapter belongs to; null for the cold open. */
  phase: AtmPhase | null;
  steps: StepDef[];
}
```

`src/lib/story/phases.ts`
```ts
import type { AtmPhase, ChapterDef } from './types';
import type { Phase } from './flight';

export interface PhaseDef { id: AtmPhase; label: string; horizon: string; decides: string; sources: string[]; color: string }

/** ATFCM phases (research §1–2, §9; ATFCM Operations Manual [S8]). */
export const ATM_PHASES: PhaseDef[] = [
  { id: 'strategic', label: 'Strategic', horizon: '~18 months to ~1 week before', decides: 'Airport slots, airline schedules, the route network and how much capacity each piece of sky will offer.', sources: ['S8', 'S21', 'S25'], color: 'var(--phase-strategic)' },
  { id: 'pretactical', label: 'Pre-tactical', horizon: 'D−6 to D−1', decides: 'Each day’s demand against capacity, military airspace bookings and the next day’s flow plan.', sources: ['S8', 'S19'], color: 'var(--phase-pretactical)' },
  { id: 'tactical', label: 'Tactical', horizon: 'Day of operation', decides: 'Regulations and take-off slots, reroutes, the airport turnaround and every control hand-over.', sources: ['S7', 'S13'], color: 'var(--phase-tactical)' },
  { id: 'postops', label: 'Post-operations', horizon: 'After the flight', decides: 'Delay attribution, route-charge billing, performance review and lessons for the next season.', sources: ['S8', 'S32', 'S37'], color: 'var(--phase-postops)' }
];

export const phaseIndex = (id: AtmPhase) => ATM_PHASES.findIndex((p) => p.id === id);
export function phaseOf(id: AtmPhase): PhaseDef {
  const p = ATM_PHASES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown phase ${id}`);
  return p;
}

export function atmPhaseOfEvent(p: Phase): AtmPhase {
  switch (p) {
    case 'strategic': return 'strategic';
    case 'pretactical': case 'filing': return 'pretactical';
    case 'postops': return 'postops';
    default: return 'tactical';
  }
}

export function firstChapterOfPhase(chapters: ChapterDef[]): Record<AtmPhase, string> {
  const out = {} as Record<AtmPhase, string>;
  for (const c of chapters) if (c.phase && !(c.phase in out)) out[c.phase] = c.id;
  return out;
}

export function phaseClockRanges(chapters: ChapterDef[]) {
  const starts = ATM_PHASES.map((p) => {
    const clocks = chapters.filter((c) => c.phase === p.id).flatMap((c) => c.steps.map((s) => s.clock ?? c.clock));
    return { id: p.id, start: Math.min(...clocks) };
  });
  return starts.map((s, i) => ({ id: s.id, start: s.start, end: starts[i + 1]?.start ?? 1 }));
}
```

`src/lib/story/chapters.ts` — add `phase` to every chapter and split chapter 2:
- `cold-open`: add `phase: null,`
- `strategic`: `kicker: 'Chapter 1'`, add `phase: 'strategic',`
- `airspace`: `kicker: 'Chapter 2'`, add `phase: 'strategic',` and **keep only** steps `as-patchwork`, `as-rad`.
- New chapter right after `airspace`:
```ts
  {
    id: 'week-before', kicker: 'Chapter 3', title: 'The week before', clockLabel: 'D−6 → D−1', clock: 0.3, phase: 'pretactical',
    steps: [
      /* move the existing 'as-military' and 'as-pretactical' step objects here, unchanged */
    ]
  },
```
- `filing`: `kicker: 'Chapter 4 · D−1, 17:00 UTC'`, `phase: 'pretactical'`
- `twist`: `kicker: 'Chapter 5 · D-day, before dawn'`, `phase: 'tactical'`
- `delay`: `phase: 'tactical'` (kicker stays "Zoom out")
- `reroute`: `kicker: 'Chapter 6 · D-day, 03:20 UTC'`, `phase: 'tactical'`
- `ground`: `kicker: 'Chapter 7 · Brussels Airport'`, `phase: 'tactical'`
- `enroute`: `kicker: 'Chapter 8 · Airborne'`, `phase: 'tactical'`
- `arrival`: `kicker: 'Chapter 9 · Rome Fiumicino'`, `phase: 'tactical'`
- `postops`: `kicker: 'Chapter 10 · After landing'`, `phase: 'postops'`

`src/routes/dev/scroll/+page.svelte` — in the generated test chapters add `phase: null,` (so `ChapterDef` type-checks).

`src/app.css` — add phase tokens to the dark block, the light block respectively:
```css
  /* dark */ --phase-strategic: #7a6fe0; --phase-pretactical: #9a91ec; --phase-tactical: #bdb7f4; --phase-postops: #5b4fc9;
```
```css
  /* light */ --phase-strategic: #4a3aa7; --phase-pretactical: #6b5fc4; --phase-tactical: #8f85d6; --phase-postops: #3b2f9a;
```
Note: ordinal order is strategic → pretactical → tactical → postops; post-ops gets the deepest step so the four are distinct; labels always accompany them.

- [ ] **Step 4: Validate colours** — load the `dataviz` skill and run its validator from the skill base dir:
```bash
node <dataviz>/scripts/validate_palette.js "#7a6fe0,#9a91ec,#bdb7f4,#5b4fc9" --mode dark --surface "#10141d"
node <dataviz>/scripts/validate_palette.js "#4a3aa7,#6b5fc4,#8f85d6,#3b2f9a" --mode light --surface "#fcfcfb"
```
Expected: no FAIL rows (WARN on contrast is acceptable because every phase colour is paired with its label). If a FAIL appears, step the failing hex along the violet ramp and re-run; paste the summary lines into the commit body.

- [ ] **Step 5: Run** `npx vitest run && npm run check` → all pass (story-content tests included; clocks of moved steps unchanged so monotonicity holds).
- [ ] **Step 6: Commit**
```bash
git add src/lib/story src/app.css src/routes/dev/scroll tests/unit/phases.test.ts
git commit -m "feat: ATM phase model, chapter 2 split and phase colour tokens"
```

---

### Task 2: Phase band in the mission clock, phase pills and colour coding

**Files:**
- Modify: `src/lib/scroll/storyState.svelte.ts`, `src/lib/ui/Chapter.svelte`, `src/lib/ui/MissionClock.svelte`
- Create: `src/lib/ui/ui-strings.ts`
- Test: `tests/e2e/phase.spec.ts`

**Interfaces:**
- Consumes: `ATM_PHASES`, `phaseOf`, `phaseClockRanges` (Task 1), `CHAPTERS`.
- Produces: `story.phase: AtmPhase | null`; `UI` object in `ui-strings.ts`; DOM: `.clock .seg[data-phase]`, `.clock .now`, `.chapter .phase-pill`.

- [ ] **Step 1: Failing e2e** — `tests/e2e/phase.spec.ts`
```ts
import { test, expect } from '@playwright/test';
import { scrollStepTo } from './helpers';

test('top bar shows four labelled phase segments and the current phase', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  await page.goto('/');
  await expect(page.locator('.clock .seg')).toHaveCount(4);
  await scrollStepTo(page, '#twist [data-step="0"]');
  await expect(page.locator('.clock .now')).toContainText('Tactical');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', /Tactical/);
  await scrollStepTo(page, '#week-before [data-step="0"]');
  await expect(page.locator('.clock .now')).toContainText('Pre-tactical');
});

test('chapters show a phase pill in the phase colour', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#strategic .phase-pill')).toHaveText('Strategic');
  await expect(page.locator('#postops .phase-pill')).toHaveText('Post-operations');
  await expect(page.locator('#cold-open .phase-pill')).toHaveCount(0);
});
```
- [ ] **Step 2: Run** `npx playwright test tests/e2e/phase.spec.ts` → FAIL (no `.seg`).
- [ ] **Step 3: Implement**

`src/lib/ui/ui-strings.ts`
```ts
/** Central UI strings (not story copy) — prepared for the multilingual follow-up. */
export const UI = {
  progressLabel: 'Where we are in the flight’s life',
  start: 'Start',
  chapters: 'Chapters',
  close: 'Close',
  chapterOf: (n: number, total: number) => `Chapter ${n} of ${total}`,
  prologue: 'Prologue',
  sourcesAndMethod: 'Sources & method',
  backToTop: 'Back to top ↑',
  overviewTitle: 'The life of FFS101 at a glance',
  whoAtTable: 'Who’s at the table',
  whatDecided: 'What gets decided',
  skyFrom: (age: string, source: string) => `Aircraft positions from ${age} · ${source}`,
  skyDelayed: 'the feed may be delayed',
  skyUnavailable: 'The live sky snapshot is unavailable right now — the rest of the story is unaffected.'
} as const;
```

`src/lib/scroll/storyState.svelte.ts`
```ts
import type { AtmPhase } from '$lib/story/types';
export const story: { chapterId: string; chapterTitle: string; clock: number; clockLabel: string; phase: AtmPhase | null } =
  $state({ chapterId: '', chapterTitle: '', clock: 0, clockLabel: '', phase: null });
```

`src/lib/ui/Chapter.svelte` — in `onstep` add `story.phase = chapter.phase;`; import `phaseOf`; add to the section element `style:--phase-color={chapter.phase ? phaseOf(chapter.phase).color : 'var(--accent)'}`; replace the header with:
```svelte
  <header class="head">
    <p class="kicker">
      {#if chapter.phase}<span class="phase-pill">{phaseOf(chapter.phase).label}</span>{/if}
      {chapter.kicker}
    </p>
    <h2 id="{chapter.id}-title">{chapter.title}</h2>
  </header>
```
and CSS:
```css
  .phase-pill { display: inline-block; margin-right: 10px; padding: 2px 10px; border-radius: 999px; border: 1px solid var(--phase-color); color: var(--ink); background: color-mix(in srgb, var(--phase-color) 22%, transparent); letter-spacing: 0.06em; }
  .step.active :global(.card) { border-color: var(--phase-color); }
```
(replacing the existing `.step.active :global(.card)` rule).

`src/lib/ui/MissionClock.svelte` — full replacement:
```svelte
<script lang="ts">
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { story } from '$lib/scroll/storyState.svelte';
  import { CLOCK_TICKS } from '$lib/story/clock';
  import { CHAPTERS } from '$lib/story/chapters';
  import { ATM_PHASES, phaseClockRanges, phaseOf } from '$lib/story/phases';
  import { dur } from '$lib/scroll/motion';
  import { UI } from './ui-strings';
  import ThemeToggle from './ThemeToggle.svelte';

  const pos = new Tween(0, { duration: dur(500), easing: cubicOut });
  $effect(() => { pos.target = story.clock; });
  const ranges = phaseClockRanges(CHAPTERS);
  const phaseLabel = $derived(story.phase ? phaseOf(story.phase).label : null);
  const nowText = $derived(phaseLabel ? `${phaseLabel} · ${story.clockLabel}` : story.clockLabel || 'FFS101');
</script>

<div class="clock" style:--phase-color={story.phase ? phaseOf(story.phase).color : 'var(--accent)'}>
  <span class="now" aria-hidden="true">{nowText}</span>
  <div class="rail" role="progressbar" aria-label={UI.progressLabel} aria-valuemin="0" aria-valuemax="100"
    aria-valuenow={Math.round(story.clock * 100)} aria-valuetext={phaseLabel ? nowText : story.clockLabel || UI.start}>
    {#each ranges as r (r.id)}
      <span class="seg" data-phase={r.id} class:current={story.phase === r.id}
        style:left="{r.start * 100}%" style:width="{(r.end - r.start) * 100}%" style:--c={phaseOf(r.id).color}>
        <span class="sl">{phaseOf(r.id).label}</span>
      </span>
    {/each}
    {#each CLOCK_TICKS as t}<span class="tick" style:left="{t.pos * 100}%"><span class="tl">{t.label}</span></span>{/each}
    <span class="fill" style:width="{pos.current * 100}%"></span>
    <span class="plane" style:left="{pos.current * 100}%" aria-hidden="true">✈</span>
  </div>
  <ThemeToggle />
</div>

<style>
  .clock { position: fixed; inset: 0 0 auto 0; height: var(--clock-h); z-index: 50; display: flex; align-items: center; gap: 16px; padding: 0 16px; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); font-size: 12px; }
  .now { min-width: 72px; font-weight: 600; white-space: nowrap; }
  .rail { position: relative; flex: 1; height: 6px; background: var(--grid); border-radius: 3px; }
  .seg { position: absolute; top: 0; height: 6px; background: color-mix(in srgb, var(--c) 35%, transparent); border-left: 1px solid var(--bg); }
  .seg.current { background: color-mix(in srgb, var(--c) 75%, transparent); }
  .sl { position: absolute; bottom: 9px; left: 4px; font-size: 10px; color: var(--ink-2); white-space: nowrap; }
  .seg.current .sl { color: var(--ink); font-weight: 600; }
  .fill { position: absolute; left: 0; top: 2px; height: 2px; background: var(--ink); opacity: 0.6; }
  .tick { position: absolute; top: -1px; width: 1px; height: 8px; background: var(--axis); }
  .tl { position: absolute; top: 9px; transform: translateX(-50%); color: var(--muted); font-size: 10px; white-space: nowrap; }
  .plane { position: absolute; top: -8px; transform: translateX(-50%) rotate(90deg); color: var(--phase-color); font-size: 14px; }
  @media (max-width: 900px) { .tl { display: none; } }
  @media (max-width: 700px) { .sl { display: none; } .now { min-width: 0; } }
</style>
```
- [ ] **Step 4: Run** `npm run check && npx playwright test tests/e2e/phase.spec.ts tests/e2e/scroll.spec.ts` → PASS (scroll.spec dev chapters have `phase: null`, so `aria-valuetext` stays `C1`/`C2`).
- [ ] **Step 5: Commit** `git add -A src tests && git commit -m "feat: phase band in the mission clock and phase-coloured chapters"`

---

### Task 3: Signed-log time scale and the overview timeline (table of contents)

**Files:**
- Create: `src/lib/story/timescale.ts`, `src/lib/viz/label-layout.ts`, `src/lib/viz/OverviewTimeline.svelte`
- Modify: `src/routes/+page.svelte` (insert after the intro header)
- Test: `tests/unit/timescale.test.ts`, `tests/unit/label-layout.test.ts`, `tests/e2e/nav.spec.ts` (first test)

**Interfaces:**
- Consumes: `HERO`, `EVENTS` (flight.ts), `ATM_PHASES`, `phaseOf`, `atmPhaseOfEvent`, `CHAPTERS`, `UI`.
- Produces: `EOBT_ISO: string`, `hoursFromEobt(iso: string): number`, `timeScale(iso: string): number`, `scaleHours(h: number): number`, `TIME_TICKS: { label: string; h: number }[]`, `phaseSpans(): { id: AtmPhase; from: number; to: number }[]` (scale units), `CHAPTER_ANCHORS: Record<string, string>` (chapter id → event id); `stackRows(items: { x: number; w: number }[], gap?: number): number[]` (row per item), `spreadAlong(pos: number[], minGap: number): number[]`.

- [ ] **Step 1: Failing unit tests**

`tests/unit/timescale.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { timeScale, hoursFromEobt, scaleHours, phaseSpans, EOBT_ISO, CHAPTER_ANCHORS } from '$lib/story/timescale';
import { EVENTS } from '$lib/story/flight';
import { CHAPTERS } from '$lib/story/chapters';

describe('signed-log time scale', () => {
  it('puts EOBT at 0 and is symmetric', () => {
    expect(timeScale(EOBT_ISO)).toBe(0);
    expect(scaleHours(24)).toBeCloseTo(-scaleHours(-24), 12);
    expect(hoursFromEobt('2026-07-10T07:00:00Z')).toBe(2);
  });
  it('is monotonic over the hero timeline', () => {
    const xs = EVENTS.map((e) => timeScale(e.at));
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1]);
  });
  it('phase spans are contiguous and ascending', () => {
    const s = phaseSpans();
    expect(s.map((x) => x.id)).toEqual(['strategic', 'pretactical', 'tactical', 'postops']);
    for (let i = 1; i < s.length; i++) expect(s[i].from).toBe(s[i - 1].to);
    for (const x of s) expect(x.to).toBeGreaterThan(x.from);
  });
  it('anchors chapters to existing events', () => {
    for (const [ch, ev] of Object.entries(CHAPTER_ANCHORS)) {
      expect(CHAPTERS.some((c) => c.id === ch), ch).toBe(true);
      expect(EVENTS.some((e) => e.id === ev), ev).toBe(true);
    }
  });
});
```

`tests/unit/label-layout.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { stackRows, spreadAlong } from '$lib/viz/label-layout';

describe('label layout', () => {
  it('stackRows puts overlapping labels on new rows and reuses free rows', () => {
    expect(stackRows([{ x: 0, w: 50 }, { x: 20, w: 50 }, { x: 60, w: 10 }, { x: 200, w: 10 }], 4)).toEqual([0, 1, 0, 0]);
  });
  it('spreadAlong enforces a minimum gap, preserving order', () => {
    expect(spreadAlong([0, 5, 6, 100], 10)).toEqual([0, 10, 20, 100]);
  });
});
```
- [ ] **Step 2: Run** `npx vitest run tests/unit/timescale.test.ts tests/unit/label-layout.test.ts` → FAIL.
- [ ] **Step 3: Implement**

`src/lib/story/timescale.ts`
```ts
import { HERO } from './flight';
import type { AtmPhase } from './types';

export const EOBT_ISO = `${HERO.date}T${HERO.std}:00Z`;
const EOBT_MS = Date.parse(EOBT_ISO);
const DAY0_H = -(+HERO.std.slice(0, 2) + +HERO.std.slice(3, 5) / 60); // midnight of D, in hours from EOBT

export const hoursFromEobt = (iso: string) => (Date.parse(iso) - EOBT_MS) / 3_600_000;
export const scaleHours = (h: number) => Math.sign(h) * Math.log10(1 + Math.abs(h));
export const timeScale = (iso: string) => scaleHours(hoursFromEobt(iso));

export const TIME_TICKS = [
  { label: '−10 mo', h: -7300 }, { label: '−1 mo', h: -720 }, { label: '−1 wk', h: -168 }, { label: 'D−1', h: -24 },
  { label: 'EOBT', h: 0 }, { label: '+2 h', h: 2 }, { label: '+1 d', h: 24 }, { label: '+1 yr', h: 8760 }
];

/** Phase boundaries in scale units: pre-tactical D−6 00:00, tactical D 00:00, post-ops D+1 00:00. */
export function phaseSpans(): { id: AtmPhase; from: number; to: number }[] {
  const b = [-7400, DAY0_H - 6 * 24, DAY0_H, DAY0_H + 24, 9000].map(scaleHours);
  const ids: AtmPhase[] = ['strategic', 'pretactical', 'tactical', 'postops'];
  return ids.map((id, i) => ({ id, from: b[i], to: b[i + 1] }));
}

/** Where each chapter sits on the timeline (its first characteristic event). */
export const CHAPTER_ANCHORS: Record<string, string> = {
  strategic: 'schedule', airspace: 'season-start', 'week-before': 'adp', filing: 'fpl', twist: 'sam',
  reroute: 'rrp', ground: 'ground-start', enroute: 'muac', arrival: 'aldt', postops: 'postops'
};
```

`src/lib/viz/label-layout.ts`
```ts
/** Greedy row assignment so labels [x, x+w] never overlap within a row. */
export function stackRows(items: { x: number; w: number }[], gap = 6): number[] {
  const rowEnd: number[] = [];
  return items.map(({ x, w }) => {
    let row = rowEnd.findIndex((end) => end + gap <= x);
    if (row === -1) { row = rowEnd.length; rowEnd.push(0); }
    rowEnd[row] = x + w;
    return row;
  });
}

/** Push positions forward so consecutive ones are at least minGap apart (input assumed sorted). */
export function spreadAlong(pos: number[], minGap: number): number[] {
  const out: number[] = [];
  for (const p of pos) out.push(out.length ? Math.max(p, out[out.length - 1] + minGap) : p);
  return out;
}
```

`src/lib/viz/OverviewTimeline.svelte`
```svelte
<script lang="ts">
  import { scaleLinear } from 'd3';
  import { EVENTS } from '$lib/story/flight';
  import { CHAPTERS } from '$lib/story/chapters';
  import { ATM_PHASES, phaseOf } from '$lib/story/phases';
  import { timeScale, phaseSpans, TIME_TICKS, scaleHours, CHAPTER_ANCHORS } from '$lib/story/timescale';
  import { stackRows, spreadAlong } from './label-layout';
  import Tooltip from './Tooltip.svelte';
  import SourceLine from './SourceLine.svelte';
  import { reducedMotion } from '$lib/scroll/motion';
  import { replaceState } from '$app/navigation';

  let width = $state(0);
  const vertical = $derived(width > 0 && width < 700);
  const spans = phaseSpans();
  const domain: [number, number] = [spans[0].from, spans.at(-1)!.to];
  const len = $derived(vertical ? 760 : Math.max(1, width - 32));
  const s = $derived(scaleLinear().domain(domain).range([16, 16 + len]));
  const chapters = CHAPTERS.filter((c) => c.id in CHAPTER_ANCHORS).map((c) => ({ c, at: timeScale(EVENTS.find((e) => e.id === CHAPTER_ANCHORS[c.id])!.at) }));
  const labelPos = $derived(vertical ? spreadAlong(chapters.map((d) => s(d.at)), 24) : chapters.map((d) => s(d.at)));
  const rows = $derived(vertical ? chapters.map(() => 0) : stackRows(chapters.map((d) => ({ x: s(d.at) - 4, w: d.c.title.length * 7 + 8 })), 8));
  const nRows = $derived(Math.max(...rows) + 1);
  let hi: (typeof EVENTS)[number] | null = $state(null);
  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
    replaceState(`#${id}`, {});
  }
  const H = $derived(vertical ? len + 40 : 70 + nRows * 22);
</script>

<div class="ot" bind:clientWidth={width}>
  {#if width}
    <svg width={width} height={H} role="img" aria-label="Timeline of FFS101 from ten months before take-off to a year after, coloured by planning phase">
      {#each spans as p (p.id)}
        {#if vertical}
          <rect x="60" y={s(p.from)} width="10" height={s(p.to) - s(p.from)} fill={phaseOf(p.id).color} opacity="0.8" />
          <text class="pl" x="54" y={(s(p.from) + s(p.to)) / 2} text-anchor="end">{phaseOf(p.id).label}</text>
        {:else}
          <rect x={s(p.from)} y="20" width={s(p.to) - s(p.from)} height="10" fill={phaseOf(p.id).color} opacity="0.8" />
          <text class="pl" x={(s(p.from) + s(p.to)) / 2} y="14" text-anchor="middle">{phaseOf(p.id).label}</text>
        {/if}
      {/each}
      {#each TIME_TICKS as t (t.label)}
        {#if vertical}<text class="tk" x="76" y={s(scaleHours(t.h)) + 4}>{t.label}</text>
        {:else}<text class="tk" x={s(scaleHours(t.h))} y="44" text-anchor="middle">{t.label}</text>{/if}
      {/each}
      {#each EVENTS as e (e.id)}
        {@const v = s(timeScale(e.at))}
        <circle role="presentation" cx={vertical ? 65 : v} cy={vertical ? v : 25} r="3.5" class="ev"
          onpointerenter={() => (hi = e)} onpointerleave={() => (hi = null)} />
      {/each}
      {#each chapters as d, i (d.c.id)}
        {@const x = labelPos[i]}
        {#if vertical}
          <line class="lead" x1="70" x2="130" y1={s(d.at)} y2={x} />
        {:else}
          <line class="lead" x1={s(d.at)} x2={s(d.at)} y1="30" y2={58 + rows[i] * 22} />
        {/if}
      {/each}
    </svg>
    <ol class="labels" aria-label="Chapters on the timeline">
      {#each chapters as d, i (d.c.id)}
        <li style:left={vertical ? '136px' : `${labelPos[i] - 4}px`} style:top={vertical ? `${labelPos[i] - 10}px` : `${52 + rows[i] * 22}px`}>
          <button type="button" onclick={() => go(d.c.id)} style:--c={d.c.phase ? phaseOf(d.c.phase).color : 'var(--accent)'}>{d.c.title}</button>
        </li>
      {/each}
    </ol>
    <Tooltip visible={!!hi} x={hi ? (vertical ? 70 : s(timeScale(hi.at))) : 0} y={hi ? (vertical ? s(timeScale(hi.at)) : 30) : 0} containerWidth={width}>
      {#if hi}<strong>{hi.label}</strong><div class="row">{new Date(hi.at).toUTCString().slice(5, 22)} UTC</div>{/if}
    </Tooltip>
  {/if}
  <SourceLine ids={['S8', 'S7']} illustrative detail="signed-log time axis relative to FFS101’s off-block time" />
</div>

<style>
  .ot { position: relative; width: 100%; }
  svg { display: block; overflow: visible; }
  .pl { fill: var(--ink); font-size: 12px; font-weight: 600; }
  .tk { fill: var(--muted); font-size: 11px; }
  .ev { fill: var(--ink); stroke: var(--bg); stroke-width: 1.5; }
  .lead { stroke: var(--axis); stroke-width: 1; }
  .labels { list-style: none; margin: 0; padding: 0; position: absolute; inset: 0; pointer-events: none; }
  .labels li { position: absolute; pointer-events: auto; }
  .labels button { all: unset; cursor: pointer; font-size: 13px; padding: 1px 6px; border-radius: 6px; border-left: 3px solid var(--c); background: var(--surface); white-space: nowrap; }
  .labels button:hover, .labels button:focus-visible { background: var(--surface-2); outline: 2px solid var(--accent); }
</style>
```

`src/routes/+page.svelte` — after `</header>` of the intro insert:
```svelte
  <section class="overview" id="overview" aria-labelledby="overview-title">
    <h2 id="overview-title">{UI.overviewTitle}</h2>
    <OverviewTimeline />
  </section>
```
with imports `import OverviewTimeline from '$lib/viz/OverviewTimeline.svelte'; import { UI } from '$lib/ui/ui-strings';` and CSS
`.overview { max-width: 1100px; margin: 0 auto; padding: 8vh 16px 12vh; } .overview h2 { font-size: clamp(26px, 3.5vw, 40px); }`.

- [ ] **Step 4: First nav e2e** — create `tests/e2e/nav.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('overview timeline jumps to a chapter', async ({ page }) => {
  await page.goto('/');
  await page.locator('#overview').getByRole('button', { name: 'The flight plan' }).click();
  await expect(page).toHaveURL(/#filing$/);
  await expect(page.locator('#filing')).toBeInViewport();
});
```
- [ ] **Step 5: Run** `npx vitest run && npm run check && npx playwright test tests/e2e/nav.spec.ts tests/e2e/responsive.spec.ts` → PASS. Screenshot `#overview` at 1440 and 390 (`page.locator('#overview').screenshot(...)`), Read both, fix any label overlap (adjust `stackRows` gap / vertical `spreadAlong` gap).
- [ ] **Step 6: Commit** `git add -A src tests && git commit -m "feat: overview timeline with phases, events and chapter navigation"`

---

### Task 4: Phase divider screens

**Files:**
- Create: `src/lib/ui/PhaseDivider.svelte`, `src/lib/scroll/reveal.ts`
- Modify: `src/routes/+page.svelte`
- Test: `tests/e2e/phase.spec.ts` (append)

**Interfaces:**
- Consumes: `ATM_PHASES`, `phaseOf`, `atmPhaseOfEvent`, `firstChapterOfPhase`, `phaseSpans`, `ACTORS`, `EVENTS`, `story`, `UI`, `Cite`.
- Produces: `PhaseDivider.svelte` props `{ phase: AtmPhase }`, root `section.phase-divider#phase-<id>`; Svelte action `reveal(node)` adding class `revealed` once ≥15% visible.

- [ ] **Step 1: Failing e2e** (append to `tests/e2e/phase.spec.ts`)
```ts
test('a divider introduces each phase with horizon, actors and a citation', async ({ page }) => {
  await page.goto('/');
  for (const id of ['strategic', 'pretactical', 'tactical', 'postops']) await expect(page.locator(`#phase-${id}`)).toHaveCount(1);
  const d = page.locator('#phase-pretactical');
  await d.scrollIntoViewIfNeeded();
  await expect(d.getByRole('heading', { level: 2 })).toHaveText('Pre-tactical');
  await expect(d).toContainText('D−6 to D−1');
  await expect(d.locator('.chip').first()).toBeVisible();
  await expect(d.locator('.cite').first()).toBeVisible();
  await expect(page.locator('.clock .now')).toContainText('Pre-tactical');
  // divider sits immediately before the phase's first chapter
  expect(await d.evaluate((el) => el.nextElementSibling?.id)).toBe('week-before');
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**

`src/lib/scroll/reveal.ts`
```ts
/** Adds `revealed` once the element is at least 15% visible (CSS does the animation). */
export function reveal(node: HTMLElement) {
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { node.classList.add('revealed'); io.disconnect(); }
  }, { threshold: 0.15 });
  io.observe(node);
  return { destroy: () => io.disconnect() };
}
```

`src/lib/ui/PhaseDivider.svelte`
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import type { AtmPhase } from '$lib/story/types';
  import { ATM_PHASES, phaseOf, atmPhaseOfEvent } from '$lib/story/phases';
  import { phaseSpans } from '$lib/story/timescale';
  import { CHAPTERS } from '$lib/story/chapters';
  import { EVENTS } from '$lib/story/flight';
  import { ACTORS } from '$lib/story/stakeholders';
  import { story } from '$lib/scroll/storyState.svelte';
  import { reveal } from '$lib/scroll/reveal';
  import { UI } from './ui-strings';
  import Cite from './Cite.svelte';

  let { phase }: { phase: AtmPhase } = $props();
  const p = $derived(phaseOf(phase));
  const actors = $derived(ACTORS.filter((a) => EVENTS.some((e) => e.actor === a.id && atmPhaseOfEvent(e.phase) === phase)));
  const spans = phaseSpans();
  const lo = spans[0].from, hi = spans.at(-1)!.to;
  const firstChapter = $derived(CHAPTERS.find((c) => c.phase === phase)!);
  let el: HTMLElement;
  onMount(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        story.phase = phase;
        story.clock = firstChapter.clock;
        story.clockLabel = firstChapter.clockLabel;
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  });
</script>

<section class="phase-divider" id="phase-{phase}" bind:this={el} use:reveal style:--c={p.color} aria-labelledby="phase-{phase}-title">
  <p class="eyebrow">Phase {ATM_PHASES.findIndex((x) => x.id === phase) + 1} of 4</p>
  <h2 id="phase-{phase}-title">{p.label}</h2>
  <p class="horizon">{p.horizon}</p>
  <svg class="strip" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
    {#each spans as s (s.id)}
      <rect x={((s.from - lo) / (hi - lo)) * 100} y="0" width={((s.to - s.from) / (hi - lo)) * 100} height="6" fill={phaseOf(s.id).color} opacity={s.id === phase ? 1 : 0.25} />
    {/each}
  </svg>
  <div class="cols">
    <div>
      <h3>{UI.whatDecided}</h3>
      <p>{p.decides}<Cite ids={p.sources} /></p>
    </div>
    <div>
      <h3>{UI.whoAtTable}</h3>
      <ul class="chips">{#each actors as a, i (a.id)}<li class="chip" style:--i={i}>{a.label}</li>{/each}</ul>
    </div>
  </div>
</section>

<style>
  .phase-divider { min-height: 90svh; max-width: 980px; margin: 0 auto; padding: 18vh 16px 10vh; display: flex; flex-direction: column; justify-content: center; }
  .eyebrow { text-transform: uppercase; letter-spacing: 0.14em; font-size: 13px; color: var(--ink-2); margin: 0; }
  h2 { font-size: clamp(48px, 9vw, 104px); margin: 0.1em 0; color: var(--ink); text-decoration: underline; text-decoration-color: var(--c); text-decoration-thickness: 6px; text-underline-offset: 10px; }
  .horizon { font-size: 22px; color: var(--ink-2); margin: 0 0 18px; }
  .strip { width: 100%; height: 10px; margin-bottom: 28px; }
  .cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
  h3 { font-family: var(--font-sans); font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-2); margin: 0 0 8px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0; margin: 0; }
  .chip { padding: 4px 10px; border-radius: 999px; border: 1px solid var(--c); font-size: 14px; }
  /* entrance */
  .phase-divider > * { opacity: 0; transform: translateY(16px); transition: opacity 600ms ease, transform 600ms ease; }
  .phase-divider:global(.revealed) > * { opacity: 1; transform: none; }
  .phase-divider:global(.revealed) .chip { animation: pop 400ms both; animation-delay: calc(var(--i) * 60ms); }
  @keyframes pop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: none; } }
</style>
```

`src/routes/+page.svelte` — render dividers right before the first chapter of each phase. Until Task 10 replaces the chapter list, insert by hand: `<PhaseDivider phase="strategic" />` before `<C01Strategic />`, `<PhaseDivider phase="pretactical" />` before the week-before chapter (see Step 3b), `<PhaseDivider phase="tactical" />` before `<C04Twist />`, `<PhaseDivider phase="postops" />` before `<C10PostOps />`.

- [ ] **Step 3b: Week-before chapter component** — `src/lib/chapters/C02bWeekBefore.svelte` (map graphic continuing chapter 2, military areas on step 0):
```svelte
<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ROUTE_FRAME } from '$lib/geo/projection';
  import { ISO } from '$lib/geo/countries';
  import { ROUTE_PLANNED } from '$lib/story/flight';
  import { chapter } from '$lib/story/chapters';
  const ch = chapter('week-before');
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      <div class="map-wrap">
        <BaseMap label="Military training areas and FFS101's planned route" frame={ROUTE_FRAME} highlight={[ISO.BE, ISO.LU, ISO.FR, ISO.CH, ISO.IT]}>
          {#snippet children({ projection, path, width })}
            <RouteMap {projection} {path} {width} military={step === 0} showPlane={false} progress={1} routes={[{ id: 'planned', coords: ROUTE_PLANNED, style: 'active' }]} />
          {/snippet}
        </BaseMap>
      </div>
      <SourceLine ids={step === 0 ? ['D-naturalearth', 'S28', 'S19'] : ['D-naturalearth', 'S8']} illustrative />
    </div>
  {/snippet}
</Chapter>
```
In `src/lib/chapters/C02Airspace.svelte` remove the `military={step === 2}` prop usage and the `step === 2` SourceLine branch (chapter 2 now has steps 0–1 only). In `+page.svelte` import it and render `<C02bWeekBefore />` right after `<C02Airspace />`.

- [ ] **Step 4: Run** `npm run check && npx playwright test tests/e2e/phase.spec.ts tests/e2e/story.spec.ts tests/e2e/responsive.spec.ts` → PASS (story walk covers the new chapter).
- [ ] **Step 5: Commit** `git add -A src tests && git commit -m "feat: phase divider screens and a separate pre-tactical chapter"`

---

### Task 5: Chapter drawer, hash deep links, back to top

**Files:**
- Create: `src/lib/ui/ChapterDrawer.svelte`
- Modify: `src/lib/ui/MissionClock.svelte` (drawer button), `src/lib/ui/Chapter.svelte` (hash sync), `src/routes/+page.svelte` (`id="top"`), `src/lib/chapters/C11Sources.svelte` (back-to-top link)
- Test: `tests/e2e/nav.spec.ts` (append)

**Interfaces:**
- Consumes: `CHAPTERS`, `ATM_PHASES`, `phaseOf`, `story`, `UI`; `replaceState` from `$app/navigation`.
- Produces: `ChapterDrawer.svelte` (self-contained `<dialog>`, opened by its own "Chapters" button).

- [ ] **Step 1: Failing e2e** (append to `tests/e2e/nav.spec.ts`)
```ts
import { scrollStepTo } from './helpers';

test('drawer lists chapters by phase, jumps, and is keyboard-safe', async ({ page }) => {
  await page.goto('/');
  const open = page.getByRole('button', { name: 'Chapters' });
  await open.click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('heading', { name: 'Tactical' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  await expect(open).toBeFocused();
  await open.click();
  await dlg.getByRole('link', { name: 'The way around' }).click();
  await expect(page).toHaveURL(/#reroute$/);
  await expect(page.locator('.clock .now')).toContainText('Tactical');
});

test('deep links into the real story land on the right chapter', async ({ page }) => {
  for (const id of ['twist', 'reroute', 'postops']) {
    await page.goto(`/#${id}`);
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
  await page.goto('/#twist');
  await expect(page.locator('.clock .now')).toContainText('Tactical');
});

test('the hash follows the chapter in view and survives a reload', async ({ page }) => {
  await page.goto('/');
  await scrollStepTo(page, '#ground [data-step="2"]');
  await expect(page).toHaveURL(/#ground$/);
  await page.reload();
  await expect(page.locator('#ground')).toBeInViewport();
});

test('back to top link at the end', async ({ page }) => {
  await page.goto('/#sources');
  await page.getByRole('link', { name: 'Back to top ↑' }).click();
  await expect(page.locator('#top')).toBeInViewport();
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**

`src/lib/ui/ChapterDrawer.svelte`
```svelte
<script lang="ts">
  import { CHAPTERS } from '$lib/story/chapters';
  import { ATM_PHASES } from '$lib/story/phases';
  import { story } from '$lib/scroll/storyState.svelte';
  import { UI } from './ui-strings';

  let dlg: HTMLDialogElement;
  let btn: HTMLButtonElement;
  const numbered = CHAPTERS.filter((c) => c.kicker.startsWith('Chapter'));
  const current = $derived(numbered.findIndex((c) => c.id === story.chapterId) + 1);
  function close() { dlg.close(); btn.focus(); }
</script>

<button type="button" class="open" bind:this={btn} onclick={() => dlg.showModal()} aria-haspopup="dialog">☰ {UI.chapters}</button>
<dialog bind:this={dlg} aria-labelledby="drawer-title" onclose={() => btn?.focus()}>
  <div class="head">
    <h2 id="drawer-title">{UI.chapters}</h2>
    {#if current > 0}<span class="n">{UI.chapterOf(current, numbered.length)}</span>{/if}
    <button type="button" class="x" onclick={close} aria-label={UI.close}>✕</button>
  </div>
  <nav>
    <a href="#cold-open" onclick={close}>{UI.prologue} · The sky over Europe</a>
    {#each ATM_PHASES as p (p.id)}
      <h3 style:--c={p.color}>{p.label}</h3>
      <ul>
        {#each CHAPTERS.filter((c) => c.phase === p.id) as c (c.id)}
          <li><a href="#{c.id}" onclick={close} aria-current={story.chapterId === c.id ? 'location' : undefined}>{c.title}</a></li>
        {/each}
      </ul>
    {/each}
    <a href="#sources" onclick={close}>{UI.sourcesAndMethod}</a>
  </nav>
</dialog>

<style>
  .open { all: unset; cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); white-space: nowrap; }
  .open:focus-visible, .x:focus-visible { outline: 2px solid var(--accent); }
  dialog { margin: 0 0 0 auto; height: 100svh; max-height: 100svh; width: min(380px, 100vw); border: 0; border-left: 1px solid var(--border); background: var(--surface); color: var(--ink); padding: 16px 20px; }
  dialog::backdrop { background: rgb(0 0 0 / 0.45); }
  .head { display: flex; align-items: baseline; gap: 10px; }
  .head h2 { font-size: 24px; margin: 0; }
  .n { font-size: 13px; color: var(--ink-2); }
  .x { all: unset; cursor: pointer; margin-left: auto; font-size: 18px; padding: 4px 8px; }
  h3 { font-family: var(--font-sans); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 18px 0 6px; padding-left: 8px; border-left: 4px solid var(--c); }
  ul { list-style: none; margin: 0; padding: 0; }
  a { display: block; padding: 6px 8px; border-radius: 6px; color: var(--ink); text-decoration: none; }
  a:hover, a:focus-visible { background: var(--surface-2); }
  a[aria-current] { font-weight: 700; }
  nav > a { margin-top: 12px; }
</style>
```

`src/lib/ui/MissionClock.svelte` — import `ChapterDrawer` and render `<ChapterDrawer />` immediately before `<ThemeToggle />`.

`src/lib/ui/Chapter.svelte` — at the top of `<script>` add `import { replaceState } from '$app/navigation';` and at the end of `onstep`:
```ts
    if (typeof location !== 'undefined' && location.hash !== `#${chapter.id}`) {
      try { replaceState(`#${chapter.id}`, {}); } catch { /* router not ready yet (very first paint) */ }
    }
```

`src/routes/+page.svelte` — add `id="top"` to `<header class="intro">`.

`src/lib/chapters/C11Sources.svelte` — after the glossary `<dl>` add `<p class="totop"><a href="#top">{UI.backToTop}</a></p>` (import `UI`), CSS `.totop { margin-top: 48px; }`.

- [ ] **Step 4: Run** `npm run check && npx playwright test tests/e2e/nav.spec.ts tests/e2e/scroll.spec.ts tests/e2e/a11y.spec.ts` → PASS.
- [ ] **Step 5: Commit** `git add -A src tests && git commit -m "feat: chapter drawer, URL hash per chapter and back-to-top"`

---

### Task 6: Animate in place — swaps, bar tweens, slot-queue slide, map glides, header reveals

**Files:**
- Create: `src/lib/ui/Swap.svelte`
- Modify: `src/app.css`; chapter components `C00ColdOpen.svelte` (hud branches), `C01Strategic.svelte`, `C05Delay.svelte`, `C07Ground.svelte`, `C08Enroute.svelte`, `C09Arrival.svelte`, `C10PostOps.svelte`; `src/lib/viz/BarChart.svelte`, `src/lib/viz/CasaQueue.svelte`, `src/lib/viz/BaseMap.svelte`, `src/lib/viz/RouteMap.svelte`, `src/lib/ui/Chapter.svelte`
- Test: `tests/e2e/transitions.spec.ts`

**Interfaces:**
- Consumes: `dur` (motion.ts), `reveal` action (Task 4).
- Produces: `Swap.svelte` (`{ children: Snippet }`, root `div.swap`); global CSS class `.swaps` (grid stacking container).

- [ ] **Step 1: Failing e2e** — `tests/e2e/transitions.spec.ts`
```ts
import { test, expect } from '@playwright/test';
import { scrollStepTo } from './helpers';

test('graphic swaps cross-fade (both present mid-transition, one after)', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  await page.goto('/');
  await scrollStepTo(page, '#strategic [data-step="2"]');
  await page.waitForTimeout(800);
  await scrollStepTo(page, '#strategic [data-step="3"]');
  await expect.poll(() => page.locator('#strategic .graphic .swap').count(), { timeout: 400 }).toBe(2);
  await expect(page.locator('#strategic .graphic .swap')).toHaveCount(1, { timeout: 2000 });
});

test('bars grow from the baseline', async ({ page }) => {
  await page.goto('/');
  await scrollStepTo(page, '#twist [data-step="0"]');
  const bar = page.locator('#twist .casa svg path').first();
  const early = await bar.getAttribute('d');
  await page.waitForTimeout(1200);
  expect(await bar.getAttribute('d')).not.toBe(early);
});

test('reduced motion: no swap overlap, bars at final height immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await scrollStepTo(page, '#strategic [data-step="3"]');
  await expect(page.locator('#strategic .graphic .swap')).toHaveCount(1);
  await scrollStepTo(page, '#twist [data-step="0"]');
  const bar = page.locator('#twist .casa svg path').first();
  await expect(bar).toBeVisible();
  const a = await bar.getAttribute('d');
  await page.waitForTimeout(700);
  expect(await bar.getAttribute('d')).toBe(a);
});

test('chapter titles reveal on entry', async ({ page }) => {
  await page.goto('/');
  await page.locator('#reroute .head').scrollIntoViewIfNeeded();
  await expect(page.locator('#reroute .head')).toHaveClass(/revealed/);
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**

`src/lib/ui/Swap.svelte`
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { dur } from '$lib/scroll/motion';
  let { children }: { children: Snippet } = $props();
</script>

<div class="swap" in:fly={{ y: 24, duration: dur(450), easing: cubicOut }} out:fade={{ duration: dur(250) }}>
  {@render children()}
</div>
```

`src/app.css` — append:
```css
/* stack swapping graphics in one grid cell so in/out transitions overlap instead of jumping */
.swaps { display: grid; min-height: 0; flex: 1; align-content: center; }
.swaps > .swap { grid-area: 1 / 1; min-width: 0; min-height: 0; }
```

Chapter components — **rule:** every `{#if step …}{:else if …}{:else}{/if}` chain that switches the *whole* graphic is wrapped in `<div class="swaps">…</div>` and each branch's content is wrapped in `<Swap>…</Swap>` (import `Swap from '$lib/ui/Swap.svelte'`). Apply to exactly these chains:
- `C00ColdOpen.svelte`: the three branches inside `<div class="hud">` (wrap the chain in `.swaps` inside `.hud`).
- `C01Strategic.svelte`: the `step <= 2` / `step === 3` / else chain.
- `C05Delay.svelte`: the four-branch chain.
- `C07Ground.svelte`: `step <= 3` / else.
- `C08Enroute.svelte`: `step <= 2` / `charges` chain.
- `C09Arrival.svelte`: three-branch chain.
- `C10PostOps.svelte`: three-branch chain.
Example (C07, final form):
```svelte
    <div class="stage">
      <div class="swaps">
        {#if step <= 3}
          <Swap><Figure title="FFS101 at Brussels: turnaround and A-CDM milestones" subtitle="Times UTC" sources={['S13', 'S7']} illustrative>
            <AcdmTimeline stage={STAGES[step]} />
          </Figure></Swap>
        {:else}
          <Swap><Figure title="Brussels Airport punctuality" …unchanged…>…</Figure></Swap>
        {/if}
      </div>
    </div>
```
(C07's `step <= 3` branch keeps one Swap across steps 0–3 because the `{#if}` condition doesn't change — only the timeline's `stage` prop animates.)

`src/lib/viz/BarChart.svelte` — tween heights: add imports `import { Tween } from 'svelte/motion'; import { cubicOut } from 'svelte/easing'; import { dur } from '$lib/scroll/motion';` and in the script:
```ts
  const shown = new Tween<number[]>([], { duration: dur(600), easing: cubicOut });
  $effect(() => {
    const v = bars.map((b) => b.value);
    if (shown.current.length !== v.length) shown.set(v.map(() => 0), { duration: 0 });
    shown.target = v;
  });
  const h = (i: number) => shown.current[i] ?? 0;
```
then in the markup replace `y(b.value)` in the bar `<path>` with `y(h(i))` (both occurrences in `roundedTopBar(x(b.key)!, y(h(i)), x.bandwidth(), y(0) - y(h(i)), 4)`).

`src/lib/viz/CasaQueue.svelte` — slide from wanted to given: imports `Tween`, `cubicInOut` from `svelte/easing`, `dur`; script:
```ts
  const slide = new Tween(0, { duration: dur(900), easing: cubicInOut });
  $effect(() => { slide.target = stage === 'queue' || stage === 'hero' || stage === 'explore' ? 1 : 0; });
  const given = (a: { eto: number; entry: number }) => x(a.eto + (a.entry - a.eto) * slide.current);
```
and in the markup use `given(a)` instead of `x(a.entry)` for the "given slot" circle `cx`, the link line `x2`, and the tooltip `x`.

`src/lib/viz/BaseMap.svelte` — smooth scroll-driven camera: import `Tween` from `svelte/motion` and `dur`; replace `t` usage:
```ts
  const tt = Tween.of(() => t, { duration: dur(300) });
  const projection = $derived(frameTo ? lerpProjection(width, height, frame, frameTo, tt.current) : makeProjection(width, height, frame));
```

`src/lib/viz/RouteMap.svelte` — fade overlays: import `fade` from `svelte/transition` and `dur`; wrap the military and regulated blocks:
```svelte
{#if military}
  <g transition:fade={{ duration: dur(500) }}>{#each MILITARY_AREAS as f, i (i)}<path class="mil" d={path(f)} />{/each}</g>
{/if}
{#if regulated}<g transition:fade={{ duration: dur(500) }}><path class="reg" d={path(REGULATED_SECTOR)} /></g>{/if}
```

`src/lib/ui/Chapter.svelte` — import `reveal` and put `use:reveal` on `<header class="head">`; CSS:
```css
  .head { opacity: 0; transform: translateY(20px); transition: opacity 700ms ease, transform 700ms ease; }
  .head:global(.revealed) { opacity: 1; transform: none; }
```
(merge into the existing `.head` rule).

- [ ] **Step 4: Run** `npm run check && npx playwright test tests/e2e/transitions.spec.ts tests/e2e/story.spec.ts tests/e2e/charts.spec.ts` → PASS. Regenerate story screenshots and spot-check 6 desktop + 6 mobile images for leftover overlap after transitions.
- [ ] **Step 5: Commit** `git add -A src tests && git commit -m "feat: animate in place — cross-fading graphics, growing bars, sliding slot queue, gliding maps"`

---

### Task 7: Freshness-aware copy and data-derived current year

**Files:**
- Create: `src/lib/story/freshness.ts`
- Modify: `src/lib/story/richtext.ts`, `src/lib/ui/RichText.svelte`, `src/lib/story/chapters.ts`, `src/lib/chapters/C00ColdOpen.svelte`, `C01Strategic.svelte`, `C05Delay.svelte`, `C10PostOps.svelte`, `tests/unit/story-content.test.ts`
- Test: `tests/unit/freshness.test.ts`, `tests/unit/richtext.test.ts` (append)

**Interfaces:**
- Consumes: `ec`, `bundle` (liveState), `Freshness`, `ENTITY_KEYS`.
- Produces: `fmtDayShort(iso: string): string` ("Thu 8 Oct"), `dayPhrase(dataDate: string | null | undefined, now?: Date): string`, `livePhrase(f: Freshness | null): string`, `currentYear(dataDate?: string | null, now?: Date): number`; rich-text run `{ kind: 'var'; name: string; arg: string }` from `{{name:arg}}`; `varIds(s: string): { name: string; arg: string }[]`.

- [ ] **Step 1: Failing tests**

`tests/unit/freshness.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { dayPhrase, livePhrase, currentYear, fmtDayShort } from '$lib/story/freshness';

const now = new Date('2026-10-10T11:00:00Z');
describe('freshness phrasing', () => {
  it('formats a short day', () => expect(fmtDayShort('2026-10-08')).toBe('Thu 8 Oct'));
  it('says yesterday only when it is yesterday (UTC)', () => {
    expect(dayPhrase('2026-10-09', now)).toBe('yesterday (Fri 9 Oct)');
    expect(dayPhrase('2026-10-08', now)).toBe('on Thu 8 Oct');
    expect(dayPhrase('2026-10-10', now)).toBe('today (Sat 10 Oct)');
  });
  it('falls back to neutral wording without data', () => {
    expect(dayPhrase(null, now)).toBe('on the latest day available');
    expect(dayPhrase(undefined, now)).toBe('on the latest day available');
  });
  it('describes live vs snapshot', () => {
    expect(livePhrase('live')).toBe('fetched live');
    expect(livePhrase('snapshot')).toBe('from the latest snapshot');
    expect(livePhrase(null)).toBe('from the latest snapshot');
  });
  it('derives the current year from the data date, rolling over', () => {
    expect(currentYear('2027-01-02', now)).toBe(2027);
    expect(currentYear(null, now)).toBe(2026);
  });
});
```

Append to `tests/unit/richtext.test.ts`:
```ts
import { varIds } from '$lib/story/richtext';
describe('data tokens', () => {
  it('parses {{name:arg}} without touching {TERM}', () => {
    expect(parseRich('Handled {{date:network}} via {IFPS}.')).toEqual([
      { kind: 'text', text: 'Handled ' },
      { kind: 'var', name: 'date', arg: 'network' },
      { kind: 'text', text: ' via ' },
      { kind: 'term', id: 'IFPS', text: 'IFPS' },
      { kind: 'text', text: '.' }
    ]);
    expect(varIds('{{live:report}} and {{date:EBBR}}')).toEqual([{ name: 'live', arg: 'report' }, { name: 'date', arg: 'EBBR' }]);
  });
});
```

Append to `tests/unit/story-content.test.ts`:
```ts
import { varIds } from '$lib/story/richtext';
import { ENTITY_KEYS } from '$lib/data/eurocontrol';
describe('data tokens in copy', () => {
  it('only uses known token names and arguments', () => {
    for (const { s } of steps) for (const v of varIds(s.text)) {
      if (v.name === 'date') expect(ENTITY_KEYS as readonly string[], s.id).toContain(v.arg);
      else if (v.name === 'live') expect(v.arg, s.id).toBe('report');
      else throw new Error(`${s.id}: unknown token ${v.name}`);
    }
  });
  it('no step claims "yesterday" literally', () => {
    for (const { s } of steps) expect(s.text, s.id).not.toMatch(/\byesterday\b/i);
  });
});
```
- [ ] **Step 2: Run** `npx vitest run tests/unit/freshness.test.ts tests/unit/richtext.test.ts tests/unit/story-content.test.ts` → FAIL.
- [ ] **Step 3: Implement**

`src/lib/story/freshness.ts`
```ts
import type { Freshness } from '$lib/data/live';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const utcDay = (d: Date) => d.toISOString().slice(0, 10);

export function fmtDayShort(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function dayPhrase(dataDate: string | null | undefined, now = new Date()): string {
  if (!dataDate) return 'on the latest day available';
  const today = utcDay(now);
  const yesterday = utcDay(new Date(now.getTime() - 86_400_000));
  if (dataDate === yesterday) return `yesterday (${fmtDayShort(dataDate)})`;
  if (dataDate === today) return `today (${fmtDayShort(dataDate)})`;
  return `on ${fmtDayShort(dataDate)}`;
}

export const livePhrase = (f: Freshness | null) => (f === 'live' ? 'fetched live' : 'from the latest snapshot');
export const currentYear = (dataDate?: string | null, now = new Date()) => (dataDate ? +dataDate.slice(0, 4) : now.getUTCFullYear());
```

`src/lib/story/richtext.ts` — extend the `Run` union with `| { kind: 'var'; name: string; arg: string }`; put a new first alternative in `TOKEN` and handle it:
```ts
const TOKEN = new RegExp(
  String.raw`\{\{([a-z]+):([A-Za-z0-9-]+)\}\}|\*\*(.+?)\*\*|\*(.+?)\*|\{([A-Za-z0-9-]+)(?:\|([^}]+))?\}|\[(${ID}(?:\s*,\s*${ID})*)\]`,
  'g'
);
```
and in the loop (group numbers shift by 2):
```ts
    if (m[1] !== undefined) runs.push({ kind: 'var', name: m[1], arg: m[2] });
    else if (m[3] !== undefined) runs.push({ kind: 'strong', text: m[3] });
    else if (m[4] !== undefined) runs.push({ kind: 'em', text: m[4] });
    else if (m[5] !== undefined) runs.push({ kind: 'term', id: m[5], text: m[6] ?? m[5] });
    else runs.push({ kind: 'cite', ids: m[7].split(',').map((x) => x.trim()) });
```
plus
```ts
export const varIds = (s: string) =>
  parseRich(s).flatMap((r) => (r.kind === 'var' ? [{ name: r.name, arg: r.arg }] : []));
```

`src/lib/ui/RichText.svelte` — resolve tokens:
```svelte
<script lang="ts">
  import { parseRich } from '$lib/story/richtext';
  import { dayPhrase, livePhrase } from '$lib/story/freshness';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import type { EntityKey } from '$lib/data/eurocontrol';
  import Cite from './Cite.svelte';
  import Term from './Term.svelte';
  let { text }: { text: string } = $props();
  const paragraphs = $derived(text.split(/\n\s*\n/).map((p) => parseRich(p.trim())));
  const resolve = (name: string, arg: string) =>
    name === 'date' ? dayPhrase(bundle(arg as EntityKey)?.dataDate) : name === 'live' ? livePhrase(ec.reportFreshness) : '';
</script>

{#each paragraphs as runs}
  <p>
    {#each runs as r}
      {#if r.kind === 'text'}{r.text}{:else if r.kind === 'strong'}<strong>{r.text}</strong>{:else if r.kind === 'em'}<em>{r.text}</em>{:else if r.kind === 'term'}<Term id={r.id} text={r.text} />{:else if r.kind === 'var'}<span class="var">{resolve(r.name, r.arg)}</span>{:else if r.kind === 'cite'}<Cite ids={r.ids} />{/if}
    {/each}
  </p>
{/each}
```

`src/lib/story/chapters.ts` — replace these step texts:
- `co-yesterday`: `'The European network handled the number on screen {{date:network}}. In 2025 it handled 11.1 million flights, and on its busiest day — 18 July 2025 — 37,034: one new flight every 2.3 seconds [S1, D-eurocontrol].'`
- `de-yesterday`: `'FFS101 is not alone. Flow-management ({ATFM}) delay across the network added up to the minutes on screen {{date:network}} [D-eurocontrol].'`
- `de-causes`: `'Mostly not because of weather: in 2025, ATC capacity and staffing caused 58% of en-route ATFM delay, weather 28% [S1]. The split for that day is on screen [D-eurocontrol].'`
- `de-report`: `'Every week the Network Manager writes up what happened. This is its latest network situation report, {{live:report}} [D-situation].'`

Chapter components:
- `C00ColdOpen.svelte`: import `dayPhrase`; HeroNumber `label={`flights in the European network ${dayPhrase(net?.dataDate)}`}`.
- `C05Delay.svelte`: import `dayPhrase`; Figure titles `` `ATFM delay in the European network, ${dayPhrase(net?.dataDate)}` `` and `` `ATFM delay by cause, ${dayPhrase(net?.dataDate)}` ``; table caption `` `ATFM delay minutes by cause, ${dayPhrase(net?.dataDate)}` ``.
- `C01Strategic.svelte`: import `currentYear`; `const cy = $derived(currentYear(net?.dataDate)); const lines = $derived(trafficLines(net, [2019, cy - 1, cy], cy));`
- `C10PostOps.svelte`: import `currentYear`; `const cy = $derived(currentYear(bundle('network')?.dataDate));` small multiples use `trafficLines(b, [2019, cy], cy)` and the SourceLine detail `` `daily flights handled, 7-day average; blue ${cy}, grey 2019` ``; label `` `${ENTITIES[k].label} daily flights ${cy} vs 2019` ``.

- [ ] **Step 4: Run** `npx vitest run && npm run check && npx playwright test tests/e2e/story.spec.ts` → PASS.
- [ ] **Step 5: Commit** `git add -A src tests && git commit -m "feat: freshness-aware copy and data-derived current year"`

---

### Task 8: Sky refresh every 10 minutes, browser polling and an honest age label

**Files:**
- Modify: `.github/workflows/deploy.yml`, `src/lib/data/sky.ts`, `scripts/fetch-sky.ts`, `src/lib/data/liveState.svelte.ts`, `src/lib/viz/SkyCanvas.svelte`, `src/lib/chapters/C00ColdOpen.svelte`, `tests/e2e/fallbacks.spec.ts`
- Create: `src/lib/ui/SkyAge.svelte`
- Test: `tests/unit/sky.test.ts` (append), `tests/e2e/sky-refresh.spec.ts`

**Interfaces:**
- Consumes: `SkySnapshot`, `adsbLolTiles`, `parseAdsbLol`, `ageLabel`, `minutesAgo`, `UI`.
- Produces: `newerSky(cur: SkySnapshot | null, next: unknown): next is SkySnapshot`; `fetchAdsbLolTiles(fetchFn: typeof fetch, tiles: {lat:number;lon:number}[], delayMs?: number): Promise<{ aircraft: Aircraft[]; ok: number; failed: number }>`; `startPolling(): void` (in liveState, called by `startLoading`); `SkyAge.svelte` (no props; reads `sky`; root `p.sky-age` with class `stale` when >30 min).

- [ ] **Step 1: Failing unit tests** — append to `tests/unit/sky.test.ts`
```ts
import { newerSky, fetchAdsbLolTiles } from '$lib/data/sky';

describe('newerSky', () => {
  const snap = (fetchedAt: string, count = 1) => ({ fetchedAt, source: 'opensky' as const, count, aircraft: [] });
  it('accepts a newer, well-formed snapshot', () => {
    expect(newerSky(snap('2026-10-10T10:00:00Z'), snap('2026-10-10T10:10:00Z'))).toBe(true);
    expect(newerSky(null, snap('2026-10-10T10:10:00Z'))).toBe(true);
  });
  it('rejects older, equal, empty or malformed payloads', () => {
    const cur = snap('2026-10-10T10:10:00Z');
    expect(newerSky(cur, snap('2026-10-10T10:00:00Z'))).toBe(false);
    expect(newerSky(cur, snap('2026-10-10T10:10:00Z'))).toBe(false);
    expect(newerSky(cur, snap('2026-10-10T10:20:00Z', 0))).toBe(false);
    expect(newerSky(cur, { nope: true })).toBe(false);
    expect(newerSky(cur, null)).toBe(false);
  });
});

describe('fetchAdsbLolTiles', () => {
  it('keeps going when one tile throws', async () => {
    let n = 0;
    const f = (async () => {
      n++;
      if (n === 2) throw new TypeError('network');
      return new Response(JSON.stringify({ ac: [{ hex: `h${n}`, flight: 'X', lat: 50, lon: 4, alt_baro: 30000, track: 0, gs: 400 }] }));
    }) as typeof fetch;
    const r = await fetchAdsbLolTiles(f, [{ lat: 1, lon: 1 }, { lat: 2, lon: 2 }, { lat: 3, lon: 3 }], 0);
    expect(r).toMatchObject({ ok: 2, failed: 1 });
    expect(r.aircraft.map((a) => a.id)).toEqual(['h1', 'h3']);
  });
});
```
- [ ] **Step 2: Run** `npx vitest run tests/unit/sky.test.ts` → FAIL.
- [ ] **Step 3: Implement**

`src/lib/data/sky.ts` — append:
```ts
export function newerSky(cur: SkySnapshot | null, next: unknown): next is SkySnapshot {
  const n = next as SkySnapshot | null;
  if (!n || typeof n.fetchedAt !== 'string' || !Array.isArray(n.aircraft) || !(n.count > 0)) return false;
  const t = Date.parse(n.fetchedAt);
  if (!Number.isFinite(t)) return false;
  return !cur || t > Date.parse(cur.fetchedAt);
}

export async function fetchAdsbLolTiles(fetchFn: typeof fetch, tiles: { lat: number; lon: number }[], delayMs = 800) {
  const aircraft: Aircraft[] = [];
  let ok = 0, failed = 0;
  for (const t of tiles) {
    try {
      const r = await fetchFn(`https://api.adsb.lol/v2/point/${t.lat}/${t.lon}/250`, { signal: AbortSignal.timeout(20_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      aircraft.push(...parseAdsbLol(await r.json()));
      ok++;
    } catch {
      failed++;
    }
    if (delayMs) await new Promise((res) => setTimeout(res, delayMs));
  }
  return { aircraft, ok, failed };
}
```

`scripts/fetch-sky.ts` — replace the `fromAdsbLol` function with:
```ts
async function fromAdsbLol(): Promise<Aircraft[]> {
  const r = await fetchAdsbLolTiles((u, init) => fetch(u, { ...init, headers: UA }), adsbLolTiles(EUROPE_BBOX));
  console.log(`[sky] adsb.lol tiles ok=${r.ok} failed=${r.failed}`);
  return r.aircraft;
}
```
(add `fetchAdsbLolTiles` to the import list; fix the user agent URL to `https://github.com/euctrl-pru/a-full-flight-story`).

`.github/workflows/deploy.yml` — change the cron line to `- cron: '*/10 * * * *'`.

`src/lib/data/liveState.svelte.ts` — replace the sky part of `startLoading` and add polling + EUROCONTROL revisit:
```ts
import { newerSky } from './sky';

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
```
(Delete the old inline `loadEurocontrol(...)` call and the old `fetch(\`${base}/data/sky.json\`)` chain.)

`src/lib/ui/SkyAge.svelte`
```svelte
<script lang="ts">
  import { sky } from '$lib/data/liveState.svelte';
  import { ageLabel, minutesAgo } from '$lib/data/sky';
  import { UI } from './ui-strings';
  let now = $state(Date.now());
  $effect(() => { const id = setInterval(() => (now = Date.now()), 15_000); return () => clearInterval(id); });
  const snap = $derived(sky.snap);
  const stale = $derived(snap ? minutesAgo(snap.fetchedAt, now) > 30 : false);
  const source = $derived(snap?.source === 'adsb.lol' ? 'adsb.lol' : 'OpenSky Network');
</script>

{#if snap && snap.count > 0}
  <p class="sky-age" class:stale data-testid="sky-age">
    {UI.skyFrom(ageLabel(snap.fetchedAt, now), source)}{#if stale}<span> — {UI.skyDelayed}</span>{/if}
  </p>
{/if}

<style>
  .sky-age { margin: 4px 0 0; font-size: 13px; color: var(--ink-2); }
  .stale { color: var(--status-warning); }
</style>
```

`src/lib/chapters/C00ColdOpen.svelte` — step 0 branch: replace the HeroNumber `sub=…` with no `sub`, render `<SkyAge />` under the HeroNumber, use `UI.skyUnavailable` for the empty text, delete the `stale` derived. Import `SkyAge` and `UI`.

`src/lib/viz/SkyCanvas.svelte` — cross-fade on data change: add
```ts
  import { Tween } from 'svelte/motion';
  import { dur } from '$lib/scroll/motion';
  let prevPts: typeof pts = [];
  let lastDrawn: typeof pts = [];
  let lastAircraft: Aircraft[] | null = null;
  const fadeIn = new Tween(1, { duration: dur(600) });
  $effect.pre(() => {
    // `pts` is already recomputed for the new aircraft here, so remember what was last *drawn*
    if (lastAircraft && aircraft !== lastAircraft) { prevPts = lastDrawn; fadeIn.set(0, { duration: 0 }); fadeIn.target = 1; }
    lastAircraft = aircraft;
  });
```
and in the draw effect read `const k = fadeIn.current;`, draw `prevPts` with `ctx.globalAlpha = (1 - dim * 0.8) * (1 - k)`, then draw `pts` with `ctx.globalAlpha = (1 - dim * 0.8) * k`, and finally set `lastDrawn = pts;`.

`tests/e2e/fallbacks.spec.ts` — in the "stale sky snapshot" test replace the two expectations with:
```ts
  await expect(page.getByTestId('sky-age')).toContainText('3 days ago');
  await expect(page.getByTestId('sky-age')).toContainText('may be delayed');
```

- [ ] **Step 4: E2E** — `tests/e2e/sky-refresh.spec.ts`
```ts
import { test, expect } from '@playwright/test';
import { scrollStepTo } from './helpers';

const ac = (id: string) => ({ id, cs: id, lon: 4.5, lat: 50.9, alt: 35000, trk: 90, gs: 450 });

test('the open page swaps in newer aircraft and ignores older ones', async ({ page }) => {
  await page.clock.install();
  let call = 0;
  await page.route('**/data/sky.json*', (r) => {
    call++;
    const t = new Date(Date.now() - (call === 1 ? 300_000 : call === 2 ? 600_000 : 0)).toISOString(); // 2nd poll is OLDER
    const aircraft = call >= 3 ? [ac('A'), ac('B')] : [ac('A')];
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ fetchedAt: t, source: 'opensky', count: aircraft.length, aircraft }) });
  });
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="0"]');
  const v = page.locator('#cold-open .hero .v');
  await expect(v).toHaveText('1');
  await page.clock.runFor(61_000); // poll 2 → older → ignored
  await expect(v).toHaveText('1');
  await page.clock.runFor(61_000); // poll 3 → newer, 2 aircraft
  await expect(v).toHaveText('2');
  await expect(page.getByTestId('sky-age')).toContainText('OpenSky Network');
});

test('adsb.lol-sourced snapshots are labelled as such', async ({ page }) => {
  await page.route('**/data/sky.json*', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'adsb.lol', count: 1, aircraft: [ac('A')] }) }));
  await page.goto('/');
  await scrollStepTo(page, '#cold-open [data-step="0"]');
  await expect(page.getByTestId('sky-age')).toContainText('adsb.lol');
});
```
- [ ] **Step 5: Run** `npx vitest run && npm run check && npx playwright test tests/e2e/sky-refresh.spec.ts tests/e2e/fallbacks.spec.ts` → PASS.
- [ ] **Step 6: Commit** `git add -A src scripts tests .github && git commit -m "feat: 10-minute sky refresh, in-page polling and an honest age label"`

---

### Task 9: Lighter, smoother maps (Europe topology + exact zoom transform)

**Files:**
- Create: `scripts/build-geo.ts`, `src/lib/geo/europe.topo.json` (generated, committed), `src/lib/geo/map-transform.ts`
- Modify: `package.json` (dev deps + `geo` script), `src/lib/geo/countries.ts`, `src/lib/viz/BaseMap.svelte`
- Test: `tests/unit/geo-build.test.ts`, `tests/unit/map-transform.test.ts`, existing route/flight tests (must still pass)

**Interfaces:**
- Consumes: `makeProjection`, `lerpProjection`, `EUROPE_FRAME`, `ISO`.
- Produces: `projectionTransform(base: GeoProjection, cur: GeoProjection): { k: number; transform: string }`; `loadCountries()` unchanged signature (now backed by `europe.topo.json`).

- [ ] **Step 1: Failing tests**

`tests/unit/map-transform.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { makeProjection, lerpProjection, EUROPE_FRAME, ROUTE_FRAME, ROME_FRAME } from '$lib/geo/projection';
import { projectionTransform } from '$lib/geo/map-transform';

const apply = (t: { k: number; tx: number; ty: number; bx: number; by: number }, p: [number, number]) =>
  [t.tx + t.k * (p[0] - t.bx), t.ty + t.k * (p[1] - t.by)];

describe('projectionTransform', () => {
  it('maps the base projection exactly onto any zoomed projection', () => {
    const base = makeProjection(900, 600, EUROPE_FRAME);
    for (const cur of [makeProjection(900, 600, ROUTE_FRAME), lerpProjection(900, 600, ROUTE_FRAME, ROME_FRAME, 0.37)]) {
      const t = projectionTransform(base, cur);
      for (const ll of [[4.48, 50.9], [12.24, 41.8], [-3.7, 40.4], [24.9, 60.2]] as [number, number][]) {
        const [x, y] = apply(t, base(ll)!);
        const [cx, cy] = cur(ll)!;
        expect(x).toBeCloseTo(cx, 6);
        expect(y).toBeCloseTo(cy, 6);
      }
      expect(t.transform).toMatch(/^translate\(.+\) scale\(.+\) translate\(.+\)$/);
    }
  });
});
```

`tests/unit/geo-build.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { statSync } from 'node:fs';
import { loadCountries, ISO } from '$lib/geo/countries';

describe('europe topology', () => {
  it('is within budget and contains every route country', async () => {
    expect(statSync('src/lib/geo/europe.topo.json').size).toBeLessThanOrEqual(120 * 1024);
    const ids = new Set((await loadCountries()).features.map((f) => String(f.id)));
    for (const iso of Object.values(ISO)) expect(ids.has(iso), iso).toBe(true);
  });
});
```
- [ ] **Step 2: Run** `npx vitest run tests/unit/map-transform.test.ts tests/unit/geo-build.test.ts` → FAIL.
- [ ] **Step 3: Implement**

Install: `npm i -D topojson-server topojson-simplify @types/topojson-server @types/topojson-simplify`; add script `"geo": "tsx scripts/build-geo.ts"`.

`scripts/build-geo.ts`
```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { topology } from 'topojson-server';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { geoBounds } from 'd3-geo';

const world = JSON.parse(readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'));
const fc = feature(world, world.objects.countries) as unknown as GeoJSON.FeatureCollection;
const [W, S, E, N] = [-30, 25, 50, 72];
const keep = fc.features.filter((f) => {
  const [[w, s], [e, n]] = geoBounds(f as any);
  const lonOk = w > e /* crosses antimeridian */ || (e >= W && w <= E);
  return lonOk && n >= S && s <= N;
});
const P = Number(process.env.GEO_P ?? 0.5); // fraction of points removed; tune to meet the 120 KB budget
let topo = topology({ countries: { type: 'FeatureCollection', features: keep } } as any, 1e5);
topo = simplify(presimplify(topo as any), quantile(presimplify(topo as any), P)) as any;
const body = JSON.stringify(topo);
writeFileSync('src/lib/geo/europe.topo.json', body);
console.log(`europe.topo.json: ${keep.length} countries, ${(body.length / 1024).toFixed(0)} KiB (P=${P})`);
```
Run `npm run geo`; if the output exceeds 120 KiB, re-run with `GEO_P=0.6`, `0.7` … until it fits; keep the smallest P that fits and hard-code it as the default.

`src/lib/geo/countries.ts` — replace `loadCountries`:
```ts
export function loadCountries(): Promise<CountryFC> {
  cache ??= Promise.all([import('topojson-client'), import('./europe.topo.json')]).then(([{ feature }, mod]) => {
    const topo = ((mod as any).default ?? mod) as Topology;
    return feature(topo, topo.objects.countries) as unknown as CountryFC;
  });
  return cache;
}
```

`src/lib/geo/map-transform.ts`
```ts
import type { GeoProjection } from 'd3-geo';

/**
 * makeProjection/lerpProjection only differ in scale and translate (same rotation & parallels),
 * so `cur(p) = t_c + (k_c/k_b) * (base(p) - t_b)` exactly — an SVG transform, no re-projection needed.
 */
export function projectionTransform(base: GeoProjection, cur: GeoProjection) {
  const k = cur.scale() / base.scale();
  const [bx, by] = base.translate();
  const [tx, ty] = cur.translate();
  return { k, tx, ty, bx, by, transform: `translate(${tx},${ty}) scale(${k}) translate(${-bx},${-by})` };
}
```

`src/lib/viz/BaseMap.svelte` — draw countries once per size with the base projection, zoom by transform:
```svelte
<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { geoPath, geoGraticule10, type GeoProjection, type GeoPath } from 'd3-geo';
  import { loadCountries, type CountryFC } from '$lib/geo/countries';
  import { EUROPE_FRAME, lerpProjection, makeProjection } from '$lib/geo/projection';
  import { projectionTransform } from '$lib/geo/map-transform';
  import { dur } from '$lib/scroll/motion';

  type Ctx = { projection: GeoProjection; path: GeoPath; width: number; height: number };
  let { label, frame = EUROPE_FRAME, frameTo, t = 0, highlight = [], children, overlay }: {
    label: string; frame?: GeoJSON.GeoJsonObject; frameTo?: GeoJSON.GeoJsonObject; t?: number; highlight?: string[];
    children?: Snippet<[Ctx]>; overlay?: Snippet<[Ctx]>;
  } = $props();

  let width = $state(0), height = $state(0);
  let countries: CountryFC | null = $state(null);
  onMount(() => { loadCountries().then((fc) => (countries = fc)); });
  const tt = Tween.of(() => t, { duration: dur(300) });
  const projection = $derived(frameTo ? lerpProjection(width, height, frame, frameTo, tt.current) : makeProjection(width, height, frame));
  const path = $derived(geoPath(projection));
  const ctx = $derived({ projection, path, width, height });
  // base layer: projected once per size, then zoomed with an exact transform
  const base = $derived(makeProjection(width, height, EUROPE_FRAME));
  const basePath = $derived(geoPath(base));
  const land = $derived(countries ? basePath({ type: 'FeatureCollection', features: countries.features.filter((f) => !highlight.includes(String(f.id))) } as any) : '');
  const hl = $derived(countries ? basePath({ type: 'FeatureCollection', features: countries.features.filter((f) => highlight.includes(String(f.id))) } as any) : '');
  const grat = $derived(basePath(geoGraticule10()));
  const tf = $derived(projectionTransform(base, projection).transform);
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
  {#if width > 0 && height > 0}
    <svg {width} {height} role="img" aria-label={label}>
      <g transform={tf}>
        <path class="graticule" d={grat} />
        {#if countries}
          <path class="country" d={land} />
          {#if hl}<path class="country hl" d={hl} />{/if}
        {/if}
      </g>
      {@render children?.(ctx)}
    </svg>
    {@render overlay?.(ctx)}
  {/if}
</div>

<style>
  .map { position: relative; width: 100%; height: 100%; }
  svg { display: block; }
  .graticule { fill: none; stroke: var(--grid); stroke-width: 0.5; vector-effect: non-scaling-stroke; }
  .country { fill: var(--surface-2); stroke: var(--axis); stroke-width: 0.6; vector-effect: non-scaling-stroke; }
  .country.hl { fill: color-mix(in srgb, var(--accent) 14%, var(--surface-2)); }
</style>
```
(Note: Task 6 introduced the `tt` tween in this file; this replacement keeps it.)

- [ ] **Step 4: Run** `npx vitest run && npm run check && npx playwright test tests/e2e/maps.spec.ts tests/e2e/story.spec.ts` → PASS. In `tests/e2e/maps.spec.ts` the country selector still matches (`path.country`). Read one desktop and one mobile map screenshot to confirm coastlines look right after simplification.
- [ ] **Step 5: Commit** `git add -A package.json package-lock.json scripts src tests && git commit -m "perf: Europe-only topology and transform-based map zoom"`

---

### Task 10: Lazy chapter graphics and performance budgets

**Files:**
- Create: `src/lib/chapters/graphics/G00.svelte … G10.svelte` and `G02b.svelte` (one per chapter graphic), `src/lib/chapters/registry.ts`, `src/lib/scroll/near.ts`
- Delete: `src/lib/chapters/C00ColdOpen.svelte … C10PostOps.svelte`, `C02bWeekBefore.svelte` (C11Sources stays)
- Modify: `src/lib/ui/Chapter.svelte`, `src/routes/+page.svelte`
- Test: `tests/e2e/perf.spec.ts`, `tests/e2e/nav.spec.ts` (append)

**Interfaces:**
- Consumes: `CHAPTERS`, `firstChapterOfPhase`, `PhaseDivider`.
- Produces: `GRAPHICS: Record<string, () => Promise<{ default: Component<{ step: number; progress: number }> }>>` (`registry.ts`); `Chapter.svelte` accepts either `graphic` (snippet, as before) or `load` (lazy loader); Svelte action `near(node, cb)` firing once when within one viewport.

- [ ] **Step 1: Failing e2e** — `tests/e2e/perf.spec.ts` (runs on the `mobile` project only)
```ts
import { test, expect } from '@playwright/test';
import zlib from 'node:zlib';

test.beforeEach(({}, info) => test.skip(info.project.name !== 'mobile', 'budgets measured on the phone profile'));

test('initial JS ≤ 250 KB gzip', async ({ page }) => {
  let js = 0;
  page.on('response', async (r) => {
    if (r.url().includes('localhost') && /\.js(\?|$)/.test(r.url())) js += zlib.gzipSync(await r.body()).length;
  });
  await page.goto('/');
  await page.waitForTimeout(3000);
  expect(js / 1024).toBeLessThanOrEqual(250);
});

test('FCP ≤ 2.5 s on slow 4G', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await page.goto('/');
  const fcp = await page.evaluate(() => new Promise<number>((res) => {
    new PerformanceObserver((l) => { const e = l.getEntriesByName('first-contentful-paint')[0]; if (e) res(e.startTime); }).observe({ type: 'paint', buffered: true });
  }));
  expect(fcp).toBeLessThanOrEqual(2500);
});

test('no long task > 200 ms while scrolling at 4× CPU throttle', async ({ page }) => {
  await page.route('https://api-data-app.eurocontrol.int/**', (r) => r.abort());
  const cdp = await page.context().newCDPSession(page);
  await page.goto('/');
  await page.waitForTimeout(1500);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => { (window as any).__lt = []; new PerformanceObserver((l) => (window as any).__lt.push(...l.getEntries().map((e) => e.duration))).observe({ type: 'longtask' }); });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 500) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(120); }
  const worst = await page.evaluate(() => Math.max(0, ...(window as any).__lt));
  expect(worst).toBeLessThanOrEqual(200);
});
```
Append to `tests/e2e/nav.spec.ts`:
```ts
test('deep link into a lazily loaded chapter renders its graphic and phase', async ({ page }) => {
  await page.goto('/#enroute');
  await expect(page.locator('#enroute .graphic svg').first()).toBeVisible();
  await expect(page.locator('.clock .now')).toContainText('Tactical');
});
```
- [ ] **Step 2: Run** `npx playwright test tests/e2e/perf.spec.ts --project=mobile` → expect the JS budget test to FAIL (≈324 KB gzip today without the atlas) — record the numbers.
- [ ] **Step 3: Implement**

`src/lib/scroll/near.ts`
```ts
/** Calls `cb` once when the node comes within one viewport of view. */
export function near(node: HTMLElement, cb: () => void) {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { cb(); io.disconnect(); } }, { rootMargin: '100% 0px' });
  io.observe(node);
  return { destroy: () => io.disconnect() };
}
```

Graphic components — **mechanical move, one per chapter**: for each `src/lib/chapters/Cxx*.svelte` (C00…C10 and C02bWeekBefore) create `src/lib/chapters/graphics/Gxx.svelte` (`G00, G01, G02, G02b, G03, G04, G05, G06, G07, G08, G09, G10`) by:
1. copying the whole `<script lang="ts">` block, deleting the `import Chapter …` line, the `import { chapter } …` line and the `const ch = chapter('…');` line, and adding `let { step, progress }: { step: number; progress: number } = $props();` (`progress` may be unused — prefix with `void progress;` if svelte-check warns);
2. copying the markup **inside** `{#snippet graphic({ step, progress })} … {/snippet}` as the component's markup (drop the `<Chapter>` wrapper and the snippet tags);
3. copying the `<style>` block unchanged.
Then delete the `Cxx` files.

`src/lib/chapters/registry.ts`
```ts
import type { Component } from 'svelte';
type G = () => Promise<{ default: Component<{ step: number; progress: number }> }>;
export const GRAPHICS: Record<string, G> = {
  'cold-open': () => import('./graphics/G00.svelte'),
  strategic: () => import('./graphics/G01.svelte'),
  airspace: () => import('./graphics/G02.svelte'),
  'week-before': () => import('./graphics/G02b.svelte'),
  filing: () => import('./graphics/G03.svelte'),
  twist: () => import('./graphics/G04.svelte'),
  delay: () => import('./graphics/G05.svelte'),
  reroute: () => import('./graphics/G06.svelte'),
  ground: () => import('./graphics/G07.svelte'),
  enroute: () => import('./graphics/G08.svelte'),
  arrival: () => import('./graphics/G09.svelte'),
  postops: () => import('./graphics/G10.svelte')
};
```

`src/lib/ui/Chapter.svelte` — accept a loader:
```ts
  import type { Component } from 'svelte';
  import { near } from '$lib/scroll/near';
  type Loader = () => Promise<{ default: Component<{ step: number; progress: number }> }>;
  let { chapter, graphic, load }: { chapter: ChapterDef; graphic?: Snippet<[{ step: number; progress: number }]>; load?: Loader } = $props();
  let G: Component<{ step: number; progress: number }> | null = $state(null);
  function wake() { load?.().then((m) => (G = m.default)); }
```
markup for the graphic slot:
```svelte
    <div class="graphic" use:near={wake}>
      {#if graphic}{@render graphic({ step, progress })}{:else if G}<G {step} {progress} />{/if}
    </div>
```

`src/routes/+page.svelte` — replace the hand-written chapter list with a loop that also places the dividers:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { startLoading } from '$lib/data/liveState.svelte';
  import MissionClock from '$lib/ui/MissionClock.svelte';
  import Chapter from '$lib/ui/Chapter.svelte';
  import PhaseDivider from '$lib/ui/PhaseDivider.svelte';
  import OverviewTimeline from '$lib/viz/OverviewTimeline.svelte';
  import C11Sources from '$lib/chapters/C11Sources.svelte';
  import { CHAPTERS } from '$lib/story/chapters';
  import { firstChapterOfPhase } from '$lib/story/phases';
  import { GRAPHICS } from '$lib/chapters/registry';
  import { UI } from '$lib/ui/ui-strings';
  import type { AtmPhase } from '$lib/story/types';
  onMount(startLoading);
  const firsts = Object.entries(firstChapterOfPhase(CHAPTERS)) as [AtmPhase, string][];
  const dividerBefore = (id: string) => firsts.find(([, c]) => c === id)?.[0];
</script>
```
and in `<main>` after the overview section:
```svelte
  {#each CHAPTERS as ch (ch.id)}
    {@const ph = dividerBefore(ch.id)}
    {#if ph}<PhaseDivider phase={ph} />{/if}
    <Chapter chapter={ch} load={GRAPHICS[ch.id]} />
  {/each}
  <C11Sources />
```
Note: `PhaseDivider` must be the element right before the chapter `<section>` (the Task 4 test checks `nextElementSibling`), so keep both directly inside `<main>`.

Also defer non-critical work: in `liveState.startLoading`, wrap the first `refreshEurocontrol()` and `pollSky()` in `requestIdleCallback ?? setTimeout(…, 0)`:
```ts
  const idle = (fn: () => void) => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 0));
  idle(() => { refreshEurocontrol(); pollSky(); });
  startPolling();
```

- [ ] **Step 4: Run** `npm run check && npx vitest run && npx playwright test` → all PASS including `perf.spec.ts`. If the JS budget still fails, list the initial chunks (`page.on('response')` URLs) and move the next-largest eagerly imported module behind a dynamic import (most likely `d3` pulled in by `OverviewTimeline` → switch it to `d3-scale` only). If the long-task test fails, profile which step (Chrome trace via `cdp.send('Tracing.start')` is optional; usually it's a graphic mounting) and defer that graphic's heavy computation into `requestIdleCallback`.
- [ ] **Step 5: Commit** `git add -A src tests && git commit -m "perf: lazy chapter graphics, deferred data loading and enforced budgets"`

---

### Task 11: Share cards, favicon, structured data, sitemap

**Files:**
- Create: `src/lib/site.ts`, `scripts/og-image.ts`, `static/og.png` (generated), `static/favicon.svg`, `static/robots.txt`, `static/sitemap.xml`
- Modify: `src/app.html` (favicon), `src/routes/+page.svelte` (`<svelte:head>`), `package.json` (`og` script)
- Test: `tests/e2e/seo.spec.ts`

**Interfaces:**
- Produces: `SITE_URL = 'https://euctrl-pru.github.io/a-full-flight-story/'`, `SITE_TITLE`, `SITE_DESCRIPTION`.

- [ ] **Step 1: Failing e2e** — `tests/e2e/seo.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test('share and SEO metadata', async ({ page, request }) => {
  await page.goto('/');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/og\.png$/);
  expect((await request.get('/og.png')).status()).toBe(200);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /A Full Flight Story/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://euctrl-pru.github.io/a-full-flight-story/');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /favicon\.svg$/);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld['@type']).toBe('Article');
  expect((await request.get('/robots.txt')).status()).toBe(200);
  expect(await (await request.get('/sitemap.xml')).text()).toContain('https://euctrl-pru.github.io/a-full-flight-story/');
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**

`src/lib/site.ts`
```ts
export const SITE_URL = 'https://euctrl-pru.github.io/a-full-flight-story/';
export const SITE_TITLE = 'A Full Flight Story — how a flight becomes a flight in Europe';
export const SITE_DESCRIPTION = 'Follow FFS101 from Brussels to Rome — from airport slots ten months ahead through the four planning phases to post-ops — with live EUROCONTROL data.';
```

`static/favicon.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0a0d14"/><path transform="translate(16 16) rotate(45)" fill="#9ec5f4" d="M0,-11 L2,-4 L10,1 L10,3 L2,1 L1.5,7 L4,9 L4,10.5 L0,9.5 L-4,10.5 L-4,9 L-1.5,7 L-2,1 L-10,3 L-10,1 L-2,-4 Z"/></svg>
```
`src/app.html` — in `<head>` add `<link rel="icon" href="%sveltekit.assets%/favicon.svg" type="image/svg+xml" />`.

`static/robots.txt`
```
User-agent: *
Disallow: /a-full-flight-story/dev/
Sitemap: https://euctrl-pru.github.io/a-full-flight-story/sitemap.xml
```
`static/sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://euctrl-pru.github.io/a-full-flight-story/</loc><changefreq>daily</changefreq></url>
</urlset>
```

`src/routes/+page.svelte` — `<svelte:head>`:
```svelte
<svelte:head>
  <title>{SITE_TITLE}</title>
  <meta name="description" content={SITE_DESCRIPTION} />
  <link rel="canonical" href={SITE_URL} />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={SITE_TITLE} />
  <meta property="og:description" content={SITE_DESCRIPTION} />
  <meta property="og:url" content={SITE_URL} />
  <meta property="og:image" content="{SITE_URL}og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={SITE_TITLE} />
  <meta name="twitter:description" content={SITE_DESCRIPTION} />
  <meta name="twitter:image" content="{SITE_URL}og.png" />
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article', headline: SITE_TITLE, description: SITE_DESCRIPTION,
    url: SITE_URL, image: `${SITE_URL}og.png`, datePublished: '2026-10-10', author: { '@type': 'Organization', name: 'EUROCONTROL Performance Review Unit (euctrl-pru)' }
  }).replace(/</g, '\\u003c')}</script>`}
</svelte:head>
```
(import `SITE_URL, SITE_TITLE, SITE_DESCRIPTION` from `$lib/site`; this is our own constant data, so `{@html}` here is allowed by the Global Constraints.)

`scripts/og-image.ts` (add `"og": "tsx scripts/og-image.ts"`):
```ts
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const sky = JSON.parse(readFileSync('static/data/sky.json', 'utf8')) as { aircraft: { lon: number; lat: number; alt: number }[] };
const dots = sky.aircraft.map((a) => [a.lon, a.lat, a.alt]);
const html = `<!doctype html><html><body style="margin:0;background:#0a0d14">
<canvas id="c" width="1200" height="630"></canvas>
<div style="position:absolute;left:64px;bottom:72px;font-family:Georgia,serif;color:#fff">
  <div style="font:600 18px system-ui;letter-spacing:.14em;text-transform:uppercase;color:#c3c2b7">A data story · live EUROCONTROL data</div>
  <div style="font-size:76px;font-weight:700;margin:8px 0">A Full Flight Story</div>
  <div style="font:400 26px system-ui;color:#c3c2b7">How a flight becomes a flight in Europe</div>
</div>
<script>
const d=${JSON.stringify(dots)};const c=document.getElementById('c').getContext('2d');
const X=(lon)=>600+(lon-10)*22, Y=(lat)=>330-(lat-48)*30;
for(const [lon,lat,alt] of d){c.fillStyle=alt>30000?'#9ec5f4':alt>15000?'#5598e7':'#2a78d6';c.globalAlpha=.85;c.beginPath();c.arc(X(lon),Y(lat),1.8,0,7);c.fill();}
</script></body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.waitForTimeout(300);
await p.screenshot({ path: 'static/og.png' });
await b.close();
console.log('wrote static/og.png');
```
Run `npm run og`; Read `static/og.png` and check the title is legible over the dots.

- [ ] **Step 4: Run** `npm run check && npx playwright test tests/e2e/seo.spec.ts` → PASS.
- [ ] **Step 5: Commit** `git add -A src static scripts package.json tests && git commit -m "feat: social share card, favicon, structured data and sitemap"`

---

### Task 12: Accessibility, visual review, README and full verification

**Files:**
- Modify: `tests/e2e/a11y.spec.ts`, `README.md`
- Test: whole suite

- [ ] **Step 1: Extend a11y** — in `tests/e2e/a11y.spec.ts` add `'#phase-tactical'`, `'#overview'` to the list of scrolled selectors, and a drawer check inside the theme loop:
```ts
    await page.getByRole('button', { name: 'Chapters' }).click();
    const d = await new AxeBuilder({ page }).include('dialog').analyze();
    expect(d.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
    await page.keyboard.press('Escape');
```
Run `npx playwright test tests/e2e/a11y.spec.ts` → PASS (fix contrast via phase tokens if the pills/labels fail; never by removing labels).
- [ ] **Step 2: Visual review** — run `npx playwright test tests/e2e/story.spec.ts` (writes `screenshots/{desktop,mobile}/*.png`), compose contact sheets (4–6 per row) and Read them, in dark and light; also screenshot `#overview` and each `#phase-*` at 1440 and 390. Fix overlaps, clipped labels, unreadable phase colours.
- [ ] **Step 3: README** — update the Data section: refresh every 10 minutes (best-effort), anonymous OpenSky with adsb.lol fallback, the in-page 60 s poll and age label; add "Phases" (four ATFCM phases) and "Performance budgets" bullets; mention `npm run geo` and `npm run og`.
- [ ] **Step 4: Full verification** — `npm test && npm run check && npm run build && npm run test:e2e` → everything green. Paste the summary counts into the commit body.
- [ ] **Step 5: Commit** `git add -A && git commit -m "test: a11y for phases and drawer; README for the experience upgrade"`
- [ ] **Step 6: Deploy — ask first.** Pushing to `main` redeploys the public site. Ask Quinten; on yes: `git checkout main && git merge --ff-only feat/experience-upgrade && git push origin main && gh run watch` and verify the live page (phase band, divider, overview, drawer, sky age label).
