/** After a programmatic jump, move keyboard/screen-reader focus to the target section's heading. */
export function focusHeading(id: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(`${id}-title`) ?? document.getElementById(id);
    if (!el) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  });
}
