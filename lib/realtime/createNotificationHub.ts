import type { NotificationHub } from '@/lib/realtime/types';

/**
 * Factory hub realtime.
 *
 * Hiện tại: REST-first — trả `null` (chưa bật SignalR).
 * Khi BE sẵn sàng:
 * 1. `npm i @microsoft/signalr`
 * 2. Set `NEXT_PUBLIC_ENABLE_SIGNALR=true`
 * 3. Implement `createSignalRNotificationHub()` bên dưới, giữ cùng `NotificationHub` interface
 * → UI + hooks không cần đổi.
 */
export function isNotificationRealtimeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_SIGNALR === 'true';
}

export function createNotificationHub(): NotificationHub | null {
  if (!isNotificationRealtimeEnabled()) return null;

  // Placeholder — thay bằng SignalR client khi tích hợp.
  // return createSignalRNotificationHub();
  return null;
}
