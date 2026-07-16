'use client';

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from '@/hooks/useNotification';
import { cn } from '@/lib/utils';
import {
  companyNotificationHref,
  companyNotificationTypeLabel,
  formatNotificationRelativeTime,
  getNotificationMutationError,
} from '@/utils/notificationUi';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type ReadFilter = 'all' | 'unread' | 'read';

const PAGE_SIZE = 20;

export function CompanyNotificationsView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  const isReadParam = readFilter === 'all' ? undefined : readFilter === 'read' ? true : false;

  const { data, isPending, isError, refetch } = useNotificationsList({
    page,
    pageSize: PAGE_SIZE,
    isRead: isReadParam,
  });

  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const unreadCount = data?.unreadCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleOpen = (id: string, isRead: boolean, href: string) => {
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
    <div className="relative space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Theo dõi task mới, SLA và hợp đồng của công ty bạn.
          {unreadCount > 0 && (
            <span className="ml-1 font-medium text-emerald-800 dark:text-emerald-400">
              {unreadCount} chưa đọc
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/company/notifications/preferences"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 px-3 py-2 text-sm font-medium hover:bg-emerald-50 dark:border-border"
          >
            <Settings2 className="size-4" aria-hidden />
            Cài đặt
          </Link>
          <button
            type="button"
            disabled={unreadCount <= 0 || markAll.isPending}
            onClick={handleMarkAll}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {markAll.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="size-4" aria-hidden />
            )}
            Đọc tất cả
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'all', label: 'Tất cả' },
            { key: 'unread', label: 'Chưa đọc' },
            { key: 'read', label: 'Đã đọc' },
          ] as const
        ).map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              setReadFilter(opt.key);
              setPage(1);
            }}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition',
              readFilter === opt.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-emerald-50 dark:hover:bg-muted'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Đang tải…
          </div>
        ) : isError ? (
          <div className="flex items-start gap-3 p-6 text-sm">
            <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />
            <div className="space-y-3">
              <p className="font-semibold text-destructive">Không tải được danh sách thông báo</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted"
              >
                <RefreshCw className="size-4" aria-hidden />
                Thử lại
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Bell className="size-10 text-emerald-200" aria-hidden />
            <p className="text-sm text-muted-foreground">Không có thông báo nào.</p>
          </div>
        ) : (
          <ul className="divide-y divide-emerald-50 dark:divide-border">
            {items.map(item => {
              const href = companyNotificationHref(item);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleOpen(item.id, item.isRead, href)}
                    className={cn(
                      'flex w-full flex-col gap-1.5 px-4 py-4 text-left transition hover:bg-emerald-50/70 sm:flex-row sm:items-start sm:justify-between dark:hover:bg-muted/50',
                      !item.isRead && 'bg-emerald-50/50 dark:bg-emerald-950/15'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {!item.isRead && (
                          <span
                            className="size-2 rounded-full bg-emerald-600"
                            aria-label="Chưa đọc"
                          />
                        )}
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                          {companyNotificationTypeLabel(item.type)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'mt-1.5 text-sm',
                          item.isRead ? 'font-medium' : 'font-semibold'
                        )}
                      >
                        {item.title}
                      </p>
                      {item.message?.trim() && (
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                          {item.message}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground sm:pl-4 sm:pt-1">
                      {formatNotificationRelativeTime(item.createdAt)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-emerald-50 px-4 py-3 text-sm dark:border-border">
            <p className="text-muted-foreground">
              {page}/{totalPages} · {totalCount} thông báo
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-lg p-2 hover:bg-emerald-50 disabled:opacity-30"
                aria-label="Trang trước"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded-lg p-2 hover:bg-emerald-50 disabled:opacity-30"
                aria-label="Trang sau"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
