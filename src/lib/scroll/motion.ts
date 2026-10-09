export const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const dur = (ms: number) => (reducedMotion() ? 0 : ms);
