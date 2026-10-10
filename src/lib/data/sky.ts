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
