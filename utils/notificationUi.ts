import type { NotificationItem, NotificationType } from '@/lib/api/models/notification';
import { NOTIFICATION_TYPE_LABEL_VI } from '@/lib/constants/notificationTemplates';
import type { LucideIcon } from 'lucide-react';
import { Droplets, FlaskConical, Trash2 } from 'lucide-react';

/** Types ưu tiên hiển thị / cấu hình trên Company Manager dashboard. */
export const COMPANY_NOTIFICATION_TYPES = [
  'CompanyReportDispatched',
  'ReportUnassigned',
  'ReportOverdue',
  'SlaBreachWarning',
  'ReportStatusChanged',
  'ContractExpiry',
  'ReportAutoClosed',
  'CompanyManagerAccountCreated',
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
    case 'ReportVerificationNeeded':
    case 'ReopenReviewNeeded':
    case 'ReopenRequestDecided':
    case 'NewComment':
    case 'NearbyReport':
      if (ref) return `/admin/reports/${encodeURIComponent(ref)}`;
      return '/admin/reports';
    case 'PenaltyIssued':
      if (ref) return `/admin/reports/${encodeURIComponent(ref)}`;
      return '/admin/penalty-frameworks';
    case 'ContractExpiry':
      return '/admin/departments';
    case 'CompanyManagerAccountCreated':
      return '/admin/settings/account';
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
    case 'CompanyManagerAccountCreated':
      return '/company/settings/account';
    case 'CompanyReportDispatched':
      // referenceId = reportId → CompanyAssignReportDetailClient
      if (ref) return `/company/assign/${encodeURIComponent(ref)}`;
      return '/company/assign';
    case 'ReportUnassigned':
      return '/company/assign';
    case 'ContractExpiry':
      return '/company/contract-history';
    case 'ReportStatusChanged':
    case 'ReportOverdue':
    case 'ReportAutoClosed':
    case 'SlaBreachWarning':
    case 'CleanupBeforeImagesUploaded':
    case 'CleanupProgressUpdated':
      if (ref) return `/company/tracking?reportId=${encodeURIComponent(ref)}`;
      return '/company/tracking';
    default:
      if (ref) return `/company/tracking?reportId=${encodeURIComponent(ref)}`;
      return '/company/notifications';
  }
}

/** Deep-link trong officer portal theo type + referenceId. */
export function officerNotificationHref(
  item: Pick<NotificationItem, 'type' | 'referenceId'>
): string {
  const ref = item.referenceId?.trim();

  switch (item.type) {
    case 'ReopenReviewNeeded':
      // referenceId = reportId → ReopenDetailClient (/officer/reopen/[id])
      if (ref) return `/officer/reopen/${encodeURIComponent(ref)}`;
      return '/officer/reopen';
    case 'ViolationRecurrenceReviewNeeded':
      // referenceId = reportId → VerifyPageClient list + highlight (không mở VerifyDetailClient)
      if (ref) return `/officer/verify?highlight=${encodeURIComponent(ref)}`;
      return '/officer/verify';
    case 'ReportVerificationNeeded':
    case 'SlaBreachWarning':
    case 'ReportStatusChanged':
    case 'ReportOverdue':
    case 'ReportAutoClosed':
    case 'ReportUnassigned':
    case 'DuplicateReviewNeeded':
    case 'ReopenRequestDecided':
    case 'NewComment':
    case 'NearbyReport':
    case 'PenaltyIssued':
      // Luôn mở chi tiết báo cáo khi có referenceId (VerifyDetailClient).
      if (ref) return `/officer/verify/${encodeURIComponent(ref)}`;
      return '/officer/verify';
    case 'ReportClosedByCitizen':
      // referenceId = reportId → ReportsReportDetailClient
      if (ref) return `/officer/reports/${encodeURIComponent(ref)}`;
      return '/officer/reports';
    case 'BadgeEarned':
    case 'LevelUp':
    case 'BadgeProgressNear':
      return '/officer/dashboard';
    case 'CompanyManagerAccountCreated':
      return '/officer/settings/account';
    case 'StaffInvitationAccepted':
      return '/officer/workforce?tab=members';
    case 'CommunityCleanupStarted':
    case 'CommunityCleanupProgressUpdated':
    case 'CommunityCleanupVerificationSubmitted':
    case 'CommunityCleanupVerificationRejected':
    case 'CommunityCleanupVerified':
    case 'CommunityCleanupCheckInReminder':
    case 'CommunityCleanupOpened':
    case 'CommunityCleanupLeaderAssigned':
      if (ref) return `/officer/community?eventId=${encodeURIComponent(ref)}`;
      return '/officer/community';
    case 'CleanupTaskAccepted':
    case 'CleanupTaskDeclined':
    case 'CleanupTaskCompleted':
    case 'CleanupProgressUpdated':
    case 'CleanupBeforeImagesUploaded':
    case 'CompanyTeamAssigned':
      // referenceId = reportId → LeoTrackingReportDetail
      if (ref) return `/officer/tracking/${encodeURIComponent(ref)}`;
      return '/officer/tracking';
    case 'InspectionProgressUpdated':
    case 'InspectionTaskAccepted':
    case 'InspectionTaskCompleted':
      // referenceId = inspectionId → InspectionDetailClient
      if (ref) return `/officer/inspections/${encodeURIComponent(ref)}`;
      return '/officer/recurrence?tab=inspections';
    default:
      if (ref) return `/officer/verify/${encodeURIComponent(ref)}`;
      return '/officer/dashboard';
  }
}

