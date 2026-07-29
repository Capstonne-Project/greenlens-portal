'use client';

import { create } from 'zustand';

/**
 * L5 — UI-only for notification drawer.
 * Không cache list/detail API (React Query giữ server state).
 * SignalR sau này chỉ invalidate query keys — không đẩy payload vào store này.
 */
type NotificationUiState = {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

export const useNotificationUiStore = create<NotificationUiState>(set => ({
  isDrawerOpen: false,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set(s => ({ isDrawerOpen: !s.isDrawerOpen })),
}));
