'use client';

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsPreview,
} from '@/hooks/useNotification';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { cn } from '@/lib/utils';
import {
  companyNotificationHref,
  companyNotificationTypeLabel,
  formatNotificationRelativeTime,
  getNotificationMutationError,
} from '@/utils/notificationUi';
import { Bell, CheckCheck, Loader2, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

const iconButtonClass =
  'relative inline-flex size-10 items-center justify-center rounded-xl border border-emerald-100/80 bg-white/80 text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-border dark:bg-card';

export function CompanyNotificationBell() {
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
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-card">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Thông báo"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-emerald-100/80 bg-white shadow-xl shadow-emerald-900/10 dark:border-border dark:bg-card"
        >
          <div className="flex items-center justify-between gap-2 border-b border-emerald-50 px-4 py-3 dark:border-border">
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
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-40 dark:text-emerald-400"
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
              <ul className="divide-y divide-emerald-50 dark:divide-border">
                {items.map(item => {
                  const href = companyNotificationHref(item);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleItemClick(item.id, item.isRead, href)}
                        className={cn(
                          'flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-emerald-50/80 dark:hover:bg-muted/60',
                          !item.isRead && 'bg-emerald-50/40 dark:bg-emerald-950/20'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/80">
                            {companyNotificationTypeLabel(item.type)}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatNotificationRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'text-sm leading-snug',
                            item.isRead ? 'font-medium text-foreground' : 'font-semibold'
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

          <div className="flex items-center justify-between gap-2 border-t border-emerald-50 bg-emerald-50/40 px-3 py-2 dark:border-border dark:bg-muted/30">
            <Link
              href="/company/notifications"
              onClick={close}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-white dark:text-emerald-400 dark:hover:bg-muted"
            >
              Xem tất cả
            </Link>
            <Link
              href="/company/notifications/preferences"
              onClick={close}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white hover:text-foreground dark:hover:bg-muted"
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
