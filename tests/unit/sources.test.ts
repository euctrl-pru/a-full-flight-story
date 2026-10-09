import { describe, it, expect } from 'vitest';
import { parseSourcesTable } from '$lib/story/sources-parse';
import { SOURCES, getSource } from '$lib/story/sources';

const md = `# Doc
Some text [S1].

## Sources

| id | title | publisher | url | accessed |
|---|---|---|---|---|
| S1 | IFPS Users Manual | EUROCONTROL | https://example.org/ifps | 2026-10-09 |
| S2 | ATFCM Users Manual | EUROCONTROL | <https://example.org/atfcm> ; https://mirror.example.org | 2026-10-09 |

## After
| x | y |
`;

describe('parseSourcesTable', () => {
  it('parses rows of the Sources table only', () => {
    const s = parseSourcesTable(md);
    expect(s).toEqual([
      { id: 'S1', title: 'IFPS Users Manual', publisher: 'EUROCONTROL', url: 'https://example.org/ifps', accessed: '2026-10-09' },
      { id: 'S2', title: 'ATFCM Users Manual', publisher: 'EUROCONTROL', url: 'https://example.org/atfcm', accessed: '2026-10-09' }
    ]);
  });
  it('throws when there is no Sources section', () => {
    expect(() => parseSourcesTable('# nothing')).toThrow(/Sources/);
  });
});

describe('registry', () => {
  it('contains generated and data sources with https urls', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(10);
    expect(getSource('D-eurocontrol').publisher).toBe('EUROCONTROL');
    for (const s of Object.values(SOURCES)) expect(s.url).toMatch(/^https?:\/\//);
  });
  it('throws on unknown id', () => {
    expect(() => getSource('S99999')).toThrow(/Unknown source/);
  });
});
