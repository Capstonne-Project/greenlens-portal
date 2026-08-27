import { communityCleanupKeys } from '@/hooks/useCommunityCleanup';
import { companyKeys } from '@/hooks/useCompany';
import { leoOfficesKeys } from '@/hooks/useLeoOffices';
import { officerKeys } from '@/hooks/useOfficer';
import { reportKeys } from '@/hooks/useReport';
import { teamKeys } from '@/hooks/useTeams';
import { withOfficerFromQuery } from '@/utils/officerNavigation';
import type { QueryClient } from '@tanstack/react-query';
import { navigateAfterOverlayClose, releaseOverlayLock } from '@/lib/utils/radixUi';

/** Query params không quyết định “cùng màn hình” (deep-link phụ). */
/** `from` / `_r` không đổi đích; `highlight*` là deep-link nên phải so sánh. */
const IGNORE_SEARCH_KEYS = new Set(['from', '_r', 'tab']);

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
 * List/hub thuộc về destination detail (+ highlight row khi list hỗ trợ).
 *
 * Dùng khi mở detail từ noti: `from=` = hub của module đích,
 * KHÔNG phải trang đang đứng (tránh tracking → verify detail → Quay lại về tracking).
 *
 * Ví dụ:
 * - `/officer/verify/{id}` → `/officer/verify?highlight={id}`
 * - `/officer/assign/{id}` → `/officer/assign?highlightReportId={id}`
 * - `/officer/tracking/[id]` → `/officer/tracking`
 */
