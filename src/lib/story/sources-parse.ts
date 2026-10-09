import type { Source } from './types';

export function parseSourcesTable(md: string): Source[] {
  const start = md.search(/^##\s+Sources\s*$/m);
  if (start < 0) throw new Error('No "## Sources" section found');
  const rest = md.slice(start).split('\n').slice(1);
  const out: Source[] = [];
  let inTable = false;
  for (const line of rest) {
    if (/^##\s/.test(line)) break;
    if (!line.trim().startsWith('|')) { if (inTable) break; continue; }
    inTable = true;
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (cells.length < 5 || !/^S\d+$/.test(cells[0])) continue; // header / separator rows
    const [id, title, publisher, url, accessed] = cells;
    out.push({ id, title, publisher, url: url.split(/\s*;\s*/)[0].replace(/^<|>$/g, ''), accessed });
  }
  return out;
}
