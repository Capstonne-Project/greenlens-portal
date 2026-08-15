'use client';

import {
  CompanyTrackingDateRangePicker,
  type CompanyTrackingDateRangeValue,
} from '@/components/company/tracking/CompanyTrackingDateRangePicker';
import {
  AnimatedHoverTooltip,
  AnimatedTooltip,
  type AnimatedTooltipItem,
} from '@/components/ui/animated-tooltip';
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
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useCompanyAssignments,
  useCompanyAssignmentThumbnails,
  useCompanyTeamOptions,
} from '@/hooks/useCompany';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type {
  CompanyAssignmentListItem,
  CompanyAssignmentStatus,
  CompanyQueueSeverity,
} from '@/lib/api/models/company';
import { REPORT_SEVERITY_LABEL_VI } from '@/lib/constants/reportActions';
import {
  normalizeReportStatus,
  REPORT_STATUS_BADGE_CLASSES,
  reportStatusLabelVi,
} from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { assignmentStatusLabel, queueSeverityLabel } from '@/utils/companyUi';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ChevronDown, Clock, ImageIcon, LayoutGrid, List, Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState, useSyncExternalStore } from 'react';

/** Query `pageSize` — cố định 10 / trang (khớp Leo tracking). */
const COMPANY_BOARD_PAGE_SIZE = 10;
const COMPANY_LIST_PAGE_SIZE = 10;

const COMPANY_BOARD_GRID_CLASS = 'grid w-full grid-cols-2 gap-2 py-0 sm:grid-cols-3 lg:grid-cols-5';

type CompanyViewMode = 'list' | 'board';

const COMPANY_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
type CompanySeverityLevel = (typeof COMPANY_SEVERITIES)[number];

const COMPANY_ASSIGNMENT_STATUSES = [
  'Assigned',
  'InProgress',
  'Completed',
  'Declined',
  'Escalated',
] as const satisfies readonly CompanyAssignmentStatus[];

/** Tracking board — chỉ 2 reportStatus theo scope công ty. */
const COMPANY_TRACKING_REPORT_STATUSES = ['InProgress', 'Resolved'] as const;
type CompanyTrackingReportStatus = (typeof COMPANY_TRACKING_REPORT_STATUSES)[number];

const SEVERITY_LABEL = REPORT_SEVERITY_LABEL_VI;

const FILTER_BTN_CLASS =
  'h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-brand shadow-none outline-none ring-0 ring-offset-0 focus:border-slate-300 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-slate-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 active:border-slate-300 active:outline-none data-[state=open]:border-slate-300 data-[state=open]:ring-0';
const BOARD_TEAM_AVATAR_SIZE_CLASS = 'size-5 sm:size-6 lg:size-7';

const COMPANY_VIEW_TOGGLE_CLASS = (active: boolean) =>
  cn(
    'flex size-8 items-center justify-center rounded-lg transition-all',
    active ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
  );

const EMPTY_ITEMS: CompanyAssignmentListItem[] = [];

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

/** Leader trước, giữ thứ tự API trong từng nhóm (leader / non-leader). */
function orderTeamMembersForDisplay(
  members: CompanyAssignmentListItem['team']['members'] | undefined
) {
  const list = members ?? [];
  return [...list.filter(m => m.isLeader), ...list.filter(m => !m.isLeader)];
}

function memberTooltipItems(
  members: CompanyAssignmentListItem['team']['members'] | undefined,
  teamName?: string | null
): AnimatedTooltipItem[] {
  const team = teamName?.trim() || 'Đội';
  return orderTeamMembersForDisplay(members).map((member, index) => {
    const memberName = member.fullName.trim() || 'Thành viên';
    return {
      id: index + 1,
      name: team,
      designation: member.isLeader ? `Trưởng nhóm: ${memberName}` : memberName,
      image: member.avatarUrl?.trim() || undefined,
      initials: getInitials(memberName),
      fallbackClassName:
        AVATAR_PALETTE[hashIndex(member.userId, AVATAR_PALETTE.length)] ??
        'bg-muted text-foreground',
    };
  });
}

