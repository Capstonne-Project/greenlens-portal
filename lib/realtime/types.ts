import type { NotificationItem } from '@/lib/api/models/notification';

/**
 * Contract cho hub realtime (SignalR sau này).
 * UI / React Query chỉ phụ thuộc interface này — không phụ thuộc SDK cụ thể.
 */
export type NotificationRealtimeEvent =
  | {
      kind: 'created';
      notification: NotificationItem;
    }
  | {
      kind: 'read';
      notificationId: string;
    }
  | {
      kind: 'read_all';
      markedCount: number;
    }
  | {
      kind: 'unread_count';
      unreadCount: number;
    };

export type NotificationRealtimeHandler = (event: NotificationRealtimeEvent) => void;

export interface NotificationHub {
  /** Kết nối hub (idempotent). */
  start: () => Promise<void>;
  /** Ngắt kết nối. */
  stop: () => Promise<void>;
  /** Đăng ký listener; trả về unsubscribe. */
  onEvent: (handler: NotificationRealtimeHandler) => () => void;
}
