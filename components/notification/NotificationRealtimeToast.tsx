'use client';

/**
 * Custom Sonner toast — realtime notification (dark card như mẫu).
 * Click body / View → mở drawer + highlight đúng noti.
 * Dismiss / X → chỉ đóng toast.
 */

import FilledBellIcon from '@/components/ui/filled-bell-icon';
import { useNotificationUiStore } from '@/lib/store/notificationUiStore';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { MouseEvent } from 'react';
import { toast } from 'sonner';

export type NotificationRealtimeToastProps = {
  toastId: string | number;
  notificationId: string;
  title: string;
  message: string;
};

export function NotificationRealtimeToast({
  toastId,
  notificationId,
  title,
  message,
}: NotificationRealtimeToastProps) {
  const openDrawerToNotification = useNotificationUiStore(s => s.openDrawerToNotification);

  const openTarget = () => {
    openDrawerToNotification(notificationId);
    toast.dismiss(toastId);
  };

  const dismissOnly = (event: MouseEvent) => {
    event.stopPropagation();
    toast.dismiss(toastId);
  };

  const viewOnly = (event: MouseEvent) => {
    event.stopPropagation();
    openTarget();
  };

  return (
    <div
      role="status"
      onClick={openTarget}
      className={cn(
        'relative flex w-[min(100vw-2rem,22.5rem)] cursor-pointer gap-3 rounded-2xl p-4',
        'bg-neutral-950 text-white shadow-[0_16px_40px_rgb(0_0_0/40%)]',
        'ring-1 ring-white/10'
      )}
    >
      <button
        type="button"
        onClick={dismissOnly}
        className="absolute top-3 right-3 inline-flex size-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-white/10 hover:text-white"
        aria-label="Đóng thông báo"
      >
        <X className="size-4" aria-hidden />
      </button>

      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300"
        aria-hidden
      >
        <FilledBellIcon size={22} color="currentColor" className="size-5" />
      </div>

      <div className="min-w-0 flex-1 pr-6">
        <p className="truncate text-sm font-semibold tracking-tight text-white">{title}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-snug font-normal text-white">
          {message.trim() || '—'}
        </p>

        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={dismissOnly}
            className="text-sm font-medium text-neutral-400 transition hover:text-neutral-200"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={viewOnly}
            className="text-sm font-semibold text-white transition hover:text-neutral-200"
          >
            Xem thông báo
          </button>
        </div>
      </div>
    </div>
  );
}

/** Gọi từ hook realtime (file `.ts` không JSX). */
export function showNotificationRealtimeToast(input: {
  notificationId: string;
  title: string;
  message: string;
}): void {
  toast.custom(
    toastId => (
      <NotificationRealtimeToast
        toastId={toastId}
        notificationId={input.notificationId}
        title={input.title}
        message={input.message}
      />
    ),
    {
      duration: 10_000,
      position: 'bottom-right',
      className: 'bg-transparent! p-0! shadow-none! border-0!',
    }
  );
}
