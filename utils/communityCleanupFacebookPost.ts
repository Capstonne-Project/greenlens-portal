/** Session stash — truyền URL bài FB Page từ create-flow sang màn detail. */

const STORAGE_PREFIX = 'gl:community-cleanup-fb-post:';

export function stashCommunityCleanupFacebookPageUrl(eventId: string, pageUrl: string): void {
  const id = eventId.trim();
  const url = pageUrl.trim();
  if (!id || !url || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${id}`, url);
  } catch {
    /* quota / private mode — bỏ qua */
  }
}

/** Đọc và xóa URL đã stash (một lần). */
export function takeCommunityCleanupFacebookPageUrl(eventId: string): string | null {
  const id = eventId.trim();
  if (!id || typeof sessionStorage === 'undefined') return null;
  try {
    const key = `${STORAGE_PREFIX}${id}`;
    const value = sessionStorage.getItem(key);
    if (value) sessionStorage.removeItem(key);
    return value?.trim() || null;
  } catch {
    return null;
  }
}
