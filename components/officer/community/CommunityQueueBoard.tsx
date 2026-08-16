'use client';

import { Input } from '@/components/ui/input';
import { useOfficeCommunityQueue } from '@/hooks/useCommunityCleanup';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { CommunityCleanupListItem } from '@/lib/api/models/communityCleanup';
import type { CommunityCleanupStatus } from '@/lib/api/models/communityCleanup';
import {
  COMMUNITY_CLEANUP_STATUS_BADGE_CLASSES,
  COMMUNITY_CLEANUP_STATUS_DOT_CLASSES,
  communityCleanupStatusLabelVi,
} from '@/lib/constants/communityCleanupStatus';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  HeartHandshake,
  ImageIcon,
  Loader2,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLayoutEffect, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaginationSimple } from '@/components/ui/pagination';

/** Highlight thẻ sau khi quay lại list — giữ ngắn rồi fade (khớp duration-700). */
const HIGHLIGHT_HOLD_MS = 1600;
const HIGHLIGHT_CLEAR_MS = 2300;

const PAGE_SIZE = 8;

type StatusTab =
  | 'PendingVerification'
  | 'All'
  | Exclude<CommunityCleanupStatus, 'PendingVerification'>;

/** Thứ tự theo đúng vòng đời: OpenForJoin → JoinClosed → InProgress → PendingVerification → Completed; Cancelled là nhánh phụ. */
const TAB_ORDER: StatusTab[] = [
  'All',
  'OpenForJoin',
  'JoinClosed',
  'InProgress',
  'PendingVerification',
  'Completed',
  'Cancelled',
];

function parseStatusTab(value: string | null): StatusTab | null {
  if (!value) return null;
  return (TAB_ORDER as readonly string[]).includes(value) ? (value as StatusTab) : null;
}

