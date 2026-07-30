/**
 * Contract realtime notification (SignalR).
 *
 * BE MVP: chỉ 1 hub method `ReceiveNotification`.
 * Union `kind` giữ chỗ cho Read / ReadAll / UnreadCount sau này.
 */

/** Payload FE sau khi normalize từ Hub (chấp nhận camelCase hoặc PascalCase từ BE). */
export type RealTimeNotificationPayload = {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceId: string | null;
  createdAt: string;
};

export type NotificationRealtimeEvent =
  | {
      kind: 'received';
      notification: RealTimeNotificationPayload;
    }
  | {
      /** Sau start thành công hoặc automatic reconnect — FE nên REST sync unread. */
      kind: 'connected';
      reason: 'start' | 'reconnect';
    };

export type NotificationRealtimeHandler = (event: NotificationRealtimeEvent) => void;

/**
 * Abstraction hub — UI/hooks chỉ phụ thuộc interface này.
 * Dùng `subscribe` (ref-count + delayed stop) thay vì start/stop thủ công.
 */
export interface NotificationHub {
  /**
   * Đăng ký handler + giữ connection sống.
   * Trả về unsubscribe — consumer cuối cùng rời đi mới stop (debounce chống Strict Mode).
   */
  subscribe: (handler: NotificationRealtimeHandler) => () => void;
}
