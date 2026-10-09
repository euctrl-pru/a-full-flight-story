// Seed static/data/*.json from the deployed site when the deployed copy is newer than the committed one,
// so a failed refresh falls back to the last deployed data instead of the commit-time snapshot.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const base = (process.argv[2] ?? '').replace(/\/$/, '');
const FILES = { 'eurocontrol.json': 'generatedAt', 'sky.json': 'fetchedAt' };
for (const [file, stamp] of Object.entries(FILES)) {
  const local = `static/data/${file}`;
  try {
    const r = await fetch(`${base}/data/${file}`, { signal: AbortSignal.timeout(20_000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const deployed = await r.json();
    const committed = existsSync(local) ? JSON.parse(readFileSync(local, 'utf8')) : null;
    const newer = !committed || Date.parse(deployed[stamp]) > Date.parse(committed[stamp]);
    if (newer) writeFileSync(local, JSON.stringify(deployed));
    console.log(`[seed] ${file}: ${newer ? 'using deployed copy' : 'committed copy is newer'}`);
  } catch (e) {
    console.log(`[seed] ${file}: deployed copy unavailable (${e.message}); keeping committed copy`);
  }
}
