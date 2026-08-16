'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatedHoverTooltip } from '@/components/ui/animated-tooltip';
import { useMarkNotificationRead } from '@/hooks/useNotification';
import { APP_LOGO_MARK_SRC } from '@/lib/constants/brand';
import type { NotificationItem } from '@/lib/api/models/notification';
import { cn } from '@/lib/utils';
import {
  formatNotificationRelativeTime,
  formatNotificationShortTime,
  getNotificationMutationError,
  resolveNotificationCategoryBadge,
} from '@/utils/notificationUi';
import { CheckCheck, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

type NotificationListDensity = 'default' | 'compact';

/** Chiều cao hàng = cạnh thumbnail vuông. Compact = nhỏ hơn default 2 size. */
const DENSITY = {
  default: {
    rowH: 80,
    badge: 28,
    padY: 'py-3',
    gap: 'gap-3',
    message: 'line-clamp-3 text-sm leading-5',
    time: 'text-xs',
    icon: 'size-6',
    menuBtn: 'size-9',
    menuIcon: 'size-5',
    unreadDot: 'size-3.5',
    extraMinH: 24,
  },
  compact: {
    rowH: 64,
    badge: 24,
    padY: 'py-2',
    gap: 'gap-2.5',
    message: 'line-clamp-3 text-xs leading-4',
    time: 'text-[11px]',
    icon: 'size-5',
    menuBtn: 'size-8',
    menuIcon: 'size-4',
    unreadDot: 'size-3',
    extraMinH: 16,
  },
} as const;

type NotificationListItemProps = {
  item: NotificationItem;
  onSelect: (item: NotificationItem) => void;
  /** Highlight tạm từ toast realtime (View / click toast). */
  highlighted?: boolean;
  /** `compact` dùng trong drawer — avatar/text nhỏ hơn inbox 2 size. */
  density?: NotificationListDensity;
};

/**
 * Row + menu kiểu Facebook.
 * PUT /v1/notifications/{id}/read — click item chưa đọc hoặc nút menu.
 */
export function NotificationListItem({
  item,
  onSelect,
  highlighted = false,
  density = 'default',
}: NotificationListItemProps) {
  const d = DENSITY[density];
  const message = item.message?.trim() || '—';
  const [menuOpen, setMenuOpen] = useState(false);
  const categoryBadge = resolveNotificationCategoryBadge(item.categoryName);
  const CategoryIcon = categoryBadge?.Icon;
  const markRead = useMarkNotificationRead();

  const markAsRead = (opts?: { toastOnSuccess?: boolean }) => {
    if (item.isRead || markRead.isPending) return;
    markRead.mutate(item.id, {
      onSuccess: env => {
        if (opts?.toastOnSuccess) {
          toast.success(env.message?.trim() || 'Đã đánh dấu đã đọc.');
        }
      },
      onError: err => {
        toast.error(getNotificationMutationError(err, 'Không thể đánh dấu đã đọc'));
      },
    });
  };

  const handleSelect = () => {
    if (!item.isRead) markAsRead();
    onSelect(item);
  };

  const handleMarkRead = () => {
    markAsRead({ toastOnSuccess: true });
  };

  return (
    <div className="px-2 py-0.5" id={`ntf-row-${item.id}`}>
      <div
        className={cn(
          'group relative flex w-full items-stretch rounded-xl px-2 transition-colors hover:bg-muted/70',
          d.gap,
          d.padY,
          !item.isRead && 'bg-muted/40',
          highlighted &&
            'bg-emerald-50 ring-2 ring-emerald-500/50 ring-inset dark:bg-emerald-950/40'
        )}
        style={{ minHeight: d.rowH + d.extraMinH }}
      >
        <button
          type="button"
          onClick={handleSelect}
          className={cn(
            'flex min-w-0 flex-1 cursor-pointer items-stretch border-0 bg-transparent p-0 text-left',
            d.gap
          )}
        >
          {/* overflow-visible để badge FB không bị cắt */}
          <div className="relative shrink-0" style={{ width: d.rowH, height: d.rowH }}>
            <div className="relative size-full overflow-hidden rounded-full bg-muted">
              {item.thumbnailUrl?.trim() ? (
                <Image
                  src={item.thumbnailUrl}
                  alt=""
                  fill
                  sizes={`${d.rowH}px`}
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Image
                  src={APP_LOGO_MARK_SRC}
                  alt=""
                  fill
                  sizes={`${d.rowH}px`}
                  className="object-contain p-2.5"
                  unoptimized
                />
              )}
            </div>

            {categoryBadge && CategoryIcon ? (
              <AnimatedHoverTooltip
                name={item.categoryName?.trim() || categoryBadge.label}
                className="absolute -right-1.5 -bottom-0.5 z-1"
              >
                <span
                  className={cn(
                    'flex items-center justify-center rounded-full',
                    'border-[2.5px] border-background text-white shadow-sm',
                    categoryBadge.badgeClassName
                  )}
                  style={{ width: d.badge, height: d.badge }}
                  aria-label={item.categoryName?.trim() || categoryBadge.label}
                >
                  <CategoryIcon
                    className={density === 'compact' ? 'size-3' : 'size-3.5'}
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </span>
              </AnimatedHoverTooltip>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between" style={{ height: d.rowH }}>
            <span
              className={cn(
                'overflow-hidden text-foreground',
                d.message,
                !item.isRead && 'font-medium'
              )}
            >
              {message}
            </span>
            <span className={cn('font-semibold text-brand', d.time)}>
              {density === 'compact'
                ? formatNotificationShortTime(item.createdAt)
                : formatNotificationRelativeTime(item.createdAt)}
            </span>
          </div>
        </button>

        <div
          className={cn(
            'absolute top-2 right-2 z-10 transition-opacity',
            menuOpen
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
          )}
        >
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Thêm hành động"
                className={cn(
                  'inline-flex cursor-pointer items-center justify-center rounded-full',
                  d.menuBtn,
                  'bg-muted text-foreground transition-colors',
                  'hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'data-[state=open]:bg-muted'
                )}
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className={d.menuIcon} aria-hidden />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={10}
              collisionPadding={12}
              onClick={e => e.stopPropagation()}
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
                disabled={item.isRead || markRead.isPending}
                onSelect={e => {
                  e.preventDefault();
                  handleMarkRead();
                  setMenuOpen(false);
                }}
                className={cn(
                  'cursor-pointer gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium',
                  'focus:bg-muted data-highlighted:bg-muted'
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <CheckCheck className="size-5" aria-hidden />
                </span>
                <span className="leading-snug">
                  {item.isRead ? 'Đã đọc' : 'Đánh dấu là đã đọc'}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {!item.isRead && !menuOpen ? (
          <span
            className={cn(
              'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-emerald-600 group-hover:opacity-0',
              d.unreadDot
            )}
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}
