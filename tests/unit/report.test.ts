import { describe, it, expect } from 'vitest';
import reports from '../fixtures/eurocontrol/situation_reports.json';
import { parseReportHtml } from '$lib/data/report';

describe('parseReportHtml', () => {
  it('turns the real report into p/li blocks with bold runs', () => {
    const blocks = parseReportHtml((reports as any).data[0].content);
    expect(blocks[0]).toEqual({ kind: 'p', runs: [{ text: 'Traffic', bold: true }] });
    expect(blocks.some((b) => b.kind === 'li')).toBe(true);
    for (const b of blocks) for (const r of b.runs) expect(r.text).not.toMatch(/[<>]/);
  });
  it('drops script/style content and decodes entities', () => {
    const blocks = parseReportHtml('<p>A&amp;B&nbsp;&#39;x&#39;<script>alert(1)</script><style>p{}</style> <b>C</b></p><img src=x onerror=alert(1)>');
    expect(blocks).toEqual([{ kind: 'p', runs: [{ text: "A&B 'x' ", bold: false }, { text: 'C', bold: true }] }]);
  });
  it('wraps loose text in a paragraph and ignores empty blocks', () => {
    expect(parseReportHtml('hello <p> </p>')).toEqual([{ kind: 'p', runs: [{ text: 'hello', bold: false }] }]);
  });
});
