'use client';

import { useNotificationsPreview } from '@/hooks/useNotification';
import { useNotificationRealtime } from '@/hooks/useNotificationRealtime';
import { useNotificationUiStore } from '@/lib/store/notificationUiStore';
import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';

const iconButtonClass =
  'relative inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

type NotificationHeaderBellProps = {
  className?: string;
};

/**
 * Header bell — mở cùng NotificationDrawer như Leo (sidebar Thông báo).
 * Badge + realtime gắn ở trigger (luôn mount).
 */
export function NotificationHeaderBell({ className }: NotificationHeaderBellProps) {
  const toggleDrawer = useNotificationUiStore(s => s.toggleDrawer);
  const isDrawerOpen = useNotificationUiStore(s => s.isDrawerOpen);

  const { data } = useNotificationsPreview(1);
  useNotificationRealtime(true);

  const unreadCount = data?.unreadCount ?? 0;
  const badgeLabel = unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null;

  return (
    <button
      type="button"
      className={cn(iconButtonClass, isDrawerOpen && 'bg-muted text-foreground', className)}
      aria-label={badgeLabel ? `Thông báo, ${badgeLabel} chưa đọc` : 'Thông báo'}
      aria-expanded={isDrawerOpen}
      aria-haspopup="dialog"
      onClick={toggleDrawer}
    >
      <Bell className="size-[18px]" aria-hidden />
      {badgeLabel ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-background"
          aria-hidden
        >
          {badgeLabel}
        </span>
      ) : null}
    </button>
  );
}
