import type { NotificationItem } from '@/lib/api/models/notification';
import type { NotificationPortal } from '@/utils/notificationUi';

export type { NotificationPortal };

export type NotificationDrawerLinks = {
  /** Full inbox page — `null` nếu portal chưa có trang riêng (officer). */
  inboxHref: string | null;
  preferencesHref: string | null;
};

export type NotificationHrefResolver = (
  item: Pick<NotificationItem, 'type' | 'referenceId'>
) => string;
