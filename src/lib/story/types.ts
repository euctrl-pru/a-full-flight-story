export interface Source { id: string; title: string; publisher: string; url: string; accessed: string }

export interface StepDef {
  id: string;
  /** Rich text: **bold**, *em*, {TERM} or {TERM|label}, citations [S1, D-eurocontrol]. Paragraphs split by blank line. */
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
  steps: StepDef[];
}
