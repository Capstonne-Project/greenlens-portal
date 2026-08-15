'use client';

/**
 * Custom Sonner toast — realtime notification.
 * Nền trắng + accent brand GreenLens. Click / Xem → drawer; X / Đóng → dismiss.
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
        'relative flex w-[min(100vw-2rem,22.5rem)] cursor-pointer gap-3 overflow-hidden rounded-xl bg-white p-3.5 pr-10',
        'border border-slate-200/90 shadow-[0_8px_24px_rgb(15_23_42/8%)]'
      )}
    >
      <span className="absolute inset-y-3 left-0 w-0.75 rounded-r-sm bg-brand" aria-hidden />

      <button
        type="button"
        onClick={dismissOnly}
        className="absolute top-2.5 right-2.5 inline-flex size-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Đóng thông báo"
      >
        <X className="size-4" aria-hidden />
      </button>

      <div
        className="ml-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"
        aria-hidden
      >
        <FilledBellIcon size={20} color="currentColor" className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight text-slate-900">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-slate-500">
          {message.trim() || '—'}
        </p>

        <div className="mt-2.5 flex items-center gap-3">
          <button
            type="button"
            onClick={dismissOnly}
            className="text-xs font-medium text-slate-400 transition hover:text-slate-600"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={viewOnly}
            className="text-xs font-semibold text-brand transition hover:text-brand-dark"
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
