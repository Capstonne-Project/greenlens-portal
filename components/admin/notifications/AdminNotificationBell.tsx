'use client';

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsPreview,
} from '@/hooks/useNotification';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { cn } from '@/lib/utils';
import {
  adminNotificationHref,
  formatNotificationRelativeTime,
  getNotificationMutationError,
  notificationTypeLabel,
} from '@/utils/notificationUi';
import { Bell, CheckCheck, Loader2, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

const iconButtonClass =
  'relative inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

export function AdminNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isPending, isError, refetch } = useNotificationsPreview(8);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(panelRef, () => {
    if (open) close();
  });

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  const handleItemClick = (id: string, isRead: boolean, href: string) => {
    setOpen(false);
    if (!isRead) {
      markRead.mutate(id, {
        onError: err => toast.error(getNotificationMutationError(err, 'Không thể đánh dấu đã đọc')),
      });
    }
    router.push(href);
  };

  const handleMarkAll = () => {
    if (unreadCount <= 0) return;
    markAll.mutate(undefined, {
      onSuccess: env => {
        toast.success(
          env.message ??
            (env.data?.markedCount
              ? `Đã đánh dấu ${env.data.markedCount} thông báo`
              : 'Đã đánh dấu tất cả đã đọc')
        );
      },
      onError: err =>
        toast.error(getNotificationMutationError(err, 'Không thể đánh dấu tất cả đã đọc')),
    });
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className={iconButtonClass}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(v => !v)}
      >
        <Bell className="size-[18px]" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-card">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Thông báo"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Thông báo</p>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Không có thông báo mới'}
              </p>
            </div>
            <button
              type="button"
              disabled={unreadCount <= 0 || markAll.isPending}
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
            >
              {markAll.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <CheckCheck className="size-3.5" aria-hidden />
              )}
              Đọc tất cả
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isPending ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Đang tải…
              </div>
            ) : isError ? (
              <div className="space-y-2 p-4 text-sm">
                <p className="font-medium text-destructive">Không tải được thông báo</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="text-xs font-medium text-emerald-700 underline"
                >
                  Thử lại
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Chưa có thông báo nào.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map(item => {
                  const href = adminNotificationHref(item);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleItemClick(item.id, item.isRead, href)}
                        className={cn(
                          'flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-muted/70',
                          !item.isRead && 'bg-muted/40'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {notificationTypeLabel(item.type)}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatNotificationRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'text-sm leading-snug',
                            item.isRead ? 'font-medium' : 'font-semibold'
                          )}
                        >
                          {item.title}
                        </p>
                        {item.message?.trim() && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {item.message}
                          </p>
                        )}
                        {!item.isRead && (
                          <span
                            className="mt-0.5 size-1.5 rounded-full bg-emerald-600"
                            aria-hidden
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-3 py-2">
            <Link
              href="/admin/notifications"
              onClick={close}
              className="rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-background"
            >
              Xem tất cả
            </Link>
            <Link
              href="/admin/notifications/preferences"
              onClick={close}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <Settings2 className="size-3.5" aria-hidden />
              Cài đặt
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
