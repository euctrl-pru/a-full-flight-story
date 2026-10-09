# A Full Flight Story — Design Spec

Date: 2026-10-09 · Status: agreed with Quinten in Q&A (see "Decisions")

## What we're building

A long-form, scroll-driven data story ("scrollytelling") that explains **how a flight becomes a flight in Europe**.
It follows one fictional hero flight, **FFS101 Brussels (EBBR) → Rome Fiumicino (LIRF)**, from strategic
planning months ahead to post-operations analysis. Along the way it introduces every stakeholder and, at each
step, zooms out from the one flight to the whole European network using real EUROCONTROL data.

The plot twist: on the day of operation, FFS101 runs into an **ATFM regulation** (en-route ATC capacity in a
sector on its route). It gets a **CTOT** slot from the Network Manager's CASA algorithm, the A-CDM process at
Brussels re-plans the turnaround around it, and the airline considers a **reroute** offered by the Network Manager.

## Audience & tone

- Informed general public. Plain language; every acronym is introduced on first use and listed in a glossary.
- Editorial longform look (NYT / FT / The Pudding). Default dark "night sky / radar" theme with a full light theme.
- Desktop-first choreography that degrades well: at phone width (390 px) all steps still work, text cards overlay the
  sticky graphic, and nothing scrolls horizontally.
- `prefers-reduced-motion`: scrubbed animations jump to end states; there is no autoplay motion.

## Decisions (from Q&A)

| Topic | Decision |
|---|---|
| Stack | SvelteKit (Svelte 5) + TypeScript + D3 v7 + Scrollama, static build (`adapter-static`) |
| Narrative | Hero flight + disruption twist (regulation → CTOT → A-CDM → reroute) |
| Scope | Strategic (≈6 months ahead) → pre-tactical → filing → tactical → flight → post-ops |
| Audience | Informed public, editorial, dark + light themes |
| Data | Build-time EUROCONTROL snapshot committed to the repo **plus** live browser fetch of the EUROCONTROL Data app API (CORS is open), falling back to the snapshot |
| Live aircraft | A GitHub Actions cron (every 30 min) fetches an OpenSky Network snapshot of airborne aircraft over Europe (fallback: adsb.lol) and redeploys the site with it. Shown as "the sky over Europe, N minutes ago". |
| Map | d3-geo on SVG + Canvas (no WebGL/tile basemap). Natural Earth countries via `world-atlas`. |
| Hosting/QA | GitHub Pages via Actions; Vitest for logic, Playwright smoke + screenshots |

## Data sources

### EUROCONTROL Data app API (`https://api-data-app.eurocontrol.int/api`)
Verified 2026-10-09: JSON, `access-control-allow-origin: *`, updated daily (D-1). Pattern:
1. Find the entity's **sync** for a date: `GET /syncs?{airport.id|country.id|airNavigationServiceProvider.id}=N&order[syncDate]=desc&itemsPerPage=1`
   (Europe-wide: `GET /syncs?dataType=network-wide&order[syncDate]=desc&itemsPerPage=1`).
2. Query metric endpoints with that sync id: `traffic_charts`, `delay_charts`, `punctualities_charts`, `co2_charts`
   (`?sync.id=S`), and headline values `traffic_networks` (`?traffic.sync.id=S`), `delay_networks` (`?delay.sync.id=S`).
3. `GET /situation_reports?order[date]=desc&itemsPerPage=1` → weekly NM narrative (HTML).

Chart objects: `{ chartType, dateRange, name, share?, data: [{date, value}] }`. Notable quirks:
- Prior-year series in `daily_evolution` are re-dated onto the current year (e.g. the "2019" series has 2026 dates);
  the `name` field carries the real year.
- `traffic_charts` daily values are 7-day rolling averages.
- `delay_charts` `category_evolution` names: `Aerodrome capacity`, `Capacity/Staffing (ATC)`, `Disruptions (ATC)`,
  `Weather`, `Other`, plus a comparison series `Total delay 2025` / `En-route delay 2025`.
- curl needs `-g` because of `[]` in query keys; in JS use `URLSearchParams`.
- IDs used: airports EBBR=1, LIRF=31; ANSPs skeyes=38, MUAC=29, DSNA=13, DFS=11, Skyguide=39, ENAV=16; countries via `?iso2=`.

### OpenSky Network (`/api/states/all?lamin=34&lomin=-12&lamax=62&lomax=36`)
Anonymous allowed (credit-limited); browser CORS is restricted to opensky-network.org → fetched server-side only (GitHub Action).
Optional credentials via `OPENSKY_CLIENT_ID` / `OPENSKY_CLIENT_SECRET` (OAuth2 client-credentials).
Fallback: adsb.lol `/v2/point/{lat}/{lon}/{radiusNm}` (several points tiled over Europe).