export type NotificationPortal = 'officer' | 'admin' | 'company';

export function resolveNotificationPortal(pathname: string): NotificationPortal {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/company')) return 'company';
  return 'officer';
}

export function resolveNotificationHref(
  portal: NotificationPortal,
  item: Pick<NotificationItem, 'type' | 'referenceId'>
): string {
  switch (portal) {
    case 'admin':
      return adminNotificationHref(item);
    case 'company':
      return companyNotificationHref(item);
    default:
      return officerNotificationHref(item);
  }
}

export function getNotificationDrawerLinks(portal: NotificationPortal): {
  inboxHref: string | null;
  preferencesHref: string | null;
} {
  switch (portal) {
    case 'admin':
      return {
        inboxHref: '/admin/notifications',
        preferencesHref: '/admin/settings/notifications',
      };
    case 'company':
      return {
        inboxHref: '/company/notifications',
        preferencesHref: '/company/settings/notifications',
      };
    default:
      // Officer: drawer là inbox chính, settings nằm trong route shell bên phải sidebar.
      return { inboxHref: null, preferencesHref: '/officer/settings/notifications' };
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

/**
 * Relative time từ `createdAt` → hiện tại.
 * <1 phút → Vừa xong
 * 1–59 phút → X phút trước
 * 1–23 giờ → X giờ trước
 * 1–6 ngày → X ngày trước
 * ≥7 ngày → X tuần trước (phù hợp inbox)
 */
export function formatNotificationRelativeTime(iso: string): string {
  if (!iso?.trim()) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';

  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return 'Vừa xong';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  const weeks = Math.floor(days / 7);
  return `${weeks} tuần trước`;
}

/** Thời gian ngắn cho dropdown (kiểu Facebook: "11 giờ", "2 phút"). */
export function formatNotificationShortTime(iso: string): string {
  if (!iso?.trim()) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';

  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return 'Vừa xong';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày`;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(d);
}

/**
 * Bucket section theo thời gian tạo (local day):
 *
 * | Key        | Label VI   | Rule                                    |
 * |------------|------------|-----------------------------------------|
 * | today      | Hôm nay    | `createdAt` trong hôm nay               |
 * | yesterday  | Hôm qua    | hôm qua                                 |
 * | thisWeek   | Tuần này   | trong 7 ngày gần nhất (trừ hôm nay/qua) |
 * | earlier    | Trước đó   | còn lại                                 |
 *
 * Không tách bucket "Mới" theo `isRead` — unread nằm đúng bucket thời gian.
 * Mỗi bucket sort `createdAt` desc (mới nhất trước).
 */
export type NotificationTimeGroup = 'today' | 'yesterday' | 'thisWeek' | 'earlier';

export const NOTIFICATION_TIME_GROUP_LABEL: Record<NotificationTimeGroup, string> = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  thisWeek: 'Tuần này',
  earlier: 'Trước đó',
};

const TIME_GROUP_ORDER: readonly NotificationTimeGroup[] = [
  'today',
  'yesterday',
  'thisWeek',
  'earlier',
] as const;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(dayStart: Date, days: number): Date {
  return new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + days);
}

function createdAtMs(item: Pick<NotificationItem, 'createdAt'>): number {
  const t = new Date(item.createdAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Gán 1 item → đúng 1 bucket theo `createdAt` (first-match). Invalid → earlier. */
export function resolveNotificationTimeGroup(
  item: Pick<NotificationItem, 'createdAt'>,
  now: Date = new Date()
): NotificationTimeGroup {
  const created = new Date(item.createdAt);
  if (Number.isNaN(created.getTime())) return 'earlier';

  const todayStart = startOfLocalDay(now);
  if (created >= todayStart) return 'today';

  const yesterdayStart = addLocalDays(todayStart, -1);
  if (created >= yesterdayStart) return 'yesterday';

  const weekStart = addLocalDays(todayStart, -6);
  if (created >= weekStart) return 'thisWeek';

  return 'earlier';
}

/**
 * Nhóm list theo móc thời gian. O(n log n) — sort desc trong mỗi bucket.
 */
export function groupNotificationsByTime(
  items: NotificationItem[],
  now: Date = new Date()
): { group: NotificationTimeGroup; items: NotificationItem[] }[] {
  const buckets: Record<NotificationTimeGroup, NotificationItem[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  for (const item of items) {
    buckets[resolveNotificationTimeGroup(item, now)].push(item);
  }

  for (const group of TIME_GROUP_ORDER) {
    buckets[group].sort((a, b) => createdAtMs(b) - createdAtMs(a));
  }

  return TIME_GROUP_ORDER.filter(g => buckets[g].length > 0).map(group => ({
    group,
    items: buckets[group],
  }));
}

export function notificationThumbnailFallback(
  item: Pick<NotificationItem, 'title' | 'categoryName'>
): string {
  const source = item.categoryName?.trim() || item.title?.trim() || '?';
  return source.charAt(0).toUpperCase();
}

/** BR-REP-005 seed: 3 loại ô nhiễm dùng cho badge góc thumbnail. */
export type NotificationCategoryCode = 'TRASH' | 'WASTEWATER' | 'CHEMICAL';

export type NotificationCategoryBadge = {
  code: NotificationCategoryCode;
  label: string;
  Icon: LucideIcon;
  /** Nền badge kiểu Facebook (icon trắng). */
  badgeClassName: string;
};

const CATEGORY_BADGES: NotificationCategoryBadge[] = [
  {
    code: 'TRASH',
    label: 'Ô nhiễm rác thải',
    Icon: Trash2,
    /** Xanh môi trường — gắn ý nghĩa bảo vệ môi trường (brand GreenLens). */
    badgeClassName: 'bg-brand',
  },
  {
    code: 'WASTEWATER',
    label: 'Ô nhiễm nước',
    Icon: Droplets,
    badgeClassName: 'bg-sky-600',
  },
  {
    code: 'CHEMICAL',
    label: 'Ô nhiễm hóa chất',
    Icon: FlaskConical,
    badgeClassName: 'bg-rose-600',
  },
];

/**
 * Map `categoryName` (NameVi) hoặc code → badge UI.
 * Trả `null` nếu không khớp 3 loại seed.
 */
export function resolveNotificationCategoryBadge(
  categoryName: string | null | undefined
): NotificationCategoryBadge | null {
  if (!categoryName?.trim()) return null;
  const raw = categoryName.trim();
  const upper = raw.toUpperCase();
  const lower = raw.toLowerCase();

  const byCode = CATEGORY_BADGES.find(b => b.code === upper);
  if (byCode) return byCode;

  const byLabel = CATEGORY_BADGES.find(b => b.label.toLowerCase() === lower);
  if (byLabel) return byLabel;

  if (lower.includes('rác') || lower.includes('trash')) {
    return CATEGORY_BADGES[0]!;
  }
  if (lower.includes('nước') || lower.includes('wastewater') || lower.includes('nước thải')) {
    return CATEGORY_BADGES[1]!;
  }
  if (lower.includes('hóa chất') || lower.includes('chemical') || lower.includes('hoá chất')) {
    return CATEGORY_BADGES[2]!;
  }

  return null;
}
