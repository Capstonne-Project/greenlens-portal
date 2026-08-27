/**
 * Radix DismissableLayer can leave `document.body.style.pointerEvents = 'none'`
 * after DropdownMenu / Select / Sheet / Dialog races. Restore interactivity safely.
 *
 * @see https://github.com/radix-ui/primitives/issues/3317
 */
export function restoreBodyPointerEvents(): void {
  if (typeof document === 'undefined') return;
  if (document.body.style.pointerEvents === 'none') {
    document.body.style.pointerEvents = '';
  }
}

/**
 * Clear stuck overlay locks now and after Sheet/Dialog close animation (~300ms).
 * Use when closing a modal and navigating in the same interaction.
 */
export function releaseOverlayLock(): void {
  restoreBodyPointerEvents();
  if (typeof window === 'undefined') return;
  requestAnimationFrame(() => restoreBodyPointerEvents());
  window.setTimeout(() => restoreBodyPointerEvents(), 350);
}

/**
 * Defer work until after the current dismiss layer finishes cleanup
 * (DropdownMenu / Sheet close → Dialog open or router.push).
 */
export function deferOpenFromMenu(open: () => void): void {
  if (typeof window === 'undefined') {
    open();
    return;
  }
  window.setTimeout(open, 0);
}

/**
 * Close Sheet/Dialog then navigate — clears body pointer-events lock without
 * changing the navigation target or app logic.
 */
export function navigateAfterOverlayClose(navigate: () => void): void {
  releaseOverlayLock();
  deferOpenFromMenu(() => {
    releaseOverlayLock();
    navigate();
  });
}
