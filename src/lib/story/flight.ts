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

const D = (hhmm: string, day: string = HERO.date) => `${day}T${hhmm}:00Z`;
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
