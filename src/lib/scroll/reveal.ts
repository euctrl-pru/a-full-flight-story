/** Adds `revealed` once the element is at least 15% visible (CSS does the animation). */
export function reveal(node: HTMLElement) {
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { node.classList.add('revealed'); io.disconnect(); }
  }, { threshold: 0.15 });
  io.observe(node);
  return { destroy: () => io.disconnect() };
}
