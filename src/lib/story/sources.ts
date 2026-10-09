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