/** Board: 2 (xs) / 3 (sm+) / 4 (lg+) — tránh che cột hạn xử lý. */
function useBoardAvatarMaxVisible(): number {
  return useSyncExternalStore(
    onStoreChange => {
      const mqSm = window.matchMedia('(min-width: 640px)');
      const mqLg = window.matchMedia('(min-width: 1024px)');
      mqSm.addEventListener('change', onStoreChange);
      mqLg.addEventListener('change', onStoreChange);
      return () => {
        mqSm.removeEventListener('change', onStoreChange);
        mqLg.removeEventListener('change', onStoreChange);
      };
    },
    () => {
      if (window.matchMedia('(min-width: 1024px)').matches) return 4;
      if (window.matchMedia('(min-width: 640px)').matches) return 3;
      return 2;
    },
    () => 3
  );
}

function TeamMemberAvatarStack({
  members,
  teamName,
  avatarClassName,
  maxVisible,
}: {
  members: CompanyAssignmentListItem['team']['members'] | undefined;
  teamName?: string | null;
  avatarClassName: string;
  maxVisible: number;
}) {
  const items = memberTooltipItems(members, teamName);
  if (items.length === 0) {
    return <span className="truncate text-[9px] text-muted-foreground">Chưa có thành viên</span>;
  }
  return (
    <AnimatedTooltip
      items={items}
      avatarClassName={avatarClassName}
      maxVisible={maxVisible}
      groupLabel={teamName?.trim() || undefined}
      className="max-w-full"
    />
  );
}

function asSeverityLevel(severity: CompanyQueueSeverity): CompanySeverityLevel {
  return (COMPANY_SEVERITIES as readonly string[]).includes(severity)
    ? (severity as CompanySeverityLevel)
    : 'Low';
}

function severityLabelVi(severity: CompanyQueueSeverity): string {
  const level = asSeverityLevel(severity);
  return SEVERITY_LABEL[level] ?? queueSeverityLabel(severity);
}

function asTrackingReportStatus(status: string): CompanyTrackingReportStatus | null {
  const normalized = normalizeReportStatus(status);
  if (normalized === 'InProgress' || normalized === 'Resolved') return normalized;
  return null;
}

function trackingReportStatusLabel(status: string): string {
  const key = asTrackingReportStatus(status);
  return key ? reportStatusLabelVi(key) : reportStatusLabelVi(status);
}

