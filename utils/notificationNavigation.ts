import { communityCleanupKeys } from '@/hooks/useCommunityCleanup';
import { companyKeys } from '@/hooks/useCompany';
import { leoOfficesKeys } from '@/hooks/useLeoOffices';
import { officerKeys } from '@/hooks/useOfficer';
import { reportKeys } from '@/hooks/useReport';
import { teamKeys } from '@/hooks/useTeams';
import { withOfficerFromQuery } from '@/utils/officerNavigation';
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

/**
 * Detail → list hub (để `from=` không kẹt ở detail trung gian).
 * Khi đang đứng đúng list/hub thì giữ filter hiện tại.
 */
function buildNotificationFromPath(pathname: string, search: string): string | null {
  if (/^\/officer\/verify\/[^/]+/.test(pathname)) return '/officer/verify';
  if (/^\/officer\/assign\/[^/]+/.test(pathname)) return '/officer/assign';
  if (/^\/officer\/duplicates\/[^/]+/.test(pathname)) return '/officer/duplicates';
  if (/^\/officer\/recurrence\/[^/]+/.test(pathname)) return '/officer/recurrence';
  if (/^\/officer\/inspections\/[^/]+/.test(pathname)) {
    return '/officer/recurrence?tab=inspections';
  }
  if (/^\/officer\/reports\/[^/]+/.test(pathname)) return '/officer/reports';
  if (/^\/officer\/reopen\/[^/]+/.test(pathname)) return '/officer/reopen';

  if (!pathname.startsWith('/officer/') && pathname !== '/officer') return null;

  const url = toUrl(pathname, search);
  url.searchParams.delete('from');
  url.searchParams.delete('_r');
  /** Detail overlay trên cùng route — back về list thuần. */
  if (pathname.startsWith('/officer/tracking')) {
    url.searchParams.delete('reportId');
  }
  if (pathname.startsWith('/officer/community')) {
    url.searchParams.delete('eventId');
  }

  const qs = url.searchParams.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Invalidate list/queue theo pathname đang đứng hoặc đích noti. */
function invalidateListsForPath(queryClient: QueryClient, pathname: string): Promise<unknown>[] {
  const tasks: Promise<unknown>[] = [];
  const inv = (queryKey: readonly unknown[]) => {
    tasks.push(queryClient.invalidateQueries({ queryKey }));
  };

  if (pathname.startsWith('/officer/verify') || pathname.startsWith('/officer/assign')) {
    inv(officerKeys.queue());
    inv(leoOfficesKeys.myReports());
  } else if (pathname.startsWith('/officer/duplicates')) {
    inv(officerKeys.duplicateCandidates());
  } else if (
    pathname.startsWith('/officer/recurrence') ||
    pathname.startsWith('/officer/inspections')
  ) {
    inv(officerKeys.violationRecurrenceCandidates());
    inv(officerKeys.inspectionOfficerQueue());
  } else if (pathname.startsWith('/officer/tracking')) {
    inv(leoOfficesKeys.myReports());
    inv(officerKeys.queue());
  } else if (pathname.startsWith('/officer/reports')) {
    inv(officerKeys.queue());
  } else if (pathname.startsWith('/officer/reopen')) {
    inv(officerKeys.reopenRequests());
  } else if (pathname.startsWith('/officer/community')) {
    inv(communityCleanupKeys.all);
  } else if (pathname.startsWith('/officer/workforce')) {
    inv(teamKeys.all);
    inv(leoOfficesKeys.myStaff());
  } else if (pathname.startsWith('/company/queue')) {
    inv(companyKeys.all);
  } else if (pathname.startsWith('/company/assignments')) {
    inv(companyKeys.all);
  }

  return tasks;
}

/** Invalidate detail deep-link + list module của đích. */
function invalidateDestination(queryClient: QueryClient, href: string): Promise<unknown>[] {
  const url = new URL(href, 'http://local.invalid');
  const { pathname } = url;
  const reportId = url.searchParams.get('reportId')?.trim();
  const eventId = url.searchParams.get('eventId')?.trim();
  const tasks: Promise<unknown>[] = [...invalidateListsForPath(queryClient, pathname)];

  const verifyMatch = pathname.match(/^\/officer\/verify\/([^/]+)/);
  if (verifyMatch?.[1]) {
    const id = decodeURIComponent(verifyMatch[1]);
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.detail(id) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) }));
    /** Queue verify — Quay lại list thấy report mới từ noti. */
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.queue() }));
  }

  const assignMatch = pathname.match(/^\/officer\/assign\/([^/]+)/);
  if (assignMatch?.[1]) {
    const id = decodeURIComponent(assignMatch[1]);
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.detail(id) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.queue() }));
  }

  const dupMatch = pathname.match(/^\/officer\/duplicates\/([^/]+)/);
  if (dupMatch?.[1]) {
    const id = decodeURIComponent(dupMatch[1]);
    tasks.push(
      queryClient.invalidateQueries({ queryKey: officerKeys.duplicateCandidateDetail(id) })
    );
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.duplicateCandidates() }));
  }

  const recurrenceMatch = pathname.match(/^\/officer\/recurrence\/([^/]+)/);
  if (recurrenceMatch?.[1]) {
    const id = decodeURIComponent(recurrenceMatch[1]);
    tasks.push(
      queryClient.invalidateQueries({ queryKey: officerKeys.violationRecurrenceComparison(id) })
    );
    tasks.push(
      queryClient.invalidateQueries({ queryKey: officerKeys.violationRecurrenceCandidates() })
    );
  }

  const inspectionMatch = pathname.match(/^\/officer\/inspections\/([^/]+)/);
  if (inspectionMatch?.[1]) {
    const id = decodeURIComponent(inspectionMatch[1]);
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.inspectionDetail(id) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.inspectionOfficerQueue() }));
  }

  const reportsMatch = pathname.match(/^\/officer\/reports\/([^/]+)/);
  if (reportsMatch?.[1]) {
    const id = decodeURIComponent(reportsMatch[1]);
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.detail(id) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.queue() }));
  }

  const reopenMatch = pathname.match(/^\/officer\/reopen\/([^/]+)/);
  if (reopenMatch?.[1]) {
    const id = decodeURIComponent(reopenMatch[1]);
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.detail(id) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: officerKeys.reopenRequests() }));
  }

  if (pathname.startsWith('/officer/tracking') && reportId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.progress(reportId) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.detail(reportId) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() }));
  }

  if (pathname.startsWith('/officer/community') && eventId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: communityCleanupKeys.detail(eventId) }));
    tasks.push(
      queryClient.invalidateQueries({ queryKey: communityCleanupKeys.participants(eventId) })
    );
    tasks.push(queryClient.invalidateQueries({ queryKey: communityCleanupKeys.queueStats() }));
  }

  if (pathname.startsWith('/company/assignments') && reportId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: companyKeys.assignmentDetail(reportId) }));
  }

  return tasks;
}

