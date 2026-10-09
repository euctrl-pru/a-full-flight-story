import { describe, it, expect } from 'vitest';
import { GLOSSARY } from '$lib/story/glossary';
import { SOURCES } from '$lib/story/sources';

const REQUIRED = 'NM NMOC IFPS ANSP ACC MUAC FMP ATFM ATFCM CASA CTOT SAM SRM SLC RRP REA DPI A-CDM EOBT TOBT TSAT TTOT AOBT ATOT ALDT AIBT FPL ACK CHG DLA RAD AIRAC FRA FUA AUP NOP ETFMS OLDI CPDLC SID STAR AMAN FL CRCO MTOW PRC BSC WASG CODA ADP STAM'.split(' ');

describe('glossary', () => {
  it('has every required term with a cited definition', () => {
    for (const k of REQUIRED) {
      const g = GLOSSARY[k];
      expect(g, k).toBeDefined();
      expect(g.definition.length, k).toBeGreaterThan(30);
      expect(g.sources.length, k).toBeGreaterThan(0);
      for (const s of g.sources) expect(SOURCES[s], `${k} → ${s}`).toBeDefined();
    }
  });
});
