// One-off: seeds messages/en.json from the English literals in src/lib/story.
// Run BEFORE the story modules read from messages (they import $lib, so use vite-node):
//   npx vite-node scripts/extract-messages.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { CHAPTERS } from '../src/lib/story/chapters.ts';
import { GLOSSARY } from '../src/lib/story/glossary.ts';
import { ATM_PHASES } from '../src/lib/story/phases.ts';
import { ACTORS, PHASES } from '../src/lib/story/stakeholders.ts';
import { EVENTS, TURNAROUND, ANSP_LABEL } from '../src/lib/story/flight.ts';

const k = (id: string) => id.replace(/[^A-Za-z0-9]/g, '_');
const en = JSON.parse(readFileSync('messages/en.json', 'utf8'));
for (const c of CHAPTERS) {
  en[`ch_${k(c.id)}_kicker`] = c.kicker; en[`ch_${k(c.id)}_title`] = c.title; en[`ch_${k(c.id)}_clock`] = c.clockLabel;
  for (const s of c.steps) en[`step_${k(s.id)}`] = s.text;
}
for (const [id, g] of Object.entries(GLOSSARY)) { en[`gl_${k(id)}_exp`] = g.expansion; en[`gl_${k(id)}_def`] = g.definition; }
for (const p of ATM_PHASES) { en[`ph_${p.id}_label`] = p.label; en[`ph_${p.id}_horizon`] = p.horizon; en[`ph_${p.id}_decides`] = p.decides; }
for (const p of PHASES) en[`sp_${k(p.id)}`] = p.label;
for (const a of ACTORS) { en[`ac_${k(a.id)}_label`] = a.label; en[`ac_${k(a.id)}_role`] = a.role; }
for (const e of EVENTS) en[`ev_${k(e.id)}`] = e.label;
for (const t of TURNAROUND) en[`tt_${k(t.id)}`] = t.label;
for (const [key, label] of Object.entries(ANSP_LABEL)) en[`ansp_${k(key)}`] = label;
writeFileSync('messages/en.json', JSON.stringify(en, null, 2) + '\n');
console.log(`messages/en.json: ${Object.keys(en).length - 1} messages`);