function buildNotificationBackTarget(targetHref: string): string | null {
  const url = new URL(targetHref, 'http://local.invalid');
  const { pathname } = url;

  const verifyMatch = pathname.match(/^\/officer\/verify\/([^/]+)/);
  if (verifyMatch?.[1]) {
    const id = decodeURIComponent(verifyMatch[1]);
    return `/officer/verify?highlight=${encodeURIComponent(id)}`;
  }

  const assignMatch = pathname.match(/^\/officer\/assign\/([^/]+)/);
  if (assignMatch?.[1]) {
    const id = decodeURIComponent(assignMatch[1]);
    return `/officer/assign?highlightReportId=${encodeURIComponent(id)}`;
  }

  const dupMatch = pathname.match(/^\/officer\/duplicates\/([^/]+)/);
  if (dupMatch?.[1]) return '/officer/duplicates';

  const recurrenceMatch = pathname.match(/^\/officer\/recurrence\/([^/]+)/);
  if (recurrenceMatch?.[1]) return '/officer/recurrence';

  const inspectionMatch = pathname.match(/^\/officer\/inspections\/([^/]+)/);
  if (inspectionMatch?.[1]) {
    const id = decodeURIComponent(inspectionMatch[1]);
    return `/officer/recurrence?tab=inspections&highlight=${encodeURIComponent(id)}`;
  }

  const reportsMatch = pathname.match(/^\/officer\/reports\/([^/]+)/);
  if (reportsMatch?.[1]) {
    const id = decodeURIComponent(reportsMatch[1]);
    return `/officer/reports?highlight=${encodeURIComponent(id)}`;
  }

  const reopenMatch = pathname.match(/^\/officer\/reopen\/([^/]+)/);
  if (reopenMatch?.[1]) return '/officer/reopen';

  const trackingMatch = pathname.match(/^\/officer\/tracking\/([^/]+)/);
  if (trackingMatch?.[1]) return '/officer/tracking';

  /** Path detail — `/officer/community/{eventId}` (enterprise route; không overlay query). */
  const communityDetailMatch = pathname.match(/^\/officer\/community\/([^/]+)/);
  if (communityDetailMatch?.[1]) {
    const eventId = decodeURIComponent(communityDetailMatch[1]);
    return `/officer/community?highlight=${encodeURIComponent(eventId)}`;
  }

  /** Legacy overlay `?eventId=` — vẫn hỗ trợ soft-back. */
  if (pathname.startsWith('/officer/community') && url.searchParams.get('eventId')?.trim()) {
    const eventId = url.searchParams.get('eventId')!.trim();
    return `/officer/community?highlight=${encodeURIComponent(eventId)}`;
  }
  if (pathname.startsWith('/company/tracking') && url.searchParams.get('reportId')?.trim()) {
    return '/company/tracking';
  }

  const companyAssignMatch = pathname.match(/^\/company\/assign\/([^/]+)/);
  if (companyAssignMatch?.[1]) {
    const id = decodeURIComponent(companyAssignMatch[1]);
    return `/company/assign?highlightReportId=${encodeURIComponent(id)}`;
  }

  return null;
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
  } else if (/^\/officer\/community\/[^/]+/.test(pathname)) {
    /** Detail route — queue không mount; detail invalidate ở invalidateDestination. */
  } else if (pathname.startsWith('/officer/community')) {
    inv([...communityCleanupKeys.all, 'office-queue']);
    inv(communityCleanupKeys.queueStats());
  } else if (pathname.startsWith('/officer/workforce')) {
    inv(teamKeys.all);
    inv(leoOfficesKeys.myStaff());
  } else if (pathname.startsWith('/company/assign')) {
    inv(companyKeys.all);
  } else if (pathname.startsWith('/company/tracking')) {
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

  const trackingDetailMatch = pathname.match(/^\/officer\/tracking\/([^/]+)/);
  if (trackingDetailMatch?.[1]) {
    const id = decodeURIComponent(trackingDetailMatch[1]);
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.progress(id) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() }));
  } else if (pathname.startsWith('/officer/tracking') && reportId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.progress(reportId) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: reportKeys.detail(reportId) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() }));
  }

  const communityDetailMatch = pathname.match(/^\/officer\/community\/([^/]+)/);
  if (communityDetailMatch?.[1]) {
    const id = decodeURIComponent(communityDetailMatch[1]);
    tasks.push(queryClient.invalidateQueries({ queryKey: communityCleanupKeys.detail(id) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: communityCleanupKeys.participants(id) }));
  } else if (pathname.startsWith('/officer/community') && eventId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: communityCleanupKeys.detail(eventId) }));
    tasks.push(
      queryClient.invalidateQueries({ queryKey: communityCleanupKeys.participants(eventId) })
    );
    tasks.push(queryClient.invalidateQueries({ queryKey: communityCleanupKeys.queueStats() }));
  }

  if (pathname.startsWith('/company/tracking') && reportId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: companyKeys.assignmentDetail(reportId) }));
  }

  const companyAssignMatch = pathname.match(/^\/company\/assign\/([^/]+)/);
  if (companyAssignMatch?.[1]) {
    const id = decodeURIComponent(companyAssignMatch[1]);
    tasks.push(queryClient.invalidateQueries({ queryKey: companyKeys.reportDetail(id) }));
    tasks.push(queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'queue'] }));
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
 * - Gắn `from=` = hub module của **destination** (+ highlight) — Quay lại đúng trang chính detail
 * - Không gắn `from=` theo trang đang đứng (tránh nhảy về tracking/assign khi mở verify)
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
      releaseOverlayLock();
    });
    return;
  }

  const backTarget = buildNotificationBackTarget(href);
  const nextHref =
    backTarget && href.startsWith('/officer/') ? withOfficerFromQuery(href, backTarget) : href;

  /**
   * Fire-and-forget invalidate (không chờ network) rồi push ngay.
   * List unmount (verify) → remount khi Quay lại sẽ refetch vì query đã stale.
   * List vẫn mount (tracking) → observer active refetch nền trong lúc xem detail.
   */
  void softReloadNotificationDestination(queryClient, nextHref, pathname);
  router.push(nextHref);
  // Sheet/Dialog may still be tearing down — clear stuck body pointer-events.
  releaseOverlayLock();
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
  navigateAfterOverlayClose(() => {
    if (method === 'replace' && router.replace) {
      router.replace(href, { scroll: false });
      return;
    }
    router.push(href);
  });
}
