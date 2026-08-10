import { communityCleanupKeys } from '@/hooks/useCommunityCleanup';
import { officerKeys } from '@/hooks/useOfficer';
import { reportKeys } from '@/hooks/useReport';
import type { QueryClient } from '@tanstack/react-query';

/** Query params không quyết định “cùng màn hình” (deep-link phụ). */
const IGNORE_SEARCH_KEYS = new Set(['from', '_r']);

type AppRouterLike = {
  push: (href: string) => void;
  refresh: () => void;
};

function toUrl(pathname: string, search: string): URL {
  const q = search.startsWith('?') || search.length === 0 ? search : `?${search}`;
  return new URL(`${pathname}${q}`, 'http://local.invalid');
}

function relevantSearch(url: URL): string {
  const entries = [...url.searchParams.entries()]
    .filter(([key]) => !IGNORE_SEARCH_KEYS.has(key))
    .sort(([a], [b]) => a.localeCompare(b));
  return new URLSearchParams(entries).toString();
}

/** Cùng pathname + cùng search identity (bỏ `from`) → coi là đang đứng đúng đích noti. */
export function isSameNotificationDestination(
  pathname: string,
  search: string,
  targetHref: string
): boolean {
  const current = toUrl(pathname, search);
  const target = new URL(targetHref, 'http://local.invalid');
  return current.pathname === target.pathname && relevantSearch(current) === relevantSearch(target);
}

/** Invalidate đúng query theo deep-link — soft reload không F5 browser. */
export async function softReloadNotificationDestination(
  queryClient: QueryClient,
  href: string
): Promise<void> {
  const url = new URL(href, 'http://local.invalid');
  const { pathname } = url;
  const reportId = url.searchParams.get('reportId')?.trim();
  const eventId = url.searchParams.get('eventId')?.trim();
  const tasks: Promise<unknown>[] = [];

  const verifyMatch = pathname.match(/^\/officer\/verify\/([^/]+)/);
  if (verifyMatch?.[1]) {
    const id = decodeURIComponent(verifyMatch[1]);
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.detail(id) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) }));
  } else if (pathname.startsWith('/officer/tracking') && reportId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.progress(reportId) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.detail(reportId) }));
  } else if (pathname.startsWith('/officer/community') && eventId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: communityCleanupKeys.detail(eventId) }));
    tasks.push(
      queryClient.invalidateQueries({ queryKey: communityCleanupKeys.participants(eventId) })
    );
    tasks.push(queryClient.invalidateQueries({ queryKey: communityCleanupKeys.queueStats() }));
  } else if (pathname.startsWith('/officer/')) {
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.all }));
  } else if (reportId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.detail(reportId) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.progress(reportId) }));
  }

  await Promise.all(tasks);
}

/**
 * Click noti:
 * - Khác trang → `router.push`
 * - Đúng trang đang đứng → invalidate RQ + `router.refresh()` (không reload cả browser)
 */
export function navigateFromNotification(options: {
  router: AppRouterLike;
  queryClient: QueryClient;
  href: string;
  pathname: string;
  search: string;
}): void {
  const { router, queryClient, href, pathname, search } = options;

  if (isSameNotificationDestination(pathname, search, href)) {
    void softReloadNotificationDestination(queryClient, href).finally(() => {
      router.refresh();
    });
    return;
  }

  router.push(href);
}
