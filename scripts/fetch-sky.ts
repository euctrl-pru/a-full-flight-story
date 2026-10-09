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
