import { describe, it, expect } from 'vitest';
import { parseRich, citedIds, termIds, varIds } from '$lib/story/richtext';

describe('parseRich', () => {
  it('splits text, emphasis, terms and citations', () => {
    expect(parseRich('The **airline** files with {IFPS} *days* ahead [S3, D-eurocontrol].')).toEqual([
      { kind: 'text', text: 'The ' },
      { kind: 'strong', text: 'airline' },
      { kind: 'text', text: ' files with ' },
      { kind: 'term', id: 'IFPS', text: 'IFPS' },
      { kind: 'text', text: ' ' },
      { kind: 'em', text: 'days' },
      { kind: 'text', text: ' ahead ' },
      { kind: 'cite', ids: ['S3', 'D-eurocontrol'] },
      { kind: 'text', text: '.' }
    ]);
  });
  it('supports a display label for terms', () => {
    expect(parseRich('{CTOT|a slot}')).toEqual([{ kind: 'term', id: 'CTOT', text: 'a slot' }]);
  });
  it('leaves non-citation brackets as text', () => {
    expect(parseRich('[see below]')).toEqual([{ kind: 'text', text: '[see below]' }]);
  });
  it('collects ids', () => {
    const s = 'A [S1] b {TOBT} c [S2, S1] {CTOT|slot}';
    expect(citedIds(s)).toEqual(['S1', 'S2']);
    expect(termIds(s)).toEqual(['TOBT', 'CTOT']);
  });
});

describe('data tokens', () => {
  it('parses {{name:arg}} without touching {TERM}', () => {
    expect(parseRich('Handled {{date:network}} via {IFPS}.')).toEqual([
      { kind: 'text', text: 'Handled ' },
      { kind: 'var', name: 'date', arg: 'network' },
      { kind: 'text', text: ' via ' },
      { kind: 'term', id: 'IFPS', text: 'IFPS' },
      { kind: 'text', text: '.' }
    ]);
    expect(varIds('{{live:report}} and {{date:EBBR}}')).toEqual([{ name: 'live', arg: 'report' }, { name: 'date', arg: 'EBBR' }]);
  });
});
