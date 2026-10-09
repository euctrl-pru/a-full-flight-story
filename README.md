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