function trackingReportStatusBadgeClass(status: string): string {
  const key = asTrackingReportStatus(status);
  if (key) return REPORT_STATUS_BADGE_CLASSES[key];
  return 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80';
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

const SEVERITY_DOT_CLASS: Record<CompanySeverityLevel, string> = {
  Low: 'bg-slate-400',
  Medium: 'bg-amber-400',
  High: 'bg-orange-500',
  Critical: 'bg-red-500',
};

const SEVERITY_CHIP_CLASS: Record<CompanySeverityLevel, string> = {
  Low: 'bg-slate-100 text-slate-700',
  Medium: 'bg-amber-50 text-amber-800',
  High: 'bg-orange-50 text-orange-800',
  Critical: 'bg-red-50 text-red-700',
};

function getDeadlineInfo(slaIso: string | null | undefined): DeadlineInfo {
  if (!slaIso) return { label: 'Chưa có hạn', tone: 'safe' };

  const due = new Date(slaIso).getTime();
  if (Number.isNaN(due)) return { label: 'Chưa có hạn', tone: 'safe' };

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

function formatSlaDateTime(slaIso: string): string {
  return new Date(slaIso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSlaDate(slaIso: string | null | undefined): string {
  if (!slaIso) return '—';
  const d = new Date(slaIso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

function collectThumbnailUrls(
  item: CompanyAssignmentListItem,
  thumbnailMap: Map<string, string>
): string[] {
  const urls: string[] = [];
  const push = (url: string | null | undefined) => {
    const trimmed = url?.trim();
    if (trimmed && !urls.includes(trimmed)) urls.push(trimmed);
  };

  push(item.report.thumbnailUrl);
  for (const img of item.report.reportImages ?? []) {
    push(img.url);
  }
  push(thumbnailMap.get(item.report.reportId));

  return urls;
}

// ─── View mode toggle ───────────────────────────────────────────────────────

function CompanyViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: CompanyViewMode;
  onViewModeChange: (mode: CompanyViewMode) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        title="Board"
        aria-pressed={viewMode === 'board'}
        onClick={() => onViewModeChange('board')}
        className={COMPANY_VIEW_TOGGLE_CLASS(viewMode === 'board')}
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        type="button"
        title="Danh sách"
        aria-pressed={viewMode === 'list'}
        onClick={() => onViewModeChange('list')}
        className={COMPANY_VIEW_TOGGLE_CLASS(viewMode === 'list')}
      >
        <List className="size-4" />
      </button>
    </div>
  );
}

// ─── Board / list cards ────────────────────────────────────────────────────

function ReportThumbStrip({
  urls,
  alt,
  className,
  aspectClassName = 'aspect-2/1',
  eagerFirstImage = false,
}: {
  urls: string[];
  alt: string;
  className?: string;
  aspectClassName?: string;
  eagerFirstImage?: boolean;
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
        <ImageIcon className="size-3.5 opacity-40" aria-hidden />
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
          loading={eagerFirstImage ? 'eager' : 'lazy'}
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
        <Image
          src={thumbs[0]!}
          alt={alt}
          fill
          sizes="18vw"
          className="object-cover"
          loading={eagerFirstImage ? 'eager' : 'lazy'}
          unoptimized
        />
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

function ProjectCard({
  item,
  thumbnailUrls,
  eagerFirstImage = false,
}: {
  item: CompanyAssignmentListItem;
  thumbnailUrls: string[];
  eagerFirstImage?: boolean;
}) {
  const progress = Math.max(0, Math.min(100, Math.round(item.progressPercent ?? 0)));
  const title = item.report.categoryName;
  const meta = item.report.address?.trim() || item.report.code;
  const severity = asSeverityLevel(item.report.severity);
  const slaDateLabel = formatSlaDate(item.report.slaResolveDueAt);
  const slaDeadline = getDeadlineInfo(item.report.slaResolveDueAt);
  const slaTooltipDesignation = item.report.slaResolveDueAt
    ? `${formatSlaDateTime(item.report.slaResolveDueAt)} · ${slaDeadline.label}`
    : 'Chưa có hạn xử lý';
  const statusLabel = trackingReportStatusLabel(item.report.status);
  const statusBadgeClass = trackingReportStatusBadgeClass(item.report.status);
  const avatarMaxVisible = useBoardAvatarMaxVisible();

  return (
    <Card className="h-full overflow-hidden border-border/50 bg-card shadow-none transition-colors group-hover:bg-card">
      <div className="relative shrink-0">
        <ReportThumbStrip
          urls={thumbnailUrls}
          alt={item.report.code}
          eagerFirstImage={eagerFirstImage}
        />
        <span
          className={cn(
            'absolute right-2 top-2 inline-flex max-w-[76%] items-center truncate rounded-full px-2 py-0.5 text-[9px] font-semibold shadow-sm backdrop-blur-sm',
            statusBadgeClass
          )}
          title={statusLabel}
        >
          <span className="truncate">{statusLabel}</span>
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2.5">
        <div className="min-w-0">
          <div
            className="mb-0.5 mt-0.5 flex items-center gap-1.5 py-0"
            title={`Mức độ: ${severityLabelVi(item.report.severity)}`}
          >
            <span
              className={cn('size-1.5 shrink-0 rounded-full', SEVERITY_DOT_CLASS[severity])}
              aria-hidden
            />
            <span
              className={cn(
                'text-[9px] font-medium',
                severity === 'Low' && 'text-slate-600',
                severity === 'Medium' && 'text-amber-700',
                severity === 'High' && 'text-orange-700',
                severity === 'Critical' && 'text-red-700'
              )}
            >
              {severityLabelVi(item.report.severity)}
            </span>
          </div>
          <CardTitle className="line-clamp-1 text-xs font-semibold leading-snug" title={title}>
            {title}
          </CardTitle>
          <CardDescription className="mt-1 line-clamp-1 text-[10px]" title={meta}>
            {meta}
          </CardDescription>
        </div>

        <div className="mt-0.5">
          <div className="mb-1 flex items-center justify-between text-[10px]">
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
            className="min-w-0 flex-1 overflow-hidden"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            <TeamMemberAvatarStack
              members={item.team.members}
              teamName={item.team.teamName}
              avatarClassName={BOARD_TEAM_AVATAR_SIZE_CLASS}
              maxVisible={avatarMaxVisible}
            />
          </div>
          <AnimatedHoverTooltip
            name="Hạn xử lý"
            designation={slaTooltipDesignation}
            className="shrink-0"
          >
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-muted-foreground">
              <FontAwesomeIcon
                icon={faCalendar}
                className="size-3 text-muted-foreground/80"
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

function TeamAvatar({ item }: { item: CompanyAssignmentListItem }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      className="min-w-0 max-w-36 overflow-hidden"
    >
      <TeamMemberAvatarStack
        members={item.team.members}
        teamName={item.team.teamName}
        avatarClassName="size-7"
        maxVisible={4}
      />
    </div>
  );
}

function ProjectListRow({
  item,
  thumbnailUrls,
  onOpen,
}: {
  item: CompanyAssignmentListItem;
  thumbnailUrls: string[];
  onOpen: () => void;
}) {
  const progress = Math.max(0, Math.min(100, Math.round(item.progressPercent ?? 0)));
  const deadline = getDeadlineInfo(item.report.slaResolveDueAt);
  const title = item.report.address?.trim() || item.report.code;
  const thumb = thumbnailUrls.find(Boolean);
  const severity = asSeverityLevel(item.report.severity);
  const teamName = item.team.teamName?.trim();
  const statusLabel = trackingReportStatusLabel(item.report.status);
  const statusBadgeClass = trackingReportStatusBadgeClass(item.report.status);

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
            className={cn('size-1.5 shrink-0 rounded-full', SEVERITY_DOT_CLASS[severity])}
            aria-hidden
          />
          <p className="truncate text-sm font-semibold text-foreground" title={title}>
            {title}
          </p>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {item.report.categoryName}
          <span className="mx-1 text-border">·</span>
          <span className="font-mono">#{item.report.code}</span>
        </p>
      </div>

      <span
        className={cn(
          'hidden shrink-0 items-center truncate rounded-full px-2 py-0.5 text-[10px] font-semibold md:inline-flex',
          statusBadgeClass
        )}
        title={statusLabel}
      >
        {statusLabel}
      </span>

      <span
        className={cn(
          'hidden shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium lg:inline-flex',
          SEVERITY_CHIP_CLASS[severity]
        )}
      >
        {severityLabelVi(item.report.severity)}
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

      <div className="hidden items-center lg:flex">
        {teamName ? (
          <TeamAvatar item={item} />
        ) : (
          <span className="text-[10px] text-muted-foreground">Chưa có đội</span>
        )}
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
    <div className={COMPANY_BOARD_GRID_CLASS}>
      {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map(k => (
        <div
          key={k}
          className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card"
        >
          <div className="aspect-2/1 animate-pulse bg-muted/40" />
          <div className="flex flex-col gap-1.5 p-2.5">
            <div className="h-2 w-1/3 animate-pulse rounded bg-muted/40" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted/40" />
            <div className="h-2 w-full animate-pulse rounded bg-muted/30" />
          </div>
        </div>
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

interface CompanyTrackingListTabProps {
  onSelectReport: (reportId: string) => void;
}

export function CompanyTrackingListTab({ onSelectReport }: CompanyTrackingListTabProps) {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<CompanyViewMode>('board');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | CompanySeverityLevel>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<
    'all' | (typeof COMPANY_ASSIGNMENT_STATUSES)[number]
  >('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | CompanyTrackingReportStatus>(
    'all'
  );
  const [teamIdFilter, setTeamIdFilter] = useState<'all' | string>('all');
  const [dateRange, setDateRange] = useState<CompanyTrackingDateRangeValue>({ preset: 'all' });

  const pageSize = viewMode === 'board' ? COMPANY_BOARD_PAGE_SIZE : COMPANY_LIST_PAGE_SIZE;

  const handleViewModeChange = (mode: CompanyViewMode) => {
    setViewMode(mode);
    setPage(1);
  };

  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const isSearchPending = search.trim() !== debouncedSearch;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleSeverityChange = (value: 'all' | CompanySeverityLevel) => {
    setSeverityFilter(value);
    setPage(1);
  };
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };
  const handleAssignmentStatusChange = (
    value: 'all' | (typeof COMPANY_ASSIGNMENT_STATUSES)[number]
  ) => {
    setAssignmentStatusFilter(value);
    setPage(1);
  };
  const handleReportStatusChange = (value: 'all' | CompanyTrackingReportStatus) => {
    setReportStatusFilter(value);
    setPage(1);
  };
  const handleTeamIdChange = (value: 'all' | string) => {
    setTeamIdFilter(value);
    setPage(1);
  };

  const handleDateRangeChange = (next: CompanyTrackingDateRangeValue) => {
    setDateRange(next);
    setPage(1);
  };

  const hasActiveFilters =
    search.trim().length > 0 ||
    dateRange.preset !== 'all' ||
    Boolean(dateRange.fromDate || dateRange.toDate) ||
    categoryFilter !== 'all' ||
    severityFilter !== 'all' ||
    assignmentStatusFilter !== 'all' ||
    reportStatusFilter !== 'all' ||
    teamIdFilter !== 'all';

  const handleClearAllFilters = () => {
    setSearch('');
    setDateRange({ preset: 'all' });
    setCategoryFilter('all');
    setSeverityFilter('all');
    setAssignmentStatusFilter('all');
    setReportStatusFilter('all');
    setTeamIdFilter('all');
    setPage(1);
  };

  const { data: catalogCategories = [] } = useCatalogPollutionCategories();
  const { options: teamOptions } = useCompanyTeamOptions();

  const { data, isLoading, isError } = useCompanyAssignments({
    page,
    pageSize,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(assignmentStatusFilter !== 'all' ? { status: assignmentStatusFilter } : {}),
    ...(reportStatusFilter !== 'all' ? { reportStatus: reportStatusFilter } : {}),
    ...(severityFilter !== 'all' ? { severity: severityFilter } : {}),
    ...(categoryFilter !== 'all' ? { categoryId: categoryFilter } : {}),
    ...(teamIdFilter !== 'all' ? { teamId: teamIdFilter } : {}),
    ...(dateRange.fromDate ? { fromDate: dateRange.fromDate } : {}),
    ...(dateRange.toDate ? { toDate: dateRange.toDate } : {}),
    sortBy: 'assignedAt',
    sortDesc: true,
  });

  const apiItems = useMemo(() => data?.items ?? EMPTY_ITEMS, [data?.items]);
  const items = useMemo(
    () =>
      apiItems.filter(item => {
        const normalized = normalizeReportStatus(item.report.status);
        if (normalized !== 'InProgress' && normalized !== 'Resolved') return false;
        if (reportStatusFilter === 'all') return true;
        return normalized === reportStatusFilter;
      }),
    [apiItems, reportStatusFilter]
  );
  const thumbnailMap = useCompanyAssignmentThumbnails(items);

  const totalPages = Math.max(1, data?.pagination.totalPages ?? 1);

  const categoryFilterLabel =
    categoryFilter === 'all'
      ? 'Loại ô nhiễm'
      : (catalogCategories.find(cat => cat.id === categoryFilter)?.nameVi ?? 'Loại ô nhiễm');
  const severityFilterLabel = severityFilter === 'all' ? 'Mức độ' : SEVERITY_LABEL[severityFilter];
  const assignmentFilterLabel =
    assignmentStatusFilter === 'all'
      ? 'Trạng thái đội'
      : assignmentStatusLabel(assignmentStatusFilter);
  const reportStatusFilterLabel =
    reportStatusFilter === 'all' ? 'Trạng thái báo cáo' : reportStatusLabelVi(reportStatusFilter);
  const teamFilterLabel =
    teamIdFilter === 'all' ? 'Đội' : (teamOptions.find(t => t.id === teamIdFilter)?.name ?? 'Đội');

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 py-3 sm:gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
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

              <CompanyTrackingDateRangePicker value={dateRange} onChange={handleDateRangeChange} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
                    {reportStatusFilterLabel}
                    <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleReportStatusChange('all')}
                    className={reportStatusFilter === 'all' ? 'font-medium text-brand' : ''}
                  >
                    Trạng thái báo cáo
                  </DropdownMenuItem>
                  {COMPANY_TRACKING_REPORT_STATUSES.map(status => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => handleReportStatusChange(status)}
                      className={reportStatusFilter === status ? 'font-medium text-brand' : ''}
                    >
                      {reportStatusLabelVi(status)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
                {COMPANY_SEVERITIES.map(level => (
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
                  {teamFilterLabel}
                  <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem
                  onClick={() => handleTeamIdChange('all')}
                  className={teamIdFilter === 'all' ? 'font-medium text-brand' : ''}
                >
                  Đội
                </DropdownMenuItem>
                {teamOptions.map(team => (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => handleTeamIdChange(team.id)}
                    className={teamIdFilter === team.id ? 'font-medium text-brand' : ''}
                  >
                    {team.name}
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
                {COMPANY_ASSIGNMENT_STATUSES.map(status => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleAssignmentStatusChange(status)}
                    className={assignmentStatusFilter === status ? 'font-medium text-brand' : ''}
                  >
                    {assignmentStatusLabel(status)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className={cn(
                  'cursor-pointer shrink-0 text-[0.8125rem] font-medium text-slate-500',
                  'transition-[font-weight,color]',
                  'hover:font-bold hover:text-slate-800',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-1'
                )}
              >
                Xóa tất cả
              </button>
            ) : null}
          </div>

          <div className="shrink-0 self-start">
            <CompanyViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-2 sm:p-3">
          {isError ? (
            <div className="flex h-full items-center justify-center text-destructive">
              Không thể tải dữ liệu. Vui lòng thử lại.
            </div>
          ) : viewMode === 'board' ? (
            isLoading ? (
              <SkeletonGrid />
            ) : items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <SaveIcon size={32} className="opacity-30" />
                <p>Chưa có task phân công nào.</p>
              </div>
            ) : (
              <HoverEffect
                layoutId="company-tracking-hover"
                className={COMPANY_BOARD_GRID_CLASS}
                items={items.map((item, index) => {
                  const title = item.report.address?.trim() || item.report.code;
                  const description = [
                    item.report.categoryName,
                    severityLabelVi(item.report.severity),
                    `#${item.report.code}`,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  const thumbnailUrls = collectThumbnailUrls(item, thumbnailMap);
                  return {
                    // assignmentId — 1 report có thể có nhiều assignment (reassign / Declined)
                    key: item.assignmentId || `${item.report.reportId}-${index}`,
                    title,
                    description,
                    onClick: () => onSelectReport(item.report.reportId),
                    content: (
                      <ProjectCard
                        item={item}
                        thumbnailUrls={thumbnailUrls}
                        eagerFirstImage={index === 0}
                      />
                    ),
                  };
                })}
              />
            )
          ) : isLoading ? (
            <SkeletonList />
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <SaveIcon size={32} className="opacity-30" />
              <p>Chưa có task phân công nào.</p>
            </div>
          ) : (
            <section className="flex flex-col gap-2">
              {items.map((item, index) => (
                <ProjectListRow
                  key={item.assignmentId || `${item.report.reportId}-${index}`}
                  item={item}
                  thumbnailUrls={collectThumbnailUrls(item, thumbnailMap)}
                  onOpen={() => onSelectReport(item.report.reportId)}
                />
              ))}
            </section>
          )}
        </div>

        {data?.pagination ? (
          <div className="relative flex shrink-0 items-center justify-center">
            <PaginationSimple
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mx-auto w-auto justify-center"
            />
            <p className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-slate-500 tabular-nums">
              {data.pagination.totalItems.toLocaleString('vi-VN')} báo cáo
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