### Domain facts
`docs/research/flight-lifecycle.md` — sourced fact base produced by the research step. Story copy must only
state facts present there (or mark them as illustrative).

## Story structure (chapters → visuals)

A persistent **mission clock** rail (top on mobile, left on desktop) shows where we are on the timeline from
"T−6 months" to "T+1 day", with a marker for the current chapter.

0. **Cold open — the sky right now.** Canvas map of Europe with the latest live aircraft snapshot (dots coloured by
   altitude, sequential ramp). Hero number: flights in the European network yesterday (live EUROCONTROL fetch).
1. **Strategic: months ahead.** Slot seasons & coordination, airline schedule, Network Manager & ANSP capacity
   planning. Visual: Europe's year of traffic (2019 / 2025 / 2026 daily lines) + long-term forecast fan (Low/Base/High).
2. **The airspace.** Countries + the ANSPs/ACCs FFS101 will cross; route drawn on scroll; free-route airspace;
   military areas (FUA) light up and switch off for the pre-tactical AUP.
3. **Filing the flight plan.** Anatomy of the ICAO FPL message: the raw text highlights field by field per scroll step;
   then IFPS validation (checks fan out: syntax, route vs RAD, aircraft, airspace) → ACK → distribution graph to every
   unit along the route.
4. **The twist: a regulation.** Hourly demand vs capacity bars for the congested sector; capacity line; overload
   triggers a regulation. **CASA simulator**: flights queue into slots, FFS101's CTOT lands +N min; interactive
   capacity slider recomputes delays. Slot tolerance window (−5/+10 min) diagram. Zoom-out: Europe's delay by cause
   yesterday (live) and year-to-date stacked area; latest NM situation report excerpt (live).
5. **Brussels on the ground (A-CDM).** Milestone timeline (EOBT → TOBT → TSAT → TTOT …) re-planned around the CTOT;
   turnaround swimlane Gantt by stakeholder (ground handler, fuel, catering, boarding, crew, ATC).
   Zoom-out: Brussels departure punctuality & ATFM delay (live).
6. **Departure & climb.** Pushback, taxi, take-off; handover from skeyes to MUAC. Vertical profile chart (altitude
   vs along-track distance) starts drawing.
7. **En route.** Scroll-scrubbed plane along the route; the route is coloured by the ANSP in charge; handover pings;
   route-charge meter accumulating per state (stacked bar) using the CRCO formula.
8. **Arrival in Rome.** Descent, arrival sequencing (AMAN), landing, in-blocks. Actual vs scheduled timeline.
9. **Post-ops.** What the flight leaves behind in the data: punctuality, delay attribution, CO₂ index, route charges billed.
   "Who touched this flight": stakeholder × phase matrix (dot grid) for the hero flight.
10. **Explore & sources.** Small multiples of daily traffic for the 6 route ANSPs; glossary; methodology & sources;
    data freshness stamps (snapshot vs live).

## Visual system

- Palette: the dataviz skill's validated reference palette (categorical in fixed order, blue sequential ramp,
  status colours reserved). Delay causes are a fixed entity → colour mapping used everywhere.
- Themes: dark default (story surface), light available via toggle; both validated with `validate_palette.js`.
- Typography: system UI sans for UI and charts; one serif display face (Google Fonts "Fraunces") for chapter titles only.
- Every chart: hover tooltip, legend for ≥2 series, a "show data as table" toggle, no dual axes.

## Sources everywhere (hard requirement — Quinten, 2026-10-09)

- Every source has a stable id (`S1`…`Sn`) in one registry (`src/lib/story/sources.ts`), generated from the
  "Sources" table of `docs/research/flight-lifecycle.md` plus the data sources (EUROCONTROL Data app API,
  OpenSky / adsb.lol, Natural Earth).
- **Every story step** that states a fact ends with visible, linked citation chips (`[S3] [S12]`); hovering or
  focusing a chip shows title + publisher; clicking opens the source in a new tab.
- **Every chart and map** has a visible "Source:" line under it naming the dataset, the endpoint/entity and the
  data date ("EUROCONTROL Data app API · Brussels (EBBR) · data to 8 Oct 2026 · live"), plus the snapshot/live badge.
- Illustrative (fictional) FFS101 details are labelled "Illustrative" instead of a citation; nothing factual
  ships without a source id. A unit test enforces it: every step must have ≥1 source id or `illustrative: true`,
  and every id must resolve in the registry.
- A full "Sources & method" chapter lists all sources with access dates.

## Non-goals

- No real airline or real flight impersonation: FFS101 and "Full Flight Story Air" are explicitly fictional.
- No backend; no user accounts; no WebGL.
- Not a real-time ATC tool — times and numbers for FFS101 are illustrative; all aggregate numbers are real and cited.
