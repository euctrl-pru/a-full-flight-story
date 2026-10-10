import type { AtmPhase } from '$lib/story/types';
export const story: { chapterId: string; chapterTitle: string; clock: number; clockLabel: string; phase: AtmPhase | null } =
  $state({ chapterId: '', chapterTitle: '', clock: 0, clockLabel: '', phase: null });
