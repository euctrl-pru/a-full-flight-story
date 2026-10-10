# A Full Flight Story: Experience Upgrade (Design Spec)

Date: 2026-10-10 · Status: design approved section by section in chat; awaiting written-spec review.
Builds on: `docs/superpowers/specs/2026-10-09-full-flight-story-design.md` (all of its rules still apply, especially
**sources everywhere**, no `{@html}` for third-party text, reduced motion and 390 px without horizontal scroll).

## Goal

Make the story **feel alive and current on every visit** and make the **ATM planning phases legible** to a general
audience, without misrepresenting how fresh any data is.

What Quinten asked for, and what we found:

| Request | Finding | Decision |
|---|---|---|
| Clearer strategic / pre-tactical / tactical / post-ops | Phases only appear in some chapter kickers | Phase framework (§1) |
| OpenSky dots refreshing every 2 s | Not feasible: no browser CORS; Europe bbox costs 4 credits; anonymous quota 400 credits/day; OpenSky updates every 5–10 s anyway | Keep GitHub-only hosting; refresh every **10 min** via Actions; browser polls and swaps (§3) |
| Numbers updated on every load | EUROCONTROL data already fetched live per load, but it only publishes daily (D−1, sometimes later); the stale part is the sky snapshot (GitHub cron never fired in 85 min) and copy that always says "Yesterday" | Reliable refresh + freshness-aware copy (§3) |
| Smoother, prettier, more dynamic transitions | Graphics hard-cut between steps; map re-projects every frame | Animate in place (§2), performance work (§4) |
| Table of contents | None | Overview timeline + chapter drawer + deep links (§2) |
| Share cards / SEO, phone performance | No OG image, 750 KB world atlas | §4 |
| Multilingual (de, fr, it, es, pl) | — | **Separate follow-up project**; this project extracts nothing yet but must not make strings harder to extract (copy stays in `chapters.ts`/`glossary.ts`, UI strings centralised in one `ui-strings.ts`) |

Non-goals: per-second live aircraft; new hosting (Cloudflare/Deno); persistent single-stage restructure; GSAP; translations.

## 1. Phase framework

**Model.** `src/lib/story/phases.ts` exports `ATM_PHASES`, ordered:

| id | label | horizon | what is decided (one sentence) | sources |
|---|---|---|---|---|
| `strategic` | Strategic | ~18 months to ~1 week before | Airport slots, schedules, route network and capacity plans | S8, S21, S25 |
| `pretactical` | Pre-tactical | D−6 to D−1 | Demand vs capacity per day, military airspace bookings, the next day's flow plan | S8, S19 |
| `tactical` | Tactical | Day of operation | Regulations, slots (CTOT), reroutes, A-CDM, control hand-overs | S7, S13 |
| `postops` | Post-operations | After the flight | Delay attribution, billing, performance review, lessons for next season | S8, S32, S37 |

Each `ChapterDef` gets `phase: AtmPhase`; a `StepDef` may override it (`phase?: AtmPhase`) — needed for Chapter 2
(`as-patchwork`, `as-rad` strategic; `as-military`, `as-pretactical` pre-tactical). Filing (Chapter 3) is
`pretactical` (D−1 17:00 UTC). Cold open has no phase (`phase: null`, label "Now").
Unit tests: every step resolves to a phase or the cold open; phases never go backwards in story order; every phase
has ≥1 resolvable source.

**Colour.** Four steps of one ordinal ramp (phases are ordered in time), distinct from the categorical chart slots so a
phase never looks like a data series. Proposed: violet ramp (dark theme `#5b4fc9 #7a6fe0 #9a91ec #bdb7f4`; light theme
`#3b2f9a #4a3aa7 #6b5fc4 #8f85d6`), validated with the dataviz validator (`--ordinal`) on both surfaces; every use also
carries the phase's text label (never colour alone). Exposed as CSS vars `--phase-strategic` … `--phase-postops`.

