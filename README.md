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
| Traffic, ATFM delay, punctuality, CO₂, weekly situation report | EUROCONTROL Data app API. Fetched live in the browser on every visit (EUROCONTROL publishes once a day, for the previous day) and re-checked when you return to the tab after 15 min; `npm run fetch:eurocontrol` writes the fallback snapshot `static/data/eurocontrol.json`. |
| Aircraft currently airborne | `npm run fetch:sky` writes `static/data/sky.json` from the OpenSky Network (anonymous; falls back to adsb.lol when OpenSky is unavailable or its daily quota is used up). The GitHub Action refreshes it every 10 minutes (best-effort GitHub schedule); an open page re-checks every 60 s and shows the data's age and source, turning amber after 30 min. |
| Facts and citations | `docs/research/flight-lifecycle.md`; `npm run sources` regenerates `src/lib/story/sources.generated.json` from its Sources table. |
| Map | `npm run geo` builds `src/lib/geo/europe.topo.json` (Natural Earth 1:50m, Europe only, ~112 KiB). |
| Share image | `npm run og` renders `static/og.png` from the current sky snapshot. |

GitHub pauses scheduled workflows after 60 days without repository activity; re-enable it from the Actions tab.

## Story structure

The story follows the four ATFCM planning phases — **strategic** (months ahead), **pre-tactical** (D−6 to D−1), **tactical** (day of operation) and **post-operations** — shown in the top bar, on a full-screen divider before each phase and on an overview timeline that doubles as the table of contents (also available from the **Chapters** menu; every chapter has its own `#link`).

## Languages

The story is available in six languages: English (`/`, the original), Deutsch (`/de/`), Français (`/fr/`), Italiano (`/it/`), Español (`/es/`) and Polski (`/pl/`). English has no URL prefix; there are no automatic redirects, and browsers set to another supported language only get a dismissible hint on the English page. Every page carries `hreflang` alternates, and the language menu keeps you on the same chapter.

Text is handled with [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs): all reader-facing copy lives in `messages/<locale>.json` (`en`, `de`, `fr`, `it`, `es`, `pl`), and `npm run i18n` compiles it into `src/lib/paraglide/` (`npm run dev`, `build`, `check` and `test` run it for you). Source titles and publisher names stay in their original language, as do glossary acronyms (IFPS, CTOT, ANSP, ...); their expansions and definitions are translated. Each translated step keeps exactly the English step's citations, glossary terms and data tokens.

**Changing copy:** edit `messages/en.json`, then update the five other locale files until the parity tests pass (`npx vitest run tests/unit/i18n-parity.test.ts`). The parity tests check that every locale has the same keys, placeholders, citations, glossary markers and terminology; `tests/e2e/i18n.spec.ts` checks the pages themselves (no raw keys, deep links, no horizontal overflow at 390 px).

**AI-translation note:** the German, French, Italian, Spanish and Polish versions were translated from the English original with AI assistance, and each says so in its "Sources & method" section. Corrections from native speakers are welcome.

## Performance budgets (checked by `tests/e2e/perf.spec.ts`)

Initial JavaScript ≤ 250 KB gzip (on `/` and `/de/`) · first contentful paint ≤ 2.5 s on slow 4G · no long task > 275 ms while scrolling at 4× CPU throttle (see the comment in the spec for the measured baseline). Chapter graphics mount only when they come within one screen.

## Method

FFS101 is fictional; the process, stakeholders and numbers are real and cited. See the "Sources & method" section at the end of the story for the simplifications (CASA model, route charges, ANSP assignment).
