import { msg, keyOf } from '$lib/i18n/msg';
import type { AtmPhase, ChapterDef, StepDef } from './types';

/** Structure only; all prose lives in messages/*.json (ch_<id>_*, step_<id>) and is read through locale-aware getters. */
type StepSpec = { id: string; illustrative?: boolean; clock?: number };
type ChapterSpec = { id: string; clock: number; phase: AtmPhase | null; steps: StepSpec[] };

const step = (s: StepSpec): StepDef => ({ ...s, get text() { return msg(`step_${keyOf(s.id)}`); } });
const chapterOf = (c: ChapterSpec): ChapterDef => ({
  id: c.id, clock: c.clock, phase: c.phase, steps: c.steps.map(step),
  get kicker() { return msg(`ch_${keyOf(c.id)}_kicker`); },
  get title() { return msg(`ch_${keyOf(c.id)}_title`); },
  get clockLabel() { return msg(`ch_${keyOf(c.id)}_clock`); }
});

const SPECS: ChapterSpec[] = [
  {
    id: 'cold-open', clock: 0, phase: null,
    steps: [
      { id: 'co-sky' },
      { id: 'co-yesterday' },
      { id: 'co-hero', illustrative: true }
    ]
  },
  {
    id: 'strategic', clock: 0.02, phase: 'strategic',
    steps: [
      { id: 'st-schedule', illustrative: true, clock: 0.02 },
      { id: 'st-slots', clock: 0.08 },
      { id: 'st-not-ctot', clock: 0.12 },
      { id: 'st-nop', clock: 0.14 },
      { id: 'st-forecast', clock: 0.16 }
    ]
  },
  {
    id: 'airspace', clock: 0.2, phase: 'strategic',
    steps: [
      { id: 'as-patchwork', clock: 0.2 },
      { id: 'as-rad', clock: 0.23 }
    ]
  },
  {
    id: 'week-before', clock: 0.3, phase: 'pretactical',
    steps: [
      { id: 'as-military', clock: 0.3 },
      { id: 'as-pretactical', clock: 0.37 }
    ]
  },
  {
    id: 'filing', clock: 0.42, phase: 'pretactical',
    steps: [
      { id: 'fp-file', illustrative: true },
      { id: 'fp-ident' },
      { id: 'fp-eobt' },
      { id: 'fp-route' },
      { id: 'fp-other' },
      { id: 'fp-ifps' },
      { id: 'fp-distribute' }
    ]
  },
  {
    id: 'twist', clock: 0.5, phase: 'tactical',
    steps: [
      { id: 'tw-demand', illustrative: true },
      { id: 'tw-regulation' },
      { id: 'tw-queue' },
      { id: 'tw-sam', illustrative: true },
      { id: 'tw-explore' }
    ]
  },
  {
    id: 'delay', clock: 0.5, phase: 'tactical',
    steps: [
      { id: 'de-yesterday' },
      { id: 'de-causes' },
      { id: 'de-year' },
      { id: 'de-report' }
    ]
  },
  {
    id: 'reroute', clock: 0.53, phase: 'tactical',
    steps: [
      { id: 'rr-path', illustrative: true },
      { id: 'rr-rrp', illustrative: true },
      { id: 'rr-weigh' },
      { id: 'rr-accept', illustrative: true }
    ]
  },
  {
    id: 'ground', clock: 0.56, phase: 'tactical',
    steps: [
      { id: 'gr-acdm', clock: 0.56 },
      { id: 'gr-tobt', illustrative: true, clock: 0.58 },
      { id: 'gr-tsat', illustrative: true, clock: 0.6 },
      { id: 'gr-window', illustrative: true, clock: 0.66 },
      { id: 'gr-punctuality', clock: 0.66 }
    ]
  },
  {
    id: 'enroute', clock: 0.7, phase: 'tactical',
    steps: [
      { id: 'er-skeyes', clock: 0.7 },
      { id: 'er-muac', clock: 0.73 },
      { id: 'er-handovers', illustrative: true, clock: 0.78 },
      { id: 'er-charges', clock: 0.8 },
      { id: 'er-switzerland', clock: 0.8 }
    ]
  },
  {
    id: 'arrival', clock: 0.86, phase: 'tactical',
    steps: [
      { id: 'ar-descent', illustrative: true },
      { id: 'ar-onblocks', illustrative: true },
      { id: 'ar-fco' }
    ]
  },
  {
    id: 'postops', clock: 0.92, phase: 'postops',
    steps: [
      { id: 'po-analysis', clock: 0.92 },
      { id: 'po-billing', clock: 0.95 },
      { id: 'po-matrix', clock: 0.97 },
      { id: 'po-co2', clock: 0.98 },
      { id: 'po-everyone', clock: 1 }
    ]
  }
];

export const CHAPTERS: ChapterDef[] = SPECS.map(chapterOf);

export function chapter(id: string): ChapterDef {
  const c = CHAPTERS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown chapter ${id}`);
  return c;
}
