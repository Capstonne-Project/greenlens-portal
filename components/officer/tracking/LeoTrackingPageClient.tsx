'use client';

import { TYPE_LABEL as TEAM_TYPE_LABEL_VI } from '@/components/officer/workforce/teamTab/teamTab.shared';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AnimatedHoverTooltip, AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardDescription, CardTitle, HoverEffect } from '@/components/ui/card-hover-effect';
import { Input } from '@/components/ui/input';
import SaveIcon from '@/components/ui/save-icon';
import { PaginationSimple } from '@/components/ui/pagination';
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLeoMyReports } from '@/hooks/useLeoOffices';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type {
  LeoMyReportAssignment,
  LeoMyReportItem,
  LeoMyReportsSeverity,
  LeoMyReportsStatus,
  LeoReportAssignmentStatus,
} from '@/lib/api/models/office';
import {
  LEO_MY_REPORTS_SEVERITIES,
  LEO_MY_REPORTS_STATUSES,
  LEO_REPORT_ASSIGNMENT_STATUSES,
} from '@/lib/api/models/office';
import { reportStatusLabelVi, REPORT_STATUS_BADGE_CLASSES } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ChevronDown,
  CircleHelp,
  Clock,
  ImageIcon,
  LayoutGrid,
  List,
  Loader2,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * Page size theo view — board denser để quét nhiều case;
 * list vừa phải để đọc hàng. Query `pageSize` → GET /v1/offices/my/reports.
 */
const LEO_BOARD_PAGE_SIZE = 20;
const LEO_LIST_PAGE_SIZE = 15;

/** Swagger GET /v1/offices/my/reports — query `status`. */
const LEO_TRACKING_STATUSES = LEO_MY_REPORTS_STATUSES;

const LEO_TRACKING_STATUS_SET = new Set<string>(LEO_TRACKING_STATUSES);

type LeoTrackingStatus = LeoMyReportsStatus;
type LeoStatusTab = 'All' | LeoTrackingStatus;
type LeoViewMode = 'list' | 'board';

const SEVERITY_LABEL: Record<LeoMyReportsSeverity, string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
  Critical: 'Nghiêm trọng',
};

const ASSIGNMENT_STATUS_LABEL: Record<LeoReportAssignmentStatus, string> = {
  Assigned: 'Đã phân công',
  InProgress: 'Đang xử lý',
  Completed: 'Hoàn thành',
  Declined: 'Từ chối',
};

const FILTER_BTN_CLASS =
  'h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-brand';

const LEO_VIEW_TOGGLE_CLASS = (active: boolean) =>
  cn(
    'flex size-8 items-center justify-center rounded-lg transition-all',
    active ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
  );

const EMPTY_LEO_ITEMS: LeoMyReportItem[] = [];

const AVATAR_PALETTE = [
  'bg-orange-200 text-orange-800',
  'bg-emerald-200 text-emerald-800',
  'bg-rose-200 text-rose-800',
  'bg-sky-200 text-sky-800',
  'bg-violet-200 text-violet-800',
  'bg-amber-200 text-amber-800',
  'bg-teal-200 text-teal-800',
  'bg-indigo-200 text-indigo-800',
] as const;

