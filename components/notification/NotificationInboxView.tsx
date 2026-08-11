'use client';

import { NotificationListItem } from '@/components/notification/NotificationListItem';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FilledBellIcon from '@/components/ui/filled-bell-icon';
import { useMarkAllNotificationsRead, useNotificationsList } from '@/hooks/useNotification';
import type { NotificationItem } from '@/lib/api/models/notification';
import { NOTIFICATION_PAGE_SIZE } from '@/lib/api/models/notification';
import { cn } from '@/lib/utils';
import {
  getNotificationDrawerLinks,
  getNotificationMutationError,
  resolveNotificationHref,
  type NotificationPortal,
} from '@/utils/notificationUi';
import { navigateFromNotification } from '@/utils/notificationNavigation';
import {
  AlertTriangle,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type ReadFilter = 'all' | 'unread';

const FILTERS: { key: ReadFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
];

function toIsReadParam(filter: ReadFilter): boolean | undefined {
  if (filter === 'unread') return false;
  return undefined;
}

type NotificationInboxViewProps = {
  portal: NotificationPortal;
};

/** Trang inbox đầy đủ — cùng UI/UX với NotificationDrawerPanel (Leo). */
export function NotificationInboxView({ portal }: NotificationInboxViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const isRead = toIsReadParam(readFilter);

  const { data, isPending, isError, isFetching, refetch } = useNotificationsList({
    page,
    pageSize: NOTIFICATION_PAGE_SIZE,
    isRead,
  });

  const markAll = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / NOTIFICATION_PAGE_SIZE));
  const links = getNotificationDrawerLinks(portal);

  const handleSelect = (item: NotificationItem) => {
    navigateFromNotification({
      router,
      queryClient,
      href: resolveNotificationHref(portal, item),
      pathname,
      search: searchParams.toString(),
    });
  };

  const handleMarkAllRead = () => {
    if (unreadCount <= 0 || markAll.isPending) return;
    markAll.mutate(undefined, {
      onSuccess: env => {
        const count = env.data?.markedCount ?? 0;
        toast.success(
          count > 0 ? `Đã đánh dấu ${count} thông báo là đã đọc` : 'Không còn thông báo chưa đọc'
        );
      },
      onError: err =>
        toast.error(getNotificationMutationError(err, 'Không thể đánh dấu tất cả đã đọc')),
    });
  };

  const handleOpenPreferences = () => {
    setHeaderMenuOpen(false);
    if (links.preferencesHref) {
      router.push(links.preferencesHref);
      return;
    }
    toast.message('Cài đặt thông báo chưa khả dụng trên portal này');
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <FilledBellIcon size={20} color="currentColor" className="size-5 shrink-0" />
          <h2 className="text-2xl font-semibold tracking-tight">Thông báo</h2>
        </div>
        {unreadCount > 0 ? (
          <span className="ml-auto text-sm font-medium text-emerald-700">
            {unreadCount} chưa đọc
          </span>
        ) : null}
      </header>

      <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-2">
        <div className="flex min-w-0 flex-1 gap-3">
          {FILTERS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setReadFilter(opt.key);
                setPage(1);
              }}
              className={cn(
                'rounded-full px-4 py-2.5 text-xs font-medium transition-colors',
                readFilter === opt.key
                  ? 'border border-transparent bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <DropdownMenu open={headerMenuOpen} onOpenChange={setHeaderMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Thêm hành động thông báo"
              className={cn(
                'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full',
                'bg-transparent text-foreground transition-colors',
                'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'data-[state=open]:bg-muted'
              )}
            >
              <MoreHorizontal className="size-5" aria-hidden />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={10}
            collisionPadding={12}
            className={cn(
              'relative z-80 min-w-70 overflow-visible rounded-2xl border-0 bg-card p-2',
              'text-card-foreground shadow-[0_12px_28px_rgb(0_0_0/18%),0_0_0_1px_rgb(0_0_0/6%)]'
            )}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -top-1.5 right-5 size-3 rotate-45 rounded-xs bg-card shadow-[-1px_-1px_1px_rgb(0_0_0/8%)]"
            />

            <DropdownMenuItem
              disabled={unreadCount <= 0 || markAll.isPending}
              onSelect={e => {
                e.preventDefault();
                handleMarkAllRead();
                setHeaderMenuOpen(false);
              }}
              className={cn(
                'cursor-pointer gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium',
                'focus:bg-muted data-highlighted:bg-muted'
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                <CheckCheck className="size-5" aria-hidden />
              </span>
              <span className="leading-snug">Đánh dấu tất cả là đã đọc</span>
            </DropdownMenuItem>

            {links.preferencesHref ? (
              <DropdownMenuItem
                onSelect={e => {
                  e.preventDefault();
                  handleOpenPreferences();
                }}
                className={cn(
                  'cursor-pointer gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium',
                  'focus:bg-muted data-highlighted:bg-muted'
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <Settings2 className="size-5" aria-hidden />
                </span>
                <span className="leading-snug">Cài đặt thông báo</span>
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative min-h-[280px]">
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
          <div className="flex flex-col items-center gap-3 px-4 py-20 text-center text-sm text-muted-foreground">
            <FilledBellIcon size={58} color="currentColor" className="opacity-40" />
            {readFilter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          </div>
        ) : (
          <ul className={cn(isFetching && 'opacity-70')}>
            {items.map(item => (
              <li key={item.id}>
                <NotificationListItem item={item} onSelect={handleSelect} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 ? (
        <footer className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            {page}/{totalPages} · {totalCount} thông báo
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
              aria-label="Trang trước"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
              aria-label="Trang sau"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </footer>
      ) : links.preferencesHref ? (
        <footer className="flex shrink-0 items-center justify-end border-t border-border bg-muted/30 px-3 py-2.5">
          <Link
            href={links.preferencesHref}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <Settings2 className="size-3.5" aria-hidden />
            Cài đặt thông báo
          </Link>
        </footer>
      ) : null}
    </div>
  );
}
