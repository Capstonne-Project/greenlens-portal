/**
 * Trạng thái vòng đời chương trình dọn cộng đồng (Community Cleanup) — khớp BE.
 * OpenForJoin → JoinClosed → InProgress → PendingVerification → Completed
 *                                                              → InProgress (reject)
 * Có thể Cancelled ở bất kỳ giai đoạn nào trước Completed.
 */
import type { CommunityCleanupStatus } from '@/lib/api/models/communityCleanup';

export const COMMUNITY_CLEANUP_STATUSES = [
  'OpenForJoin',
  'JoinClosed',
  'InProgress',
  'PendingVerification',
  'Completed',
  'Cancelled',
] as const satisfies readonly CommunityCleanupStatus[];

export const COMMUNITY_CLEANUP_STATUS_LABEL_VI: Record<CommunityCleanupStatus, string> = {
  OpenForJoin: 'Đang mở đăng ký',
  JoinClosed: 'Đã đóng đăng ký',
  InProgress: 'Đang dọn dẹp',
  PendingVerification: 'Chờ duyệt xác thực',
  Completed: 'Đã hoàn thành',
  Cancelled: 'Đã hủy',
};

export function communityCleanupStatusLabelVi(status: CommunityCleanupStatus | string): string {
  return COMMUNITY_CLEANUP_STATUS_LABEL_VI[status as CommunityCleanupStatus] ?? String(status);
}

/** Soft badge — đồng bộ style với `REPORT_STATUS_BADGE_CLASSES`. */
export const COMMUNITY_CLEANUP_STATUS_BADGE_CLASSES: Record<CommunityCleanupStatus, string> = {
  OpenForJoin: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
  JoinClosed: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
  InProgress: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200/80',
  PendingVerification: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
  Completed: 'bg-green-50 text-green-800 ring-1 ring-green-200/80',
  Cancelled: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80',
};

/** Dot accent — dùng trên list row / timeline nhỏ. */
export const COMMUNITY_CLEANUP_STATUS_DOT_CLASSES: Record<CommunityCleanupStatus, string> = {
  OpenForJoin: 'bg-emerald-500',
  JoinClosed: 'bg-slate-400',
  InProgress: 'bg-blue-500',
  PendingVerification: 'bg-amber-500',
  Completed: 'bg-green-500',
  Cancelled: 'bg-rose-500',
};

/** Chương trình đang chờ LEO xử lý — dùng đếm badge nav / mặc định tab hàng đợi. */
export const COMMUNITY_CLEANUP_ACTIONABLE_STATUSES: CommunityCleanupStatus[] = [
  'PendingVerification',
];