function hashIndex(key: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % modulo;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

function teamTypeLabelVi(teamType: string | null | undefined): string {
  const key = teamType?.trim();
  if (!key) return 'Đội xử lý';
  return TEAM_TYPE_LABEL_VI[key] ?? key;
}

// ─── SLA → deadline badge ──────────────────────────────────────────────────

type DeadlineTone = 'critical' | 'warning' | 'safe';

interface DeadlineInfo {
  label: string;
  tone: DeadlineTone;
}

const DEADLINE_TONE_CLASS: Record<DeadlineTone, string> = {
  critical: 'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-700',
  safe: 'bg-sky-50 text-sky-700',
};

/** Severity accent — scan nhanh trên board đông. */
const SEVERITY_DOT_CLASS: Record<LeoMyReportsSeverity, string> = {
  Low: 'bg-slate-400',
  Medium: 'bg-amber-400',
  High: 'bg-orange-500',
  Critical: 'bg-red-500',
};

const SEVERITY_CHIP_CLASS: Record<LeoMyReportsSeverity, string> = {
  Low: 'bg-slate-100 text-slate-700',
  Medium: 'bg-amber-50 text-amber-800',
  High: 'bg-orange-50 text-orange-800',
  Critical: 'bg-red-50 text-red-700',
};

function getDeadlineInfo(slaIso: string | null): DeadlineInfo {
  if (!slaIso) return { label: 'Chưa có hạn', tone: 'safe' };

  const due = new Date(slaIso).getTime();
  const now = Date.now();
  const diffMs = due - now;
  const overdue = diffMs < 0;
  const absHours = Math.floor(Math.abs(diffMs) / 3_600_000);
  const absDays = Math.floor(absHours / 24);

  if (overdue) {
    if (absDays >= 1) return { label: `Quá hạn ${absDays} ngày`, tone: 'critical' };
    return { label: `Quá hạn ${absHours}h`, tone: 'critical' };
  }

  if (absHours < 24) return { label: `${absHours}h còn lại`, tone: 'critical' };
  if (absDays < 3) return { label: `${absDays} ngày còn lại`, tone: 'warning' };
  if (absDays < 7) return { label: `${absDays} ngày còn lại`, tone: 'safe' };
  const weeks = Math.floor(absDays / 7);
  return { label: `${weeks} tuần còn lại`, tone: 'safe' };
}

/** Datetime VI không giây — dùng tooltip hạn xử lý. */
function formatSlaDateTime(slaIso: string): string {
  return new Date(slaIso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Ngày hạn SLA kiểu listing — tiếng Việt, vd. "25 thg 7, 26". */
function formatSlaDate(slaIso: string | null): string {
  if (!slaIso) return '—';
  const d = new Date(slaIso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

// ─── Status tab bar (giống DeoTrackingPageClient) ───────────────────────────

function LeoStatusTabBar({
  tabs,
  activeKey,
  onChange,
  viewMode,
  onViewModeChange,
}: {
  tabs: Array<{ key: LeoStatusTab; label: string; count: number }>;
  activeKey: LeoStatusTab;
  onChange: (key: LeoStatusTab) => void;
  viewMode: LeoViewMode;
  onViewModeChange: (mode: LeoViewMode) => void;
}) {
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<LeoStatusTab, HTMLButtonElement>());
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
  }, [syncIndicator, tabs]);

  useEffect(() => {
    const scroll = tabsScrollRef.current;
    if (!scroll) return undefined;

    const observer = new ResizeObserver(() => syncIndicator());
    observer.observe(scroll);
    scroll.addEventListener('scroll', syncIndicator, { passive: true });
    window.addEventListener('resize', syncIndicator);

    return () => {
      observer.disconnect();
      scroll.removeEventListener('scroll', syncIndicator);
      window.removeEventListener('resize', syncIndicator);
    };
  }, [syncIndicator]);

  return (
    <div className="relative flex shrink-0 items-end gap-2">
      <div
        ref={tabsScrollRef}
        className="relative min-w-0 flex-1 overflow-x-auto border-b border-border pb-2 scrollbar-hide"
        role="tablist"
        aria-label="Lọc báo cáo theo trạng thái"
      >
        <div className="inline-flex items-stretch">
          {tabs.map(tab => {
            const isActive = tab.key === activeKey;
            return (
              <button
                key={tab.key}
                ref={node => {
                  if (node) tabRefs.current.set(tab.key, node);
                  else tabRefs.current.delete(tab.key);
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors first:pl-0',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span className="rounded-sm bg-white px-1.5 py-0.5 text-xs font-bold tabular-nums text-muted-foreground shadow-sm">
                  {tab.count}
                </span>
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
      <div className="flex shrink-0 items-center gap-1 self-stretch border-b border-border pb-2">
        <button
          type="button"
          title="Danh sách"
          aria-pressed={viewMode === 'list'}
          onClick={() => onViewModeChange('list')}
          className={LEO_VIEW_TOGGLE_CLASS(viewMode === 'list')}
        >
          <List className="size-4" />
        </button>
        <button
          type="button"
          title="Board"
          aria-pressed={viewMode === 'board'}
          onClick={() => onViewModeChange('board')}
          className={LEO_VIEW_TOGGLE_CLASS(viewMode === 'board')}
        >
          <LayoutGrid className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Board / list cards ────────────────────────────────────────────────────

/** Compact media strip — 1–3 thumbs từ `LeoMyReportItem.thumbnails`. */
function ReportThumbStrip({
  urls,
  alt,
  className,
  aspectClassName = 'aspect-[16/10]',
}: {
  urls: string[];
  alt: string;
  className?: string;
  aspectClassName?: string;
}) {
  const thumbs = urls.filter(Boolean).slice(0, 3);

  if (thumbs.length === 0) {
    return (
      <div
        className={cn(
          'flex w-full items-center justify-center bg-muted/60 text-muted-foreground',
          aspectClassName,
          className
        )}
      >
        <ImageIcon className="size-7 opacity-40" aria-hidden />
      </div>
    );
  }

  if (thumbs.length === 1) {
    return (
      <div className={cn('relative w-full overflow-hidden bg-muted', aspectClassName, className)}>
        <Image
          src={thumbs[0]!}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, 25vw"
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid w-full gap-0.5 overflow-hidden bg-muted',
        aspectClassName,
        thumbs.length === 2 ? 'grid-cols-2' : 'grid-cols-[1.35fr_1fr]',
        className
      )}
    >
      <div className={cn('relative min-h-0', thumbs.length >= 3 && 'row-span-2')}>
        <Image src={thumbs[0]!} alt={alt} fill sizes="18vw" className="object-cover" unoptimized />
      </div>
      {thumbs.length === 2 ? (
        <div className="relative min-h-0">
          <Image src={thumbs[1]!} alt="" fill sizes="12vw" className="object-cover" unoptimized />
        </div>
      ) : (
        <div className="grid min-h-0 grid-rows-2 gap-0.5">
          {thumbs.slice(1, 3).map((url, i) => (
            <div key={`${url}-${i}`} className="relative min-h-0">
              <Image src={url} alt="" fill sizes="10vw" className="object-cover" unoptimized />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Board card body — shadcn Card + thumb + tín hiệu scan (severity / status / progress). */
function ProjectCard({ item }: { item: LeoMyReportItem }) {
  const progress = Math.max(0, Math.min(100, Math.round(item.overallProgressPercent ?? 0)));
  const title = item.categoryName;
  const meta = item.address?.trim() || item.code;
  const slaDateLabel = formatSlaDate(item.slaResolveDueAt);
  const slaDeadline = getDeadlineInfo(item.slaResolveDueAt);
  const slaTooltipDesignation = item.slaResolveDueAt
    ? `${formatSlaDateTime(item.slaResolveDueAt)} · ${slaDeadline.label}`
    : 'Chưa có hạn xử lý';
  const statusLabel = reportStatusLabelVi(item.status);
  const statusBadgeClass =
    REPORT_STATUS_BADGE_CLASSES[item.status as keyof typeof REPORT_STATUS_BADGE_CLASSES] ??
    'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80';

  const visibleTeams = item.assignments.slice(0, 3);
  const extraTeams = Math.max(0, item.assignments.length - visibleTeams.length);
  const teamTooltipItems = visibleTeams.map((assignment, index) => ({
    id: index + 1,
    name: assignment.teamName,
    designation: teamTypeLabelVi(assignment.teamType),
    initials: getInitials(assignment.teamName),
    fallbackClassName:
      AVATAR_PALETTE[hashIndex(assignment.teamId, AVATAR_PALETTE.length)] ??
      'bg-muted text-foreground',
  }));

  return (
    <Card className="overflow-hidden border-border/50 bg-card shadow-none transition-colors group-hover:bg-card">
      <div className="relative">
        <ReportThumbStrip urls={item.thumbnails ?? []} alt={item.code} />
        <span
          className={cn(
            'absolute right-2 top-2 inline-flex max-w-[75%] items-center truncate rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm',
            statusBadgeClass
          )}
          title={statusLabel}
        >
          <span className="truncate">{statusLabel}</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="min-w-0">
          <div
            className="mb-2 mt-0.5 flex items-center gap-1.5 py-0.5"
            title={`Mức độ: ${SEVERITY_LABEL[item.severity]}`}
          >
            <span
              className={cn('size-1.5 shrink-0 rounded-full', SEVERITY_DOT_CLASS[item.severity])}
              aria-hidden
            />
            <span
              className={cn(
                'text-[11px] font-medium',
                item.severity === 'Low' && 'text-slate-600',
                item.severity === 'Medium' && 'text-amber-700',
                item.severity === 'High' && 'text-orange-700',
                item.severity === 'Critical' && 'text-red-700'
              )}
            >
              {SEVERITY_LABEL[item.severity]}
            </span>
          </div>
          <CardTitle className="line-clamp-2 text-md font-semibold leading-snug" title={title}>
            {title}
          </CardTitle>
          <CardDescription className="mt-1 line-clamp-1 text-xs" title={meta}>
            {meta}
          </CardDescription>
        </div>

        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="tabular-nums font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-0.5">
          <div
            className="flex min-w-0 items-center"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            {visibleTeams.length === 0 ? (
              <span className="truncate text-[10px] text-muted-foreground">Chưa có đội</span>
            ) : (
              <>
                <AnimatedTooltip items={teamTooltipItems} />
                {extraTeams > 0 ? (
                  <span className="relative z-10 -ml-1 flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground ring-2 ring-card">
                    +{extraTeams}
                  </span>
                ) : null}
              </>
            )}
          </div>
          <AnimatedHoverTooltip
            name="Hạn xử lý"
            designation={slaTooltipDesignation}
            className="shrink-0"
          >
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <FontAwesomeIcon
                icon={faCalendar}
                className="size-3.5 text-muted-foreground/80"
                aria-hidden
              />
              <span className="tabular-nums">{slaDateLabel}</span>
            </span>
          </AnimatedHoverTooltip>
        </div>
      </div>
    </Card>
  );
}

function TeamAvatar({ assignment }: { assignment: LeoMyReportAssignment }) {
  const colorClass = AVATAR_PALETTE[hashIndex(assignment.teamId, AVATAR_PALETTE.length)]!;
  const tooltip = assignment.teamType
    ? `${assignment.teamName} · ${teamTypeLabelVi(assignment.teamType)}`
    : assignment.teamName;
  return (
    <span className="relative" title={tooltip}>
      <Avatar className="size-7 ring-2 ring-card">
        <AvatarFallback className={`text-[10px] font-semibold ${colorClass}`}>
          {getInitials(assignment.teamName)}
        </AvatarFallback>
      </Avatar>
    </span>
  );
}

/** List row — mật độ cao, thumb nhỏ + cột tín hiệu cố định. */
function ProjectListRow({ item, onOpen }: { item: LeoMyReportItem; onOpen: () => void }) {
  const progress = Math.max(0, Math.min(100, Math.round(item.overallProgressPercent ?? 0)));
  const deadline = getDeadlineInfo(item.slaResolveDueAt);
  const title = item.address?.trim() || item.code;
  const thumb = (item.thumbnails ?? []).find(Boolean);
  const visibleTeams = item.assignments.slice(0, 3);
  const extraTeams = Math.max(0, item.assignments.length - visibleTeams.length);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4"
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-14">
        {thumb ? (
          <Image src={thumb} alt="" fill sizes="56px" className="object-cover" unoptimized />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-4 opacity-40" aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn('size-1.5 shrink-0 rounded-full', SEVERITY_DOT_CLASS[item.severity])}
            aria-hidden
          />
          <p className="truncate text-sm font-semibold text-foreground" title={title}>
            {title}
          </p>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {item.categoryName}
          <span className="mx-1 text-border">·</span>
          <span className="font-mono">#{item.code}</span>
        </p>
      </div>

      <span
        className={cn(
          'hidden shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium md:inline-flex',
          SEVERITY_CHIP_CLASS[item.severity]
        )}
      >
        {SEVERITY_LABEL[item.severity]}
      </span>

      <div className="hidden w-28 shrink-0 sm:block">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Tiến độ</span>
          <span className="tabular-nums font-semibold text-foreground">{progress}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="hidden items-center -space-x-2 lg:flex">
        {visibleTeams.map(a => (
          <TeamAvatar key={a.assignmentId} assignment={a} />
        ))}
        {extraTeams > 0 ? (
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground ring-2 ring-card">
            +{extraTeams}
          </span>
        ) : null}
      </div>

      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium',
          DEADLINE_TONE_CLASS[deadline.tone]
        )}
      >
        <Clock className="size-3.5" aria-hidden />
        {deadline.label}
      </span>
    </button>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(k => (
        <div
          key={k}
          className="h-[240px] animate-pulse rounded-2xl border border-border/50 bg-muted/30"
        />
      ))}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {['a', 'b', 'c', 'd'].map(k => (
        <div
          key={k}
          className="h-16 animate-pulse rounded-xl border border-border/60 bg-muted/30"
        />
      ))}
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────

interface LeoTrackingPageClientProps {
  onOpenDetail: (id: string) => void;
}

export function LeoTrackingPageClient({ onOpenDetail }: LeoTrackingPageClientProps) {
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<LeoStatusTab>('All');
  const [viewMode, setViewMode] = useState<LeoViewMode>('board');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | LeoMyReportsSeverity>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<
    'all' | LeoReportAssignmentStatus
  >('all');

  const pageSize = viewMode === 'board' ? LEO_BOARD_PAGE_SIZE : LEO_LIST_PAGE_SIZE;

  const handleViewModeChange = (mode: LeoViewMode) => {
    setViewMode(mode);
    setPage(1);
  };

  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const isSearchPending = search.trim() !== debouncedSearch;

  const handleStatusTabChange = (tab: LeoStatusTab) => {
    setStatusTab(tab);
    setPage(1);
  };
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleSeverityChange = (value: 'all' | LeoMyReportsSeverity) => {
    setSeverityFilter(value);
    setPage(1);
  };
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };
  const handleAssignmentStatusChange = (value: 'all' | LeoReportAssignmentStatus) => {
    setAssignmentStatusFilter(value);
    setPage(1);
  };

  const { data: catalogCategories = [] } = useCatalogPollutionCategories();

  const { data, isLoading, isError } = useLeoMyReports({
    page,
    pageSize,
    sortBy: 'createdAt',
    sortDesc: true,
    search: debouncedSearch || undefined,
    status: statusTab === 'All' ? undefined : statusTab,
    categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
    severity: severityFilter === 'all' ? undefined : severityFilter,
    assignmentStatus: assignmentStatusFilter === 'all' ? undefined : assignmentStatusFilter,
  });

  const items = useMemo(() => data?.items ?? EMPTY_LEO_ITEMS, [data?.items]);

  const statusCounts = useMemo(() => {
    const totals = data?.pagination.totalItems ?? items.length;
    const counts = { All: totals } as Record<LeoStatusTab, number>;
    for (const s of LEO_TRACKING_STATUSES) counts[s] = 0;

    if (statusTab === 'All') {
      counts.All = items.length;
      for (const item of items) {
        if (LEO_TRACKING_STATUS_SET.has(item.status)) {
          counts[item.status as LeoTrackingStatus] += 1;
        }
      }
      return counts;
    }

    counts[statusTab] = totals;
    return counts;
  }, [data?.pagination.totalItems, items, statusTab]);

  const tabConfigs: Array<{ key: LeoStatusTab; label: string; count: number }> = useMemo(
    () => [
      { key: 'All', label: 'Tất cả', count: statusCounts.All },
      ...LEO_TRACKING_STATUSES.map(s => ({
        key: s,
        label: reportStatusLabelVi(s),
        count: statusCounts[s],
      })),
    ],
    [statusCounts]
  );

  /** Tổng trang từ BE (`pagination.totalPages`), tính theo `pageSize` server nhận. */
  const totalPages = Math.max(1, data?.pagination.totalPages ?? 1);

  const activeTabLabel = statusTab === 'All' ? 'Tất cả' : reportStatusLabelVi(statusTab);

  const categoryFilterLabel =
    categoryFilter === 'all'
      ? 'Loại ô nhiễm'
      : (catalogCategories.find(cat => cat.id === categoryFilter)?.nameVi ?? 'Loại ô nhiễm');
  const severityFilterLabel = severityFilter === 'all' ? 'Mức độ' : SEVERITY_LABEL[severityFilter];
  const assignmentFilterLabel =
    assignmentStatusFilter === 'all'
      ? 'Trạng thái đội'
      : ASSIGNMENT_STATUS_LABEL[assignmentStatusFilter];

  return (
    <>
      <header className="mb-3 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-[0.35rem]">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Theo dõi xử lý</h1>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.15rem] text-slate-500 hover:bg-slate-400/15 hover:text-slate-700"
              aria-label="Thông tin theo dõi xử lý"
            >
              <CircleHelp className="size-4" aria-hidden />
            </button>
          </div>
          {data?.localOfficeName ? (
            <TypewriterEffectSmooth
              words={[
                { text: 'Welcome', className: 'font-normal text-slate-500' },
                { text: 'back,', className: 'font-normal text-slate-500' },
                ...data.localOfficeName
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .map(text => ({
                    text,
                    className: 'font-medium text-slate-800 dark:text-slate-100',
                  })),
              ]}
              className="mt-1 my-0"
              textClassName="text-xs font-normal sm:text-xs md:text-xs lg:text-xs xl:text-xs"
              cursorClassName="h-3 w-0.5 bg-slate-400 sm:h-3 xl:h-3"
              hideCursorOnComplete
            />
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <LeoStatusTabBar
          tabs={tabConfigs}
          activeKey={statusTab}
          onChange={handleStatusTabChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />

        <div className="flex shrink-0 flex-wrap items-center gap-2 py-3 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="relative w-72 max-w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Tìm mã báo cáo, địa chỉ..."
                className={cn(
                  'h-8 w-full border-slate-200 bg-white pl-9 text-sm shadow-none',
                  isSearchPending && 'pr-8'
                )}
                aria-label="Tìm mã báo cáo, địa chỉ"
              />
              {isSearchPending ? (
                <Loader2
                  className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-slate-400"
                  aria-hidden
                />
              ) : null}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
                {categoryFilterLabel}
                <ChevronDown className="size-3.5 opacity-60" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem
                onClick={() => handleCategoryChange('all')}
                className={categoryFilter === 'all' ? 'font-medium text-brand' : ''}
              >
                Loại ô nhiễm
              </DropdownMenuItem>
              {catalogCategories.map(cat => (
                <DropdownMenuItem
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={categoryFilter === cat.id ? 'font-medium text-brand' : ''}
                >
                  {cat.nameVi}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
                {severityFilterLabel}
                <ChevronDown className="size-3.5 opacity-60" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem
                onClick={() => handleSeverityChange('all')}
                className={severityFilter === 'all' ? 'font-medium text-brand' : ''}
              >
                Mức độ
              </DropdownMenuItem>
              {LEO_MY_REPORTS_SEVERITIES.map(level => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => handleSeverityChange(level)}
                  className={severityFilter === level ? 'font-medium text-brand' : ''}
                >
                  {SEVERITY_LABEL[level]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
                {assignmentFilterLabel}
                <ChevronDown className="size-3.5 opacity-60" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => handleAssignmentStatusChange('all')}
                className={assignmentStatusFilter === 'all' ? 'font-medium text-brand' : ''}
              >
                Trạng thái đội
              </DropdownMenuItem>
              {LEO_REPORT_ASSIGNMENT_STATUSES.map(status => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleAssignmentStatusChange(status)}
                  className={assignmentStatusFilter === status ? 'font-medium text-brand' : ''}
                >
                  {ASSIGNMENT_STATUS_LABEL[status]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {isError ? (
            <div className="flex h-full items-center justify-center text-destructive">
              Không thể tải dữ liệu. Vui lòng thử lại.
            </div>
          ) : viewMode === 'board' ? (
            isLoading ? (
              <SkeletonGrid />
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <SaveIcon size={32} className="opacity-30" />
                <p>
                  Không có báo cáo phù hợp ở trạng thái{' '}
                  <span className="font-medium text-foreground">{activeTabLabel}</span>.
                </p>
              </div>
            ) : (
              <HoverEffect
                layoutId="leo-tracking-hover"
                className="grid-cols-1 gap-1 py-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                items={items.map(item => {
                  const title = item.address?.trim() || item.code;
                  const description = [
                    item.categoryName,
                    SEVERITY_LABEL[item.severity],
                    `#${item.code}`,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return {
                    key: item.id,
                    title,
                    description,
                    onClick: () => onOpenDetail(item.id),
                    content: <ProjectCard item={item} />,
                  };
                })}
              />
            )
          ) : isLoading ? (
            <SkeletonList />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <SaveIcon size={32} className="opacity-30" />
              <p>
                Không có báo cáo phù hợp ở trạng thái{' '}
                <span className="font-medium text-foreground">{activeTabLabel}</span>.
              </p>
            </div>
          ) : (
            <section className="flex flex-col gap-3">
              {items.map(item => (
                <ProjectListRow key={item.id} item={item} onOpen={() => onOpenDetail(item.id)} />
              ))}
            </section>
          )}
        </div>

        {data?.pagination ? (
          <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
              {totalPages > 1 ? (
                <PaginationSimple
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  className="w-auto"
                />
              ) : null}
            </div>
            <p className="shrink-0 text-xs text-slate-500 tabular-nums">
              {data.pagination.totalItems.toLocaleString('vi-VN')} dòng
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
