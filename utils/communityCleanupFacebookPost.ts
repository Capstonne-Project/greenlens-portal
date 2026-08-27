/** Session stash — highlight link FB Page sau khi share (create-flow → detail). */

const STORAGE_PREFIX = 'gl:community-cleanup-fb-highlight:';

export function stashCommunityCleanupFacebookPostHighlight(eventId: string): void {
  const id = eventId.trim();
  if (!id || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${id}`, '1');
  } catch {
    /* quota / private mode — bỏ qua */
  }
}

/** Đọc và xóa cờ highlight đã stash (một lần). */
export function takeCommunityCleanupFacebookPostHighlight(eventId: string): boolean {
  const id = eventId.trim();
  if (!id || typeof sessionStorage === 'undefined') return false;
  try {
    const key = `${STORAGE_PREFIX}${id}`;
    const had = sessionStorage.getItem(key) === '1';
    if (had) sessionStorage.removeItem(key);
    return had;
  } catch {
    return false;
  }
}
