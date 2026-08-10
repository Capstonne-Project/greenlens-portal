'use client';

/**
 * Notification drawer trigger — cùng visual language với `SidebarLink`,
 * nhưng là button (mở drawer) thay vì điều hướng trang.
 *
 * UI badge (giữ nguyên):
 * - Collapse: chấm số trên icon
 * - Expand: chấm số bên phải label
 * Cùng `unreadCount` — không render hai badge cùng lúc.
 */

import { useSidebar } from '@/components/ui/sidebar';
import { useCanFetchProtected } from '@/hooks/useAuthSession';
import { useNotificationRealtime } from '@/hooks/useNotificationRealtime';
import { useNotificationsPreview } from '@/hooks/useNotification';
import { useNotificationUiStore } from '@/lib/store/notificationUiStore';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

type NotificationNavButtonProps = {
  label: string;
  icon: ReactNode;
  active?: boolean;
};

export function NotificationNavButton({ label, icon, active = false }: NotificationNavButtonProps) {
  const { open: sidebarOpen, animate } = useSidebar();
  const showLabel = !animate || sidebarOpen;

  const openDrawer = useNotificationUiStore(s => s.openDrawer);
  const isDrawerOpen = useNotificationUiStore(s => s.isDrawerOpen);
  const canFetchProtected = useCanFetchProtected();
  // Badge chỉ cần unreadCount — pageSize=1 tối ưu bandwidth.
  // Gate memory JWT — tránh 401 flash lúc hard reload (isAuthenticated có thể true sớm).
  const { data } = useNotificationsPreview(1, { enabled: canFetchProtected });
  // Seam realtime luôn gắn ở trigger (luôn mount) → badge cập nhật cả khi drawer đóng.
  useNotificationRealtime(canFetchProtected);
  const unreadCount = data?.unreadCount ?? 0;
  const badgeCount = unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null;

  const isActive = active || isDrawerOpen;
  const chipActive = isActive && !showLabel;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-haspopup="dialog"
      aria-expanded={isDrawerOpen}
      aria-label={badgeCount ? `${label}, ${badgeCount} chưa đọc` : label}
      className={cn(
        'group/sidebar flex w-full cursor-pointer items-center justify-start gap-2 rounded-full border px-2.5 py-2 text-left no-underline transition-colors',
        'text-neutral-600',
        !isActive && 'border-transparent hover:bg-white/60 hover:text-neutral-800',
        isActive &&
          showLabel &&
          'border-transparent bg-white font-medium text-neutral-900 shadow-[0_1px_2px_rgb(15_23_42/8%),0_1px_6px_rgb(15_23_42/6%)]',
        chipActive && 'border-transparent bg-transparent font-medium text-neutral-900 shadow-none'
      )}
    >
      <span
        className={cn(
          'relative flex size-5 shrink-0 items-center justify-center [&>svg]:size-5',
          isActive ? 'text-neutral-900' : 'text-neutral-600'
        )}
      >
        {chipActive ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-transparent bg-white shadow-[0_1px_2px_rgb(15_23_42/8%),0_1px_6px_rgb(15_23_42/6%)]"
          />
        ) : null}
        <span className="relative z-1">{icon}</span>
        {badgeCount && !showLabel ? (
          <span
            key={badgeCount}
            className="absolute -top-1.5 -right-1.5 z-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white tabular-nums"
            aria-hidden
          >
            {badgeCount}
          </span>
        ) : null}
      </span>
      <motion.span
        initial={false}
        animate={{ opacity: showLabel ? 1 : 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'm-0! inline-block min-w-0 flex-1 truncate p-0! text-sm whitespace-pre transition-transform duration-150 group-hover/sidebar:translate-x-1',
          isActive ? 'text-neutral-900' : 'text-neutral-600',
          !showLabel && 'pointer-events-none'
        )}
      >
        {label}
      </motion.span>
      {badgeCount && showLabel ? (
        <span
          key={`side-${badgeCount}`}
          className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white tabular-nums"
          aria-hidden
        >
          {badgeCount}
        </span>
      ) : null}
    </button>
  );
}
