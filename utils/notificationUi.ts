import type { NotificationItem, NotificationType } from '@/lib/api/models/notification';
import { NOTIFICATION_TYPE_LABEL_VI } from '@/lib/constants/notificationTemplates';
import type { LucideIcon } from 'lucide-react';
import { Droplets, FlaskConical, Trash2 } from 'lucide-react';

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

/** Deep-link trong officer portal theo type + referenceId. */
export function officerNotificationHref(
  item: Pick<NotificationItem, 'type' | 'referenceId'>
): string {
  const ref = item.referenceId?.trim();

  switch (item.type) {
    case 'ReportVerificationNeeded':
      // List + highlight row — không mở detail thẳng.
      if (ref) return `/officer/verify?highlight=${encodeURIComponent(ref)}`;
      return '/officer/verify';
    case 'SlaBreachWarning':
      // SLA warning mở thẳng detail trong tracking.
      if (ref) return `/officer/tracking?reportId=${encodeURIComponent(ref)}`;
      return '/officer/tracking';
    case 'ReportStatusChanged':
    case 'ReportOverdue':
    case 'ReportAutoClosed':
    case 'ReportUnassigned':
    case 'DuplicateReviewNeeded':
    case 'ReopenReviewNeeded':
    case 'ReopenRequestDecided':
    case 'NewComment':
    case 'NearbyReport':
      if (ref) return `/officer/verify/${encodeURIComponent(ref)}`;
      return '/officer/verify';
    case 'BadgeEarned':
    case 'LevelUp':
    case 'BadgeProgressNear':
      return '/officer/dashboard';
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
    default:
      if (ref) return `/officer/tracking`;
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
 * Bucket section kiểu Meta (Facebook / Instagram Activity) — ưu tiên hybrid:
 *
 * | Key        | Label VI   | Rule                                              |
 * |------------|------------|---------------------------------------------------|
 * | new        | Mới        | `!isRead` (xấp xỉ "unseen/new" khi chưa có seenAt) |
 * | today      | Hôm nay    | đã đọc + `createdAt` trong hôm nay (local)         |
 * | yesterday  | Hôm qua    | đã đọc + hôm qua                                   |
 * | thisWeek   | Tuần này   | đã đọc + trong 7 ngày gần nhất (trừ hôm nay/qua)   |
 * | earlier    | Trước đó   | còn lại                                            |
 *
 * Industry notes:
 * - Facebook Web (vi): "Mới" + "Hôm nay" (+ older) — New ≈ unread/unseen.
 * - Instagram: Today / Yesterday / This week / Earlier (thiếu New).
 * - X/Twitter: Today / Yesterday / Older.
 *
 * Field API đủ: `createdAt` + `isRead`. Optional sau:
 * - `seenAt` / `isSeen` — New = unseen (mở drawer ≠ đọc hết).
 * - BE sort `createdAt desc` — FE giữ thứ tự trong từng bucket.
 */
export type NotificationTimeGroup = 'new' | 'today' | 'yesterday' | 'thisWeek' | 'earlier';

export const NOTIFICATION_TIME_GROUP_LABEL: Record<NotificationTimeGroup, string> = {
  new: 'Mới',
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  thisWeek: 'Tuần này',
  earlier: 'Trước đó',
};

const TIME_GROUP_ORDER: readonly NotificationTimeGroup[] = [
  'new',
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

/** Gán 1 item → đúng 1 bucket (first-match). Invalid `createdAt` → earlier. */
export function resolveNotificationTimeGroup(
  item: Pick<NotificationItem, 'isRead' | 'createdAt'>,
  now: Date = new Date()
): NotificationTimeGroup {
  if (!item.isRead) return 'new';

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
 * Nhóm list theo móc thời gian Meta-style.
 * O(n) — một pass; giữ nguyên order API trong mỗi bucket.
 */
export function groupNotificationsByTime(
  items: NotificationItem[],
  now: Date = new Date()
): { group: NotificationTimeGroup; items: NotificationItem[] }[] {
  const buckets: Record<NotificationTimeGroup, NotificationItem[]> = {
    new: [],
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  for (const item of items) {
    buckets[resolveNotificationTimeGroup(item, now)].push(item);
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