**Top bar (mission clock).** The rail is divided into four labelled, tinted segments covering the phases' clock ranges
(derived from the chapters' `clock` values). Left label shows "<Phase> · <clockLabel>" (e.g. "Pre-tactical · D−1").
The plane marker takes the current phase colour. The progressbar ARIA semantics stay on the rail.

**Phase divider screens.** `PhaseDivider.svelte` renders before the first chapter of each phase: phase name, horizon on a
mini log-time strip highlighting that phase, "Who's at the table" (stakeholder chips from `stakeholders.ts` filtered
to actors with events in that phase), "What gets decided", citation chips. Entrance animation (fade + rise, staggered
chips); static under reduced motion. Dividers are not scrollama steps; they set the mission clock to the phase start
when they enter view.

**Colour coding.** Chapter kickers ("Chapter 4 · Tactical") and the active step card's border use the phase colour.

**Overview timeline** (`OverviewTimeline.svelte`, placed right after the intro). Horizontal on ≥1024 px, vertical below.
Signed-log time axis relative to EOBT (`sign(t)·log10(1+|t_hours|)`) from T−10 months to T+1 year, so months and
minutes both fit; tick labels "−10 mo", "−1 mo", "−1 wk", "D−1", "EOBT", "+2 h", "+1 d", "+1 yr". Shows the four phase
bands, one dot per `EVENTS` entry (hover/focus tooltip with label + time), and chapter labels positioned at their
first event. Clicking a chapter label or band scrolls to that chapter (it doubles as the table of contents). Pure
helper `timeScale(isoTime): number` is unit-tested (monotonic, EOBT at 0, symmetric).

## 2. Transitions & navigation ("animate in place")

- **Graphic swaps within a chapter:** wrap each step's graphic branch so the outgoing one fades/drifts up and the
  incoming fades in from below (~400 ms, Svelte `fade`/`fly` with shared `dur()`), instead of hard cuts.
- **Charts animate data:** BarChart bars tween height from baseline and between datasets; LineChart/StackedArea keep the
  scroll-scrubbed reveal and tween when data swaps snapshot → live; HeroNumber already counts up; CasaQueue slides
  flights from "wanted" to "given" when the queue stage begins (tweened positions).
- **Maps glide:** camera changes between steps tween over ~800 ms (eased) using `lerpProjection`; route draws with
  scroll; military areas / regulated sector fade in.
- **Between chapters:** chapter header fades/rises on entering; map chapters that hand off share camera frames
  (cold-open end = airspace start; reroute end = en-route start).
- **Chapter drawer:** "Chapters" button in the top bar opens a drawer listing chapters grouped by phase (phase colour +
  label), current chapter marked, "chapter N of 10"; Esc/close button; focus trapped while open; returns focus.
- **Deep links:** each chapter `#id`; the hash updates as chapters enter view via `history.replaceState` (no history
  spam); loading with a hash lands on that chapter with the correct graphic/clock.
- **Back to top** link at the end.
- **Reduced motion:** all of the above become instant.
- **Tests (e2e):** drawer opens/closes/jumps with keyboard; timeline click jumps; deep links `#twist`, `#reroute` on the
  real page; reload while scrolled restores state; fast programmatic scroll through all steps produces no errors.

## 3. Live data & freshness

**Aircraft refresh (GitHub only, no secrets).**
- Workflow schedule `*/10 * * * *` (best-effort; real cadence ~10–20 min). Scheduled runs skip unit tests, use the npm
  cache, and deploy as today.
- Quota reality: 144 Europe calls/day × 4 credits = 576 > anonymous 400/day, so later in the (UTC) day OpenSky returns
  429 and `fetch-sky.ts` falls back to adsb.lol (existing behaviour; additionally make each adsb.lol tile fetch
  individually fault-tolerant). The snapshot's `source` field drives the label, so the page always names the actual
  source.
- Verify during planning that custom Actions Pages deployments are not subject to the 10-builds/hour soft limit; if they
  are, keep `*/10` (6/hour) which is under it anyway.

**Browser.**
- `liveState` polls `${base}/data/sky.json?ts=<now>` every 60 s while the page is visible (Page Visibility API), and only
  replaces `sky.snap` when `fetchedAt` is newer; SkyCanvas cross-fades old → new dots (~600 ms).
- Running age label "Aircraft positions from 6 min ago · OpenSky Network" (or "· adsb.lol"), refreshed every 15 s;
  >30 min → amber + "the feed may be delayed"; empty/unavailable → existing empty state.
- EUROCONTROL: keep live fetch on load; also re-run `loadEurocontrol` when the tab becomes visible again if the last
  check is >15 min old.

**Freshness-aware copy.**
- New rich-text token `{{date:<entityKey>}}` → "yesterday (Thu 8 Oct)" when that bundle's `dataDate` is the viewer's
  UTC yesterday, else "on Thu 8 Oct"; `{{live:report}}` → "fetched live" / "from the latest snapshot" by
  `reportFreshness`. Tokens resolve at render time from `ec` state; unresolved (no data) → neutral wording
  ("on the latest day available"). Cold open and Chapter 5 copy switch to these tokens.
- Current-year for traffic charts derives from the network bundle's `dataDate` (no hard-coded 2026); prior-year line
  = current−1; reference 2019 stays.
- Unit tests: date phrasing for yesterday / older / missing; year rollover (dataDate 2027-01-02 → current 2027).

## 4. Phone performance, share & SEO

**Map geometry.** `scripts/build-geo.ts` (run at build/`prebuild`) writes `static/geo/europe.json`: Natural Earth
1:50m countries filtered to a bbox around Europe/Med (lon −30…50, lat 25…72), quantized topojson (target ≤120 KB).
`loadCountries()` fetches it instead of importing the world atlas. Countries render as one `<path>` (plus separate
highlighted paths). Unit test: output contains all route countries and stays under the size budget.

**Smooth zooms.** During camera tweens, BaseMap renders the base layer with an SVG transform interpolated between the
start and end projections and re-projects once at the end (and on resize), instead of recomputing every path per
scroll frame.

**Less work at once.** Chapters mount heavy graphics only within ~1 viewport of view (IntersectionObserver);
SkyCanvas pauses drawing when off-screen; the EUROCONTROL snapshot fetch starts after first paint.

**Budgets (enforced by e2e on push, not on schedule):** initial JS ≤250 KB gzip; no long task >200 ms during a scripted
scroll under 4× CPU throttling; first contentful paint ≤2.5 s on simulated 4G.

**Share & SEO.** Build-time OG/Twitter image (1200×630, title over a still of the sky map, generated by a Playwright
script into `static/og.png`), `og:*`/`twitter:*` meta, canonical URL, favicon (plane), JSON-LD `Article`
(author, dates), `sitemap.xml`, `robots.txt` (dev routes disallowed). E2E checks presence.

## Testing & acceptance

- All existing tests stay green; new unit tests as listed per section; new e2e: phases visible in top bar and dividers,
  drawer/timeline navigation, deep links on the real page, freshness labels (fresh / old / adsb.lol source), sky poll
  swap (mock newer `sky.json`), meta tags/OG, performance budgets, axe (both themes) including the drawer.
- Visual review of desktop + 390 px contact sheets in both themes before completion.

## Risks

- GitHub cron remains best-effort; the age label keeps it honest.
- Anonymous OpenSky quota means adsb.lol supplies a share of refreshes; coverage differs slightly between sources.
- Animation polish can regress performance; budgets in tests guard it.
