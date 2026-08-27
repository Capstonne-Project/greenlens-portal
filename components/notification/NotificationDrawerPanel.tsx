'use client';

import { useMarkAllNotificationsRead, useNotificationsList } from '@/hooks/useNotification';
import type { NotificationItem } from '@/lib/api/models/notification';
import { NOTIFICATION_PAGE_SIZE } from '@/lib/api/models/notification';
import { useNotificationUiStore } from '@/lib/store/notificationUiStore';
import { cn } from '@/lib/utils';
import {
  getNotificationDrawerLinks,
  getNotificationMutationError,
  groupNotificationsByTime,
  NOTIFICATION_TIME_GROUP_LABEL,
  resolveNotificationHref,
  type NotificationPortal,
} from '@/utils/notificationUi';
import { navigateFromNotification } from '@/utils/notificationNavigation';
import { deferOpenFromMenu, releaseOverlayLock } from '@/lib/utils/radixUi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FilledBellIcon from '@/components/ui/filled-bell-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCheck, MoreHorizontal, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { NotificationListItem } from './NotificationListItem';

type ReadFilter = 'all' | 'unread';

type NotificationDrawerPanelProps = {
  portal: NotificationPortal;
};

const FILTERS: { key: ReadFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
];

const SKELETON_ROW_COUNT = 6;
/** Khớp density compact của NotificationListItem (avatar 80→64). */
const SKELETON_THUMB = 64;

function toIsReadParam(filter: ReadFilter): boolean | undefined {
  if (filter === 'unread') return false;
  return undefined;
}

function NotificationDrawerSkeleton() {
  return (
    <ul aria-busy="true" aria-label="Đang tải thông báo" className="py-0.5">
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
        <li key={i} className="px-2 py-0.5">
          <div
            className="flex w-full items-stretch gap-2.5 rounded-xl px-2 py-2"
            style={{ minHeight: SKELETON_THUMB + 16 }}
          >
            <Skeleton
              className="shrink-0 rounded-full"
              style={{ width: SKELETON_THUMB, height: SKELETON_THUMB }}
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
              <Skeleton className="h-3.5 w-[88%]" />
              <Skeleton className="h-3 w-[72%]" />
              <Skeleton className="h-2.5 w-14" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Drawer body — GET /v1/notifications (page=1, pageSize=20, isRead).
 * Không mock: data chỉ từ L4 → L2.
 */
export function NotificationDrawerPanel({ portal }: NotificationDrawerPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isDrawerOpen = useNotificationUiStore(s => s.isDrawerOpen);
  const closeDrawer = useNotificationUiStore(s => s.closeDrawer);
  const highlightedNotificationId = useNotificationUiStore(s => s.highlightedNotificationId);
  const clearHighlight = useNotificationUiStore(s => s.clearHighlight);

  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  /** Toast highlight → ép tab Tất cả (derive, không setState trong effect). */
  const activeFilter: ReadFilter = highlightedNotificationId ? 'all' : readFilter;
  const isRead = toIsReadParam(activeFilter);

  const { data, isPending, isError, isFetching, refetch } = useNotificationsList(
    {
      page: 1,
      pageSize: NOTIFICATION_PAGE_SIZE,
      isRead,
    },
    { enabled: isDrawerOpen }
  );

  const markAll = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const links = getNotificationDrawerLinks(portal);
  const groupedItems = groupNotificationsByTime(items);
  const showSeeAllFooter = Boolean(links.inboxHref);

  /** Scroll tới hàng + bỏ highlight sau vài giây (chỉ khi tìm thấy row). */
  useEffect(() => {
    if (!isDrawerOpen || !highlightedNotificationId || isPending) return;

    const row = document.getElementById(`ntf-row-${highlightedNotificationId}`);
    if (!row) return;

    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const timer = window.setTimeout(() => {
      clearHighlight();
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [isDrawerOpen, highlightedNotificationId, isPending, items.length, clearHighlight]);

  /** Click row → đóng Sheet rồi mới navigate (tránh body pointer-events: none kẹt). */
  const handleSelect = (item: NotificationItem) => {
    clearHighlight();
    closeDrawer();
    releaseOverlayLock();
    deferOpenFromMenu(() => {
      releaseOverlayLock();
      navigateFromNotification({
        router,
        queryClient,
        href: resolveNotificationHref(portal, item),
        pathname,
        search: searchParams.toString(),
      });
    });
  };

  /** PUT /v1/notifications/read-all — L4 `useMarkAllNotificationsRead`. */
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
    closeDrawer();
    releaseOverlayLock();
    deferOpenFromMenu(() => {
      releaseOverlayLock();
      if (links.preferencesHref) {
        router.push(links.preferencesHref);
        return;
      }
      toast.message('Cài đặt thông báo chưa khả dụng trên portal này');
    });
  };

  const handleFilterChange = (next: ReadFilter) => {
    clearHighlight();
    setReadFilter(next);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-3 px-4 py-4 pr-12">
        <div className="flex min-w-0 items-center gap-2">
          <FilledBellIcon size={20} color="currentColor" className="size-5 shrink-0" />
          <h2 className="text-2xl font-semibold tracking-tight">Thông báo</h2>
        </div>
      </header>

      <div className="flex shrink-0 items-center gap-3 px-3 py-2">
        <div className="flex min-w-0 flex-1 gap-3">
          {FILTERS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleFilterChange(opt.key)}
              className={cn(
                'rounded-full px-4 py-2.5 text-xs font-medium transition-colors',
                activeFilter === opt.key
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto scrollbar-smooth">
        {isPending ? (
          <NotificationDrawerSkeleton />
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
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center text-sm text-muted-foreground">
            <FilledBellIcon size={58} color="currentColor" className="opacity-40" />
            {activeFilter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          </div>
        ) : (
          <div className={cn(isFetching && 'opacity-70')}>
            {groupedItems.map(({ group, items: groupItems }) => (
              <section key={group} aria-labelledby={`ntf-group-${group}`}>
                <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-3">
                  <h3
                    id={`ntf-group-${group}`}
                    className="text-[15px] font-bold tracking-tight text-foreground"
                  >
                    {NOTIFICATION_TIME_GROUP_LABEL[group]}
                  </h3>
                </div>
                <ul>
                  {groupItems.map(item => (
                    <li key={item.id}>
                      <NotificationListItem
                        item={item}
                        onSelect={handleSelect}
                        highlighted={item.id === highlightedNotificationId}
                        density="compact"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {showSeeAllFooter && links.inboxHref ? (
        <footer className="flex shrink-0 items-center justify-between gap-2 bg-muted/30 px-3 py-2.5">
          <Link
            href={links.inboxHref}
            onClick={closeDrawer}
            className="rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-background"
          >
            Xem tất cả
          </Link>
        </footer>
      ) : null}
    </div>
  );
}
