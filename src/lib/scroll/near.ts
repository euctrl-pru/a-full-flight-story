/** Calls `cb` once when the node comes within one viewport of view. */
export function near(node: HTMLElement, cb: () => void) {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { cb(); io.disconnect(); } }, { rootMargin: '100% 0px' });
  io.observe(node);
  return { destroy: () => io.disconnect() };
}
