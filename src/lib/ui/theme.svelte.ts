/** Shared theme state so canvas renderers (which read CSS variables imperatively) can redraw on toggle. */
export const theme: { current: 'dark' | 'light' } = $state({ current: 'dark' });
