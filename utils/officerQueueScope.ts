import type { ReportQueueItem, ReportStatus } from '@/lib/api/models/report';
import { filterTrackingReports } from '@/utils/officerTracking';

export type OfficerQueueScope = { type: 'status'; status: ReportStatus } | { type: 'tracking' };

export function filterItemsByQueueScope(
  items: ReportQueueItem[],
  scope: OfficerQueueScope
): ReportQueueItem[] {
  if (scope.type === 'status') {
    return items.filter(item => item.status === scope.status);
  }
  return filterTrackingReports(items);
}

/**
 * Tổng hiển thị footer/pagination theo scope màn hình.
 * - BE đã lọc đúng (cả trang đều thuộc scope) → dùng `apiTotalCount`
 * - BE trả mixed / chưa hỗ trợ query → đếm scope trên trang hiện tại
 */
export function resolveQueueDisplayTotal(
  items: ReportQueueItem[],
  apiTotalCount: number,
  scope: OfficerQueueScope
): number {
  if (items.length === 0) return 0;
  const scoped = filterItemsByQueueScope(items, scope);
  if (scoped.length === items.length) return apiTotalCount;
  return scoped.length;
}
