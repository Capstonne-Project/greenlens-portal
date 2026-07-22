'use client';

import { useCompanyAssignments } from '@/hooks/useCompany';
import { REPORT_STATUSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import type { CompanyAssignmentListItem } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import {
  assignmentStatusClasses,
  assignmentStatusLabel,
  formatCompanyDate,
  formatCompanyDateTime,
  isSlaUrgent,
  queueSeverityClasses,
  queueSeverityLabel,
} from '@/utils/companyUi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Search,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const PAGE_SIZE = 20;

const ASSIGNMENT_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Assigned', label: 'Đã phân công' },
  { value: 'InProgress', label: 'Đang xử lý' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Declined', label: 'Từ chối' },
] as const;

const REPORT_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả báo cáo' },
  ...REPORT_STATUSES.filter(s =>
    ['Verified', 'Dispatched', 'Assigned', 'InProgress', 'Resolved', 'Closed'].includes(s)
  ).map(s => ({ value: s, label: reportStatusLabelVi(s) })),
];

interface CompanyAssignmentsTrackingTabProps {
  onSelectReport: (reportId: string) => void;
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums text-emerald-800">
        {pct}%
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof ClipboardList;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-emerald-100/80 bg-white p-4 shadow-sm dark:border-border dark:bg-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-950 dark:text-foreground">
            {value}
          </p>
        </div>
        <div className={cn('flex size-10 items-center justify-center rounded-md', accent)}>
          <Icon className="size-5 text-white" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function computeStats(items: CompanyAssignmentListItem[], total: number) {
  const inProgress = items.filter(
    i => i.assignmentStatus === 'Assigned' || i.assignmentStatus === 'InProgress'
  ).length;
  const completed = items.filter(i => i.assignmentStatus === 'Completed').length;
  const avgProgress =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.progressPercent, 0) / items.length)
      : 0;
  return { total, inProgress, completed, avgProgress };
}

export function CompanyAssignmentsTrackingTab({
  onSelectReport,
}: CompanyAssignmentsTrackingTabProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [reportStatus, setReportStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isPending, isError } = useCompanyAssignments({
    page,
    pageSize: PAGE_SIZE,
    ...(status ? { status } : {}),
    ...(reportStatus ? { reportStatus } : {}),
    ...(search ? { search } : {}),
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const pagination = data?.pagination;
  const stats = useMemo(
    () => computeStats(items, pagination?.totalItems ?? 0),
    [items, pagination?.totalItems]
  );

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng phân công"
          value={stats.total}
          icon={ClipboardList}
          accent="bg-emerald-600"
        />
        <StatCard
          label="Đang xử lý (trang)"
          value={stats.inProgress}
          icon={TrendingUp}
          accent="bg-emerald-500"
        />
        <StatCard
          label="Hoàn thành (trang)"
          value={stats.completed}
          icon={CheckCircle2}
          accent="bg-emerald-700"
        />
        <StatCard
          label="Tiến độ TB (trang)"
          value={`${stats.avgProgress}%`}
          icon={UsersRound}
          accent="bg-lime-600"
        />
      </div>

      <div className="rounded-lg border border-emerald-100/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="min-w-[160px]">
              <label
                htmlFor="assign-status"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Trạng thái phân công
              </label>
              <Select
                value={status || 'all'}
                onValueChange={v => {
                  setStatus(v === 'all' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  id="assign-status"
                  className="h-10 w-full rounded-lg"
                  aria-label="Trạng thái phân công"
                >
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {ASSIGNMENT_STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <label
                htmlFor="report-status"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Trạng thái báo cáo
              </label>
              <Select
                value={reportStatus || 'all'}
                onValueChange={v => {
                  setReportStatus(v === 'all' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  id="report-status"
                  className="h-10 w-full rounded-lg"
                  aria-label="Trạng thái báo cáo"
                >
                  <SelectValue placeholder="Tất cả báo cáo" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {REPORT_STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Mã báo cáo, địa chỉ, tên đội…"
                className="h-10 w-full rounded-lg border border-emerald-100 bg-white pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-border dark:bg-background"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="h-10 shrink-0 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Lọc
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Đang tải danh sách…
          </div>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-destructive">
            Không tải được danh sách phân công.
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="size-10 text-emerald-200" aria-hidden />
            <p className="text-sm text-muted-foreground">Chưa có task phân công nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-emerald-50 bg-emerald-50/60 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:border-border dark:bg-muted/40 dark:text-muted-foreground">
                  <th className="px-4 py-3">Báo cáo</th>
                  <th className="px-4 py-3">Đội</th>
                  <th className="px-4 py-3">Tiến độ</th>
                  <th className="px-4 py-3">Phân công</th>
                  <th className="px-4 py-3">Báo cáo</th>
                  <th className="px-4 py-3">SLA</th>
                  <th className="px-4 py-3">Phân công bởi</th>
                </tr>
              </thead>
              <tbody>
                {items.map(row => {
                  const slaUrgent = isSlaUrgent(row.report.slaResolveDueAt);
                  return (
                    <tr
                      key={row.assignmentId}
                      className="cursor-pointer border-b border-emerald-50/80 transition hover:bg-emerald-50/40 last:border-0 dark:border-border/60 dark:hover:bg-muted/30"
                      onClick={() => onSelectReport(row.report.reportId)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold text-emerald-800">
                          {row.report.code}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-muted-foreground">
                          {row.report.address}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              queueSeverityClasses(row.report.severity)
                            )}
                          >
                            {queueSeverityLabel(row.report.severity)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {row.report.categoryName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.team.teamName}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.team.memberCount} thành viên
                        </p>
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <ProgressBar value={row.progressPercent} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            assignmentStatusClasses(row.assignmentStatus)
                          )}
                        >
                          {assignmentStatusLabel(row.assignmentStatus)}
                        </span>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCompanyDateTime(row.assignedAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium">
                          {reportStatusLabelVi(row.report.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-xs font-medium',
                            slaUrgent ? 'text-red-600' : 'text-muted-foreground'
                          )}
                        >
                          {formatCompanyDate(row.report.slaResolveDueAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.assignedByName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-emerald-50 px-4 py-3 text-sm dark:border-border">
            <p className="text-muted-foreground">
              Trang {pagination.page} / {pagination.totalPages} · {pagination.totalItems} task
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrev}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 px-3 py-1.5 disabled:opacity-40 dark:border-border"
              >
                <ChevronLeft className="size-4" aria-hidden />
                Trước
              </button>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 px-3 py-1.5 disabled:opacity-40 dark:border-border"
              >
                Sau
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
