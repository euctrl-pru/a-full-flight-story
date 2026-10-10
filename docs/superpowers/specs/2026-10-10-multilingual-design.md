# A Full Flight Story: Multilingual Versions (Design Spec)

Date: 2026-10-10 · Status: design approved section by section in chat; awaiting written-spec review.
Builds on: `2026-10-09-full-flight-story-design.md` and `2026-10-10-experience-upgrade-design.md` (all rules still apply:
sources everywhere, no `{@html}` for third-party text, reduced motion, 390 px without horizontal scroll, budgets).

## Goal

The same story and live data, readable natively in **German (de), French (fr), Italian (it), Spanish (es) and Polish
(pl)** besides English (en): one shareable, pre-rendered, indexable page per language.

Decisions (Quinten, in chat):

| Topic | Decision |
|---|---|
| Who translates | Claude translates all five languages; **no human review step**; published as-is |
| Transparency | One line in each language's "Sources & method": "This version was translated from the English original with AI assistance." (no banner) |
| URLs | English stays at `/a-full-flight-story/`; others at `/a-full-flight-story/{de,fr,it,es,pl}/` |
| Language choice | Switcher in the top bar; on the English page only, a dismissible hint for browsers preferring one of the five languages; **never an automatic redirect** |
| Tooling | **Paraglide JS 2 (inlang)** message files |

Scale: ~3,500 words per language (story steps ~1,470 words / 50 steps; glossary ~1,150 words / 51 entries; ~170 short
labels in charts, timeline, stakeholders, phases and events; intro, method and UI text).

## 1. Architecture & content

**Routing.** One page route with an optional locale segment (`src/routes/[[locale]]/…`). `entries()` enumerates
`{}` (English, base locale, no prefix) and the five prefixed locales; the layout `load` validates the param and sets
the Paraglide locale before rendering. Unknown locale segments 404 at build time (no page generated). `<html lang>`
is set per locale (via the `%lang%`-style placeholder replaced in `hooks.server.ts` `transformPageChunk`, which runs
during prerender). Links are built with SvelteKit's `base` (Paraglide's docs don't cover base paths), and an e2e test
loads every locale under `/a-full-flight-story/`.

Paraglide strategy: `['url', 'baseLocale']` with URL patterns where `en` has no prefix and the others use `/{locale}`.
No cookie/localStorage locale strategy (the URL is the single source of truth).

**Messages.** `messages/{en,de,fr,it,es,pl}.json` hold:
- every story step text (key per step id), chapter title, kicker and clock label;
- glossary expansions and definitions (acronyms such as IFPS, CTOT, ANSP stay as keys and display terms — they're
  international; expansions use the official local term where one exists, else the English expansion);
- phase labels/horizons/"what gets decided", stakeholder labels/roles, timeline event labels, turnaround task labels,
  ANSP labels;
- chart/figure titles, subtitles, axis/legend labels, SourceLine connective text ("Source:", "data to", "Illustrative");
- intro, overview, divider, drawer, sky-age, freshness phrases, method section, AI-translation note — i.e. everything
  now in `ui-strings.ts`, which is replaced by messages.

Story text keeps its existing inline syntax — citations `[S7]`, glossary terms `{CTOT}`/`{CTOT|label}`, data tokens
`{{date:network}}` — so `parseRich`/`RichText` render every locale unchanged.

**Structure stays in code.** Chapter ids, step order, clocks, phases, citations metadata, flight times, routes and data
logic stay in their TypeScript modules; only human-readable text moves to messages (`chapters.ts` keeps ids/structure
and looks text up by key).

**Parity guarantees (unit tests).**
1. Every locale has every key that `en` has, and no extra keys.
2. For every story step and glossary definition, the multiset of citation ids, the set of glossary term ids and the set
   of data tokens are identical to English (so sources-everywhere holds in every language).
3. No untranslated English: a non-English value identical to the English value fails unless it is on a small allowlist
   (proper names, codes, numbers-only strings such as "FFS101", "EBBR → LIRF", "MUAC").
