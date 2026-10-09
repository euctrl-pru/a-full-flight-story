import { readFileSync, writeFileSync } from 'node:fs';
import { parseSourcesTable } from '../src/lib/story/sources-parse.ts';

const md = readFileSync('docs/research/flight-lifecycle.md', 'utf8');
const sources = parseSourcesTable(md);
writeFileSync('src/lib/story/sources.generated.json', JSON.stringify(sources, null, 2) + '\n');
console.log(`wrote ${sources.length} sources`);