const TAB_LABEL: Record<StatusTab, string> = {
  PendingVerification: 'Chờ duyệt',
  InProgress: 'Đang dọn dẹp',
  OpenForJoin: 'Đang mở đăng ký',
  JoinClosed: 'Đã đóng đăng ký',
  Completed: 'Đã hoàn thành',
  Cancelled: 'Đã hủy',
  All: 'Tất cả',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Underline động theo tab active — cùng cơ chế với LeoStatusTabBar (tracking). */
function StatusTabBar({
  activeKey,
  onChange,
}: {
  activeKey: StatusTab;
  onChange: (key: StatusTab) => void;
}) {
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<StatusTab, HTMLButtonElement>());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const syncIndicator = useCallback(() => {
    const scroll = tabsScrollRef.current;
    const active = tabRefs.current.get(activeKey);
    if (!scroll || !active) {
      setIndicator({ left: 0, width: 0 });
      return;
    }
    const scrollRect = scroll.getBoundingClientRect();
    const tabRect = active.getBoundingClientRect();
    setIndicator({
      left: tabRect.left - scrollRect.left + scroll.scrollLeft,
      width: tabRect.width,
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    syncIndicator();
  }, [syncIndicator]);

  useEffect(() => {
    const scroll = tabsScrollRef.current;
    if (!scroll) return undefined;
    const observer = new ResizeObserver(() => syncIndicator());
    observer.observe(scroll);
    window.addEventListener('resize', syncIndicator);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncIndicator);
    };
  }, [syncIndicator]);

  return (
    <div
      ref={tabsScrollRef}
      className="relative flex w-full min-w-0 shrink-0 items-stretch overflow-x-auto border-b border-border pb-2 scrollbar-hide"
      role="tablist"
      aria-label="Lọc chương trình theo trạng thái"
    >
      <div className="inline-flex items-stretch">
        {TAB_ORDER.map(tab => {
          const isActive = tab === activeKey;
          return (
            <button
              key={tab}
              ref={node => {
                if (node) tabRefs.current.set(tab, node);
                else tabRefs.current.delete(tab);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors first:pl-0',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {TAB_LABEL[tab]}
            </button>
          );
        })}
      </div>
      {indicator.width > 0 ? (
        <span
          className="pointer-events-none absolute bottom-0 z-10 h-0.5 bg-emerald-600 transition-[left,width] duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

function EventCard({
  item,
  onOpen,
  isHighlighted,
  highlightFading,
  cardRef,
}: {
  item: CommunityCleanupListItem;
  onOpen: () => void;
  isHighlighted: boolean;
  highlightFading: boolean;
  cardRef: (node: HTMLButtonElement | null) => void;
}) {
  const progress = Math.max(0, Math.min(100, Math.round(item.progressPercent)));
  const statusLabel = communityCleanupStatusLabelVi(item.status);
  const badgeClass = COMMUNITY_CLEANUP_STATUS_BADGE_CLASSES[item.status];
  const spotsText = `${item.participantCount}/${item.maxParticipants} người`;

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onOpen}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all duration-700 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isHighlighted && !highlightFading
          ? 'border-emerald-400 bg-emerald-50/80 ring-2 ring-emerald-400/70'
          : 'border-border/60'
      )}
    >
      <div className="relative aspect-16/9 w-full shrink-0 overflow-hidden bg-muted">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-6 opacity-40" aria-hidden />
          </div>
        )}
        <span
          className={cn(
            'absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-sm',
            badgeClass
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              COMMUNITY_CLEANUP_STATUS_DOT_CLASSES[item.status]
            )}
          />
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold leading-snug text-foreground">
            {item.title}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            <span className="font-mono">#{item.reportCode}</span>
          </p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Tiến độ dọn dẹp</span>
            <span className="font-semibold tabular-nums text-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Users className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{item.leaderFullName}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            {spotsText}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden />
          Bắt đầu {formatDate(item.startsAt)}
          {item.joinClosesAt ? (
            <span className="truncate">· Đóng đăng ký {formatDateTime(item.joinClosesAt)}</span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(k => (
        <div key={k} className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="aspect-16/9 animate-pulse bg-muted/40" />
          <div className="flex flex-col gap-2 p-3.5">
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted/40" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted/30" />
            <div className="h-1.5 w-full animate-pulse rounded bg-muted/30" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface CommunityQueueBoardProps {
  onOpenDetail: (id: string) => void;
}

export function CommunityQueueBoard({ onOpenDetail }: CommunityQueueBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<StatusTab>('All');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const isSearchPending = search.trim() !== debouncedSearch;

  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [highlightFading, setHighlightFading] = useState(false);
  const [latchedUrlHighlight, setLatchedUrlHighlight] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());

  const urlHighlight = searchParams.get('highlight')?.trim() || null;
  const urlTab = parseStatusTab(searchParams.get('tab')?.trim() || null);

  if (urlHighlight && urlHighlight !== latchedUrlHighlight) {
    setLatchedUrlHighlight(urlHighlight);
    setHighlightedId(urlHighlight);
    setHighlightFading(false);
    setStatusTab(urlTab ?? 'All');
    setPage(1);
  }

  useEffect(() => {
    if (!urlHighlight && !urlTab) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete('highlight');
    next.delete('tab');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [urlHighlight, urlTab, searchParams, router, pathname]);

  const handleTabChange = (tab: StatusTab) => {
    setStatusTab(tab);
    setPage(1);
  };
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const { data, isLoading, isError } = useOfficeCommunityQueue({
    page,
    pageSize: PAGE_SIZE,
    status: statusTab === 'All' ? undefined : statusTab,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;
    const q = debouncedSearch.toLowerCase();
    return items.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.reportCode.toLowerCase().includes(q) ||
        item.leaderFullName.toLowerCase().includes(q)
    );
  }, [items, debouncedSearch]);

  const totalPages = Math.max(1, data?.pagination.totalPages ?? 1);

  useEffect(() => {
    if (!highlightedId) return;
    if (!filteredItems.some(item => item.id === highlightedId)) return;
    const fadeTimer = window.setTimeout(() => setHighlightFading(true), HIGHLIGHT_HOLD_MS);
    const clearTimer = window.setTimeout(() => {
      setLatchedUrlHighlight(null);
      setHighlightedId(null);
      setHighlightFading(false);
    }, HIGHLIGHT_CLEAR_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightedId, filteredItems]);

  useEffect(() => {
    if (!highlightedId || highlightFading) return;

    let cancelled = false;
    let attempts = 0;
    const tryScroll = () => {
      if (cancelled) return;
      const el = cardRefs.current.get(highlightedId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      attempts += 1;
      if (attempts < 24) requestAnimationFrame(tryScroll);
    };
    tryScroll();
    return () => {
      cancelled = true;
    };
  }, [highlightedId, filteredItems, highlightFading]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden px-4 pt-2 sm:px-6 lg:px-8">
      <header className="mb-4 shrink-0">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-emerald-700">
            <HeartHandshake className="size-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Dọn cộng đồng</h1>
            <p className="text-xs font-normal text-slate-500">
              Theo dõi và duyệt xác thực các chương trình dọn dẹp cộng đồng
            </p>
          </div>
        </div>
      </header>

      <StatusTabBar activeKey={statusTab} onChange={handleTabChange} />

      <div className="flex shrink-0 items-center gap-2 py-3">
        <div className="relative w-72 max-w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Tìm tiêu đề, mã báo cáo, tên leader..."
            className={cn(
              'h-8 w-full border-slate-200 bg-white pl-9 text-sm shadow-none',
              isSearchPending && 'pr-8'
            )}
            aria-label="Tìm chương trình dọn cộng đồng"
          />
          {isSearchPending ? (
            <Loader2
              className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-slate-400"
              aria-hidden
            />
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-1">
        {isError ? (
          <div className="flex h-40 items-center justify-center text-destructive">
            Không thể tải dữ liệu. Vui lòng thử lại.
          </div>
        ) : isLoading ? (
          <SkeletonGrid />
        ) : filteredItems.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <MapPin className="size-8 opacity-30" aria-hidden />
            <p>
              Không có chương trình nào ở trạng thái{' '}
              <span className="font-medium text-foreground">{TAB_LABEL[statusTab]}</span>.
            </p>
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map(item => (
              <EventCard
                key={item.id}
                item={item}
                onOpen={() => onOpenDetail(item.id)}
                isHighlighted={item.id === highlightedId}
                highlightFading={highlightFading}
                cardRef={node => {
                  if (node) cardRefs.current.set(item.id, node);
                  else cardRefs.current.delete(item.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {data?.pagination ? (
        <div className="relative flex shrink-0 items-center justify-center py-3">
          <PaginationSimple
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mx-auto w-auto justify-center"
          />
          <p className="absolute right-0 top-1/2 hidden -translate-y-1/2 text-xs text-slate-500 tabular-nums sm:block">
            {data.pagination.totalItems.toLocaleString('vi-VN')} chương trình
          </p>
        </div>
      ) : null}
    </div>
  );
}
