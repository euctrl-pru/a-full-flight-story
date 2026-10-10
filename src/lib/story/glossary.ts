import { msg, keyOf } from '$lib/i18n/msg';

export interface GlossaryEntry { term: string; expansion: string; definition: string; sources: string[] }

const g = (term: string, sources: string[]): GlossaryEntry => ({
  term, sources,
  get expansion() { return msg(`gl_${keyOf(term)}_exp`); },
  get definition() { return msg(`gl_${keyOf(term)}_def`); }
});

/** Expansions from research §12; definitions paraphrase the research section that discusses each term. */
export const GLOSSARY: Record<string, GlossaryEntry> = {
  NM: g('NM', ['S20', 'S2']),
  NMOC: g('NMOC', ['S7', 'S2']),
  IFPS: g('IFPS', ['S9', 'S10']),
  ANSP: g('ANSP', ['S49', 'S28']),
  ACC: g('ACC', ['S5', 'S30']),
  MUAC: g('MUAC', ['S5', 'S6']),
  FMP: g('FMP', ['S7', 'S8']),
  ATFM: g('ATFM', ['S7', 'S20']),
  ATFCM: g('ATFCM', ['S8']),
  CASA: g('CASA', ['S7']),
  CTOT: g('CTOT', ['S7']),
  SAM: g('SAM', ['S7']),
  SRM: g('SRM', ['S7', 'S11']),
  SLC: g('SLC', ['S7']),
  RRP: g('RRP', ['S7']),
  REA: g('REA', ['S7', 'S11']),
  DPI: g('DPI', ['S7']),
  'A-CDM': g('A-CDM', ['S13', 'S14']),
  EOBT: g('EOBT', ['S9', 'S7']),
  TOBT: g('TOBT', ['S13']),
  TSAT: g('TSAT', ['S13', 'S7']),
  TTOT: g('TTOT', ['S13']),
  AOBT: g('AOBT', ['S13']),
  ATOT: g('ATOT', ['S13']),
  ALDT: g('ALDT', ['S13']),
  AIBT: g('AIBT', ['S13']),
  FPL: g('FPL', ['S9']),
  ACK: g('ACK', ['S9']),
  CHG: g('CHG', ['S9']),
  DLA: g('DLA', ['S12']),
  RAD: g('RAD', ['S17']),
  AIRAC: g('AIRAC', ['S17']),
  FRA: g('FRA', ['S18']),
  FUA: g('FUA', ['S19']),
  AUP: g('AUP', ['S19']),
  NOP: g('NOP', ['S8', 'S3']),
  ETFMS: g('ETFMS', ['S7', 'S8']),
  OLDI: g('OLDI', ['S43']),
  CPDLC: g('CPDLC', ['S42', 'S5']),
  SID: g('SID', ['S46']),
  STAR: g('STAR', ['S30']),
  AMAN: g('AMAN', ['S30']),
  FL: g('FL', ['S28']),
  CRCO: g('CRCO', ['S32']),
  MTOW: g('MTOW', ['S35', 'S33']),
  PRC: g('PRC', ['S37']),
  BSC: g('BSC', ['S26']),
  WASG: g('WASG', ['S22', 'S23']),
  CODA: g('CODA', ['S36']),
  ADP: g('ADP', ['S8']),
  STAM: g('STAM', ['S8'])
};
