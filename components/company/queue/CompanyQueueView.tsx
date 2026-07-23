'use client';

import { CompanyAssignTeamDialog } from '@/components/company/queue/CompanyAssignTeamDialog';
import { useCompanyQueue } from '@/hooks/useCompany';
import type { CompanyQueueItem } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import {
  formatCompanyDate,
  formatQueueRelativeTime,
  isSlaUrgent,
  queueSeverityClasses,
  queueSeverityLabel,
} from '@/utils/companyUi';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Inbox,
  Loader2,
  MapPin,
  Tag,
  Timer,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

type SeverityFilter = '' | 'Low' | 'Medium' | 'High' | 'Critical';

const PAGE_SIZE = 20;

const SEVERITY_OPTIONS: { value: SeverityFilter; label: string; rail: string }[] = [
  { value: '', label: 'Tất cả', rail: 'bg-emerald-500' },
  { value: 'Critical', label: 'Nghiêm trọng', rail: 'bg-red-500' },
  { value: 'High', label: 'Cao', rail: 'bg-orange-500' },
  { value: 'Medium', label: 'TB', rail: 'bg-lime-500' },
  { value: 'Low', label: 'Thấp', rail: 'bg-emerald-400' },
];

function severityRailClass(severity: string): string {
  const found = SEVERITY_OPTIONS.find(o => o.value === severity);
  return found?.rail ?? 'bg-muted';
}

export function CompanyQueueView() {
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<SeverityFilter>('');
  const [assignTarget, setAssignTarget] = useState<CompanyQueueItem | null>(null);

  const { data, isPending, isError, refetch } = useCompanyQueue({
    page,
    pageSize: PAGE_SIZE,
    ...(severity ? { severity } : {}),
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const total = pagination?.totalItems ?? 0;

  return (
    <div className="relative space-y-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700/70">
            Vận hành
          </p>
          <h1 className="text-xl font-bold tracking-tight text-emerald-950 dark:text-foreground">
            Hàng đợi điều phối
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Báo cáo Verified đã được LEO chuyển đến công ty — chọn đội để bắt đầu xử lý.
          </p>
        </div>
        <p className="text-3xl font-bold tabular-nums text-emerald-700">
          {isPending ? '—' : total}
          <span className="ml-2 text-sm font-normal text-muted-foreground">task</span>
        </p>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="flex shrink-0 gap-1 overflow-x-auto lg:w-36 lg:flex-col lg:overflow-visible">
          {SEVERITY_OPTIONS.map(opt => (
            <button
              key={opt.value || 'all'}
              type="button"
              onClick={() => {
                setSeverity(opt.value);
                setPage(1);
              }}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition whitespace-nowrap',
                severity === opt.value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-900 dark:hover:bg-muted'
              )}
            >
              <span className={cn('size-1.5 shrink-0 rounded-full', opt.rail)} aria-hidden />
              {opt.label}
            </button>
          ))}
        </aside>

        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
          {isPending ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Đang tải…
            </div>
          ) : isError ? (
            <div className="flex items-start gap-3 p-6 text-sm">
              <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />
              <div className="space-y-3">
                <p className="font-semibold text-destructive">Không tải được hàng đợi</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-300 dark:bg-muted">
                <Inbox className="size-8" aria-hidden />
              </div>
              <p className="font-medium">Hàng đợi trống</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Khi LEO điều phối báo cáo, chúng sẽ hiện ở đây theo mức độ ưu tiên.
              </p>
            </div>
          ) : (
            <ul className="space-y-3 p-3 sm:p-4">
              {items.map(item => (
                <QueueTaskRow
                  key={item.reportId}
                  item={item}
                  onAssign={() => setAssignTarget(item)}
                />
              ))}
            </ul>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-emerald-50 px-4 py-3 text-sm dark:border-border">
              <p className="text-muted-foreground">
                {pagination.page}/{pagination.totalPages} · {pagination.totalItems} báo cáo
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="rounded-lg p-2 hover:bg-emerald-50 disabled:opacity-30 dark:hover:bg-muted"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-lg p-2 hover:bg-emerald-50 disabled:opacity-30 dark:hover:bg-muted"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CompanyAssignTeamDialog
        open={Boolean(assignTarget)}
        reportId={assignTarget?.reportId ?? null}
        reportCode={assignTarget?.code ?? ''}
        onClose={() => setAssignTarget(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

function QueueTaskRow({ item, onAssign }: { item: CompanyQueueItem; onAssign: () => void }) {
  const urgent = isSlaUrgent(item.slaResolveDueAt);

  return (
    <li className="group relative overflow-hidden rounded-xl border border-[#e8e8e8] bg-[#fffdfc] transition hover:border-emerald-200 hover:shadow-[0_4px_16px_-8px_rgb(16_185_129/25%)] dark:border-border dark:bg-card">
      <div
        className={cn('absolute inset-y-0 left-0 w-1', severityRailClass(item.severity))}
        aria-hidden
      />

      <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold tracking-tight text-emerald-950 dark:text-foreground">
              {item.code}
            </span>
            <Badge
              variant="secondary"
              className={cn('border-0 font-semibold', queueSeverityClasses(item.severity))}
            >
              {queueSeverityLabel(item.severity)}
            </Badge>
            {urgent && (
              <Badge
                variant="destructive"
                className="gap-1 border-0 bg-red-100 font-bold uppercase tracking-wide text-red-800 hover:bg-red-100"
              >
                <Timer className="size-3" aria-hidden />
                SLA gấp
              </Badge>
            )}
          </div>

          <div className="flex items-start gap-2">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-emerald-700/70 dark:text-emerald-400"
              aria-hidden
            />
            <p className="text-sm font-medium leading-snug text-foreground">{item.address}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <MetaChip icon={Tag} label={item.categoryName} />
            <MetaChip icon={MapPin} label={`Phường ${item.wardCode}`} />
            <MetaChip icon={Clock3} label={formatQueueRelativeTime(item.dispatchedAt)} />
            <MetaChip
              icon={Timer}
              label={`SLA ${formatCompanyDate(item.slaResolveDueAt)}`}
              emphasize={urgent}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center sm:self-center">
          <button
            type="button"
            onClick={onAssign}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
          >
            <UserPlus className="size-4" aria-hidden />
            Phân công
          </button>
        </div>
      </div>
    </li>
  );
}

function MetaChip({
  icon: Icon,
  label,
  emphasize = false,
}: {
  icon: typeof Tag;
  label: string;
  emphasize?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs',
        emphasize
          ? 'border-red-200 bg-red-50 font-semibold text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
          : 'border-[#e8e8e8] bg-muted/40 text-muted-foreground dark:border-border'
      )}
    >
      <Icon className="size-3 shrink-0 opacity-80" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}
