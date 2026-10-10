export type Run =
  | { kind: 'text' | 'strong' | 'em'; text: string }
  | { kind: 'term'; id: string; text: string }
  | { kind: 'cite'; ids: string[] }
  | { kind: 'var'; name: string; arg: string };

export const CITE_ID = /^(S\d+|D-[a-z-]+)$/;
const ID = String.raw`(?:S\d+|D-[a-z-]+)`;
const TOKEN = new RegExp(
  String.raw`\[\[([a-z]+):([A-Za-z0-9-]+)\]\]|\[\[([A-Za-z0-9-]+)(?:\|([^\]]+))?\]\]|\*\*(.+?)\*\*|\*(.+?)\*|\[(${ID}(?:\s*,\s*${ID})*)\]`,
  'g'
);

export function parseRich(s: string): Run[] {
  const runs: Run[] = [];
  let last = 0;
  const pushText = (t: string) => {
    if (!t) return;
    const prev = runs.at(-1);
    if (prev && prev.kind === 'text') prev.text += t;
    else runs.push({ kind: 'text', text: t });
  };
  for (const m of s.matchAll(TOKEN)) {
    pushText(s.slice(last, m.index));
    if (m[1] !== undefined) runs.push({ kind: 'var', name: m[1], arg: m[2] });
    else if (m[3] !== undefined) runs.push({ kind: 'term', id: m[3], text: m[4] ?? m[3] });
    else if (m[5] !== undefined) runs.push({ kind: 'strong', text: m[5] });
    else if (m[6] !== undefined) runs.push({ kind: 'em', text: m[6] });
    else runs.push({ kind: 'cite', ids: m[7].split(',').map((x) => x.trim()) });
    last = m.index! + m[0].length;
  }
  pushText(s.slice(last));
  return runs;
}

const uniq = (xs: string[]) => [...new Set(xs)];
export const citedIds = (s: string) =>
  uniq(parseRich(s).flatMap((r) => (r.kind === 'cite' ? r.ids : [])));
export const termIds = (s: string) =>
  uniq(parseRich(s).flatMap((r) => (r.kind === 'term' ? [r.id] : [])));
export const varIds = (s: string) =>
  parseRich(s).flatMap((r) => (r.kind === 'var' ? [{ name: r.name, arg: r.arg }] : []));
