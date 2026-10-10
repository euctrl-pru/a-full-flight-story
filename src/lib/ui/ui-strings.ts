/** Central UI strings (not story copy) — prepared for the multilingual follow-up. */
export const UI = {
  progressLabel: 'Where we are in the flight’s life',
  start: 'Start',
  chapters: 'Chapters',
  close: 'Close',
  chapterOf: (n: number, total: number) => `Chapter ${n} of ${total}`,
  prologue: 'Prologue',
  sourcesAndMethod: 'Sources & method',
  backToTop: 'Back to top ↑',
  overviewTitle: 'The life of FFS101 at a glance',
  whoAtTable: 'Who’s at the table',
  whatDecided: 'What gets decided',
  skyFrom: (age: string, source: string) => `Aircraft positions from ${age} · ${source}`,
  skyDelayed: 'the feed may be delayed',
  skyUnavailable: 'The live sky snapshot is unavailable right now — the rest of the story is unaffected.'
} as const;
