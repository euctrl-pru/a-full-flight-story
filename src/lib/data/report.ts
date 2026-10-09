export interface ReportBlock { kind: 'p' | 'li'; runs: { text: string; bold: boolean }[] }

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const cp = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      const valid = Number.isInteger(cp) && cp >= 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff);
      return valid ? String.fromCodePoint(cp) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

export function parseReportHtml(html: string): ReportBlock[] {
  const clean = html.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '');
  const blocks: ReportBlock[] = [];
  let cur: ReportBlock | null = null;
  let bold = 0;
  const close = () => {
    if (cur) {
      cur.runs = cur.runs.map((r) => ({ ...r, text: r.text.replace(/\s+/g, ' ') }));
      if (cur.runs.length) cur.runs[0].text = cur.runs[0].text.trimStart();
      if (cur.runs.length) cur.runs[cur.runs.length - 1].text = cur.runs[cur.runs.length - 1].text.trimEnd();
      cur.runs = cur.runs.filter((r) => r.text.length > 0);
      if (cur.runs.length) blocks.push(cur);
    }
    cur = null;
  };
  for (const m of clean.matchAll(/<(\/?)([a-z0-9]+)\b[^>]*>|([^<]+)/gi)) {
    if (m[3] !== undefined) {
      const text = decodeEntities(m[3]);
      if (!cur) { if (!text.trim()) continue; cur = { kind: 'p', runs: [] }; }
      const prev = cur.runs.at(-1);
      if (prev && prev.bold === bold > 0) prev.text += text;
      else cur.runs.push({ text, bold: bold > 0 });
      continue;
    }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (tag === 'p' || tag === 'li') { close(); if (!closing) cur = { kind: tag, runs: [] }; }
    else if (tag === 'strong' || tag === 'b') bold = Math.max(0, bold + (closing ? -1 : 1));
    else if (tag === 'br' && cur) cur.runs.push({ text: ' ', bold: bold > 0 });
  }
  close();
  return blocks;
}
