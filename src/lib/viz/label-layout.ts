/** Greedy row assignment so labels [x, x+w] never overlap within a row. */
export function stackRows(items: { x: number; w: number }[], gap = 6): number[] {
  const rowEnd: number[] = [];
  return items.map(({ x, w }) => {
    let row = rowEnd.findIndex((end) => end + gap <= x);
    if (row === -1) { row = rowEnd.length; rowEnd.push(0); }
    rowEnd[row] = x + w;
    return row;
  });
}

/** Push positions forward so consecutive ones are at least minGap apart (input assumed sorted). */
export function spreadAlong(pos: number[], minGap: number): number[] {
  const out: number[] = [];
  for (const p of pos) out.push(out.length ? Math.max(p, out[out.length - 1] + minGap) : p);
  return out;
}