4. Message parameters (e.g. `{date}`, `{age}`, `{source}`) match English per key.

**Formatting.** All number/date formatting goes through `Intl` with the active locale (e.g. de `34.275`, fr `34 275`,
pl `34 275`; fr "jeu. 8 oct."). `fmtInt`, `fmtDec`, `fmtDate`, `fmtDayShort`, `doyLabel`, `dayNumLabel` take the locale
from Paraglide's runtime. Freshness phrases ("yesterday (Fri 9 Oct)", "on Thu 8 Oct", "on the latest day available",
"fetched live", "from the latest snapshot") become parameterised messages; logic in `freshness.ts` picks which message.

**Data labels.** EUROCONTROL delay-cause names (`Capacity/Staffing (ATC)`, `Weather`, …) map to translated labels via
messages; phase names likewise. **Source titles stay in their original language** (they cite English documents);
publisher names unchanged.

## 2. Switching, SEO, translation process, testing

**Language switcher.** Top bar, beside Chapters and the theme toggle: a compact `EN ▾` button opening a small menu
listing languages in their own names (English, Deutsch, Français, Italiano, Español, Polski) as links to the localized
URL **with the current `#chapter` hash appended**. On ≤700 px the button shows only the code. Keyboard/ARIA: button with
`aria-haspopup`, menu of links, Esc closes, focus returns.

**Browser hint.** On the English page only: if `navigator.languages` prefers de/fr/it/es/pl (first match among the
user's ordered preferences), show a small dismissible bar under the top bar in that language (e.g. "Lire cette histoire
en français ? · Oui · Non"). "Oui" navigates (keeping the hash); "Non" hides it and remembers the dismissal in
`localStorage` (wrapped in try/catch). Never shown on localized pages; never auto-redirects.

**SEO.** Per locale: `<title>`, description, `og:title`, `og:description`, `og:locale` (+ `og:locale:alternate`),
canonical URL, `<link rel="alternate" hreflang>` for all six locales plus `x-default` (English), JSON-LD `inLanguage`.
`sitemap.xml` lists all six URLs (with `xhtml:link` alternates). The share image stays shared (English title).

**Translation process.** Claude translates from `messages/en.json` into the five locales, using established ATM
terminology per language (e.g. de "Flugsicherungsorganisation" for ANSP, fr "créneau" for slot/CTOT context, es
"franja"/"slot" per usage, it "bande orarie" for airport slots, pl "przydział czasu"/"slot"), consistent across story,
glossary and labels. Each locale's method section carries the AI-translation note. Afterwards, the parity tests make any
English change fail until all locales are updated (no silent drift).

**Testing.**
- Unit: parity tests (keys, citations, terms, tokens, params, untranslated check); locale-aware formatting (de/fr/pl
  numbers and dates); freshness messages per locale.
- E2E:
  - each of the six pages renders with the right `lang`, a translated `<h1>`, and no raw message keys/`undefined` on
    screen;
  - switcher keeps the `#chapter` hash;
  - hint bar appears for a French browser on the English page, "Non" persists across reload, never shown on `/fr/`;
  - full story walk in **German** at 390 px: no horizontal overflow (longest words);
  - axe (dark + light) on **Polish**;
  - all locale pages and their assets load under `/a-full-flight-story/` (no 4xx);
  - existing English suite stays green;
  - performance budget still met on the English and German pages (initial JS ≤ 250 KB gzip). If shipping all six
    locales' messages pushes a page over budget, load the story-step messages per locale on demand (they are the bulk).

## Non-goals

Right-to-left languages; translating source document titles; per-locale share images; human review workflow;
automatic redirects; translating the dev pages.

## Risks

- Translation accuracy without review: mitigated by consistent terminology lists per language and structural parity
  tests; cannot catch subtle wording errors.
- German/Polish text length breaking tight layouts (top bar, timeline labels, chart labels): mitigated by the German
  390 px walk and visual review of all locales.
- Paraglide + `paths.base` interplay: mitigated by building links with `base` and the base-path e2e test.
