export interface Source { id: string; title: string; publisher: string; url: string; accessed: string }

export type AtmPhase = 'strategic' | 'pretactical' | 'tactical' | 'postops';

export interface StepDef {
  id: string;
  /** Rich text: **bold**, *em*, [[TERM]] or [[TERM|label]], [[name:arg]] data tokens, citations [S1, D-eurocontrol]. Paragraphs split by blank line. */
  text: string;
  illustrative?: boolean;
  /** Mission-clock position 0..1 for this step; defaults to the chapter's. */
  clock?: number;
}

export interface ChapterDef {
  id: string;
  kicker: string;
  title: string;
  clockLabel: string;
  clock: number;
  /** ATFCM phase this chapter belongs to; null for the cold open. */
  phase: AtmPhase | null;
  steps: StepDef[];
}