/**
 * Soft reload RQ theo deep-link — không F5 browser.
 * Dùng khi đang đứng đúng đích noti, hoặc trước khi push detail rồi Quay lại list.
 */
export async function softReloadNotificationDestination(
  queryClient: QueryClient,
  href: string,
  originPathname?: string
): Promise<void> {
  const tasks = [
    ...(originPathname ? invalidateListsForPath(queryClient, originPathname) : []),
    ...invalidateDestination(queryClient, href),
  ];
  await Promise.all(tasks);
}

/**
 * Click noti:
 * - Gắn `from=` (list/hub đang đứng) để Quay lại đúng chỗ
 * - Invalidate list module hiện tại + đích → remount/back tự soft-refetch bảng
 * - Cùng đích → chỉ soft reload (không push trùng)
 * - Không `location.reload()` / F5
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
    void softReloadNotificationDestination(queryClient, href, pathname).finally(() => {
      router.refresh();
    });
    return;
  }

  const from = buildNotificationFromPath(pathname, search);
  const nextHref = from && href.startsWith('/officer/') ? withOfficerFromQuery(href, from) : href;

  /**
   * Fire-and-forget invalidate (không chờ network) rồi push ngay.
   * List unmount (verify) → remount khi Quay lại sẽ refetch vì query đã stale.
   * List vẫn mount (tracking) → observer active refetch nền trong lúc xem detail.
   */
  void softReloadNotificationDestination(queryClient, nextHref, pathname);
  router.push(nextHref);
}

/**
 * Quay lại list/hub từ detail (thường kèm `?from=` từ noti).
 * Soft-invalidate list của đích trước khi navigate — không F5 browser.
 */
export function goBackWithListSoftReload(options: {
  router: Pick<AppRouterLike, 'push'> & {
    replace?: (href: string, opts?: { scroll?: boolean }) => void;
  };
  queryClient: QueryClient;
  from: string | null | undefined;
  fallbackHref: string;
  /** Tracking dùng replace để khỏi chồng history reportId. */
  method?: 'push' | 'replace';
}): void {
  const { router, queryClient, from, fallbackHref, method = 'push' } = options;
  const href = (from && from.trim()) || fallbackHref;
  void softReloadNotificationDestination(queryClient, href);
  if (method === 'replace' && router.replace) {
    router.replace(href, { scroll: false });
    return;
  }
  router.push(href);
}
