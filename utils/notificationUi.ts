import type { NotificationItem, NotificationType } from '@/lib/api/models/notification';
import { NOTIFICATION_TYPE_LABEL_VI } from '@/lib/constants/notificationTemplates';

/** Types ưu tiên hiển thị / cấu hình trên Company Manager dashboard. */
export const COMPANY_NOTIFICATION_TYPES = [
  'ReportUnassigned',
  'ReportOverdue',
  'SlaBreachWarning',
  'ReportStatusChanged',
  'ContractExpiry',
  'ReportAutoClosed',
] as const;

export type CompanyNotificationType = (typeof COMPANY_NOTIFICATION_TYPES)[number];

const COMPANY_TYPE_SET = new Set<string>(COMPANY_NOTIFICATION_TYPES);

export function isCompanyRelevantNotificationType(type: string): boolean {
  return COMPANY_TYPE_SET.has(type);
}

export function companyNotificationTypeLabel(type: NotificationType | string): string {
  return NOTIFICATION_TYPE_LABEL_VI[type] ?? type;
}

/** Alias — nhãn type dùng chung mọi portal. */
export function notificationTypeLabel(type: NotificationType | string): string {
  return companyNotificationTypeLabel(type);
}

/** Types ưu tiên trên Admin dashboard (vận hành / hệ thống). */
export const ADMIN_NOTIFICATION_TYPES = [
  'DuplicateReviewNeeded',
  'ReportOverdue',
  'SlaBreachWarning',
  'ReportStatusChanged',
  'ReportAutoClosed',
  'ReportUnassigned',
  'ContractExpiry',
  'PenaltyIssued',
] as const;

export type AdminNotificationType = (typeof ADMIN_NOTIFICATION_TYPES)[number];

const ADMIN_TYPE_SET = new Set<string>(ADMIN_NOTIFICATION_TYPES);

export function isAdminRelevantNotificationType(type: string): boolean {
  return ADMIN_TYPE_SET.has(type);
}

/** Deep-link trong admin portal theo type + referenceId. */
export function adminNotificationHref(
  item: Pick<NotificationItem, 'type' | 'referenceId'>
): string {
  const ref = item.referenceId?.trim();

  switch (item.type) {
    case 'ReportStatusChanged':
    case 'ReportOverdue':
    case 'ReportAutoClosed':
    case 'SlaBreachWarning':
    case 'ReportUnassigned':
    case 'DuplicateReviewNeeded':
    case 'NewComment':
    case 'NearbyReport':
      if (ref) return `/admin/reports/${encodeURIComponent(ref)}`;
      return '/admin/reports';
    case 'PenaltyIssued':
      if (ref) return `/admin/reports/${encodeURIComponent(ref)}`;
      return '/admin/penalty-frameworks';
    case 'ContractExpiry':
      return '/admin/departments';
    case 'BadgeEarned':
    case 'LevelUp':
      return '/admin/gamification-configs';
    default:
      if (ref) return `/admin/reports/${encodeURIComponent(ref)}`;
      return '/admin/notifications';
  }
}

/** Deep-link trong company portal theo type + referenceId. */
export function companyNotificationHref(
  item: Pick<NotificationItem, 'type' | 'referenceId'>
): string {
  const ref = item.referenceId?.trim();

  switch (item.type) {
    case 'ReportUnassigned':
      return '/company/queue';
    case 'ContractExpiry':
      return '/company/contract-history';
    case 'ReportStatusChanged':
    case 'ReportOverdue':
    case 'ReportAutoClosed':
    case 'SlaBreachWarning':
      if (ref) return `/company/assignments?tab=detail&reportId=${encodeURIComponent(ref)}`;
      return '/company/assignments';
    default:
      if (ref) return `/company/assignments?tab=detail&reportId=${encodeURIComponent(ref)}`;
      return '/company/notifications';
  }
}

export function getNotificationMutationError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    const msg = res?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export function formatNotificationRelativeTime(iso: string): string {
  if (!iso?.trim()) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}
