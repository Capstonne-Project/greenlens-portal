'use client';

import { create } from 'zustand';

/**
 * L5 — UI-only for notification drawer.
 * Không cache list/detail API (React Query giữ server state).
 * SignalR → hook invalidate/patch React Query — không đẩy list vào store này.
 */
type NotificationUiState = {
  isDrawerOpen: boolean;
  /** Id noti cần scroll/highlight khi mở drawer từ toast realtime. */
  highlightedNotificationId: string | null;
  openDrawer: () => void;
  /** Mở drawer + highlight đúng hàng noti (toast View / click toast). */
  openDrawerToNotification: (notificationId: string) => void;
  clearHighlight: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

export const useNotificationUiStore = create<NotificationUiState>(set => ({
  isDrawerOpen: false,
  highlightedNotificationId: null,

  openDrawer: () => set({ isDrawerOpen: true }),

  openDrawerToNotification: notificationId =>
    set({
      isDrawerOpen: true,
      highlightedNotificationId: notificationId,
    }),

  clearHighlight: () => set({ highlightedNotificationId: null }),

  closeDrawer: () => set({ isDrawerOpen: false, highlightedNotificationId: null }),

  toggleDrawer: () =>
    set(s => ({
      isDrawerOpen: !s.isDrawerOpen,
      highlightedNotificationId: s.isDrawerOpen ? null : s.highlightedNotificationId,
    })),
}));
