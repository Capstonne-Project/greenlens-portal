'use client';

/**
 * Company Manager — lịch sử hợp đồng công ty (read-only).
 * Flat / open layout (ui-ux-pro-max): section headings + dividers, không card viền.
 * Data: GET /v1/companies/my/contract-history — chỉ field API.
 * Page title/subtitle do company shell (companyPageMeta) — không lặp lại ở đây.
 */

import { Skeleton } from '@/components/ui/skeleton';
import { useMyCompanyContractHistory } from '@/hooks/useCompany';
import type { CompanyContractPeriod } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import { contractTypeLabel, formatCompanyDate, formatCompanyDateTime } from '@/utils/companyUi';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarRange,
  Clock,
  FileText,
  RefreshCw,
  ScrollText,
  UserRound,
} from 'lucide-react';
import { type ReactNode } from 'react';

type DerivedStatus = 'Active' | 'Upcoming' | 'Expired';

type ContractLife = {
  status: DerivedStatus;
  progressPct: number;
  label: string;
};

const MS_DAY = 86_400_000;

const STATUS_LABEL: Record<DerivedStatus, string> = {
  Active: 'Đang hiệu lực',
  Upcoming: 'Sắp hiệu lực',
  Expired: 'Hết hạn',
};

function deriveStatus(startIso: string, endIso: string, now = Date.now()): DerivedStatus {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 'Expired';
  if (now < start) return 'Upcoming';
  if (now >= start && now <= end) return 'Active';
  return 'Expired';
}

function computeContractLife(startIso: string, endIso: string, now = Date.now()): ContractLife {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const status = deriveStatus(startIso, endIso, now);

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return { status: 'Expired', progressPct: 0, label: 'Không xác định thời hạn' };
  }

  if (status === 'Upcoming') {
    const days = Math.max(1, Math.ceil((start - now) / MS_DAY));
    return {
      status,
      progressPct: 0,
      label: days === 1 ? 'Bắt đầu sau 1 ngày' : `Bắt đầu sau ${days} ngày`,
    };
  }

  if (status === 'Expired') {
    const overdue = Math.max(0, Math.ceil((now - end) / MS_DAY));
    return {
      status,
      progressPct: 100,
      label: overdue <= 1 ? 'Đã hết hạn' : `Hết hạn ${overdue} ngày trước`,
    };
  }

  const span = Math.max(1, end - start);
  const progressPct = Math.min(100, Math.max(0, ((now - start) / span) * 100));
  const daysLeft = Math.max(1, Math.ceil((end - now) / MS_DAY));
  return {
    status,
    progressPct,
    label: daysLeft === 1 ? 'Còn 1 ngày đến hạn' : `Còn ${daysLeft} ngày đến hạn`,
  };
}

function sortPeriodsNewestFirst(periods: CompanyContractPeriod[]): CompanyContractPeriod[] {
  return [...periods].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}

function pickCurrentPeriod(periods: CompanyContractPeriod[]): CompanyContractPeriod | null {
  if (periods.length === 0) return null;
  const active = periods.find(p => deriveStatus(p.startDate, p.endDate) === 'Active');
  if (active) return active;
  const upcoming = periods.find(p => deriveStatus(p.startDate, p.endDate) === 'Upcoming');
  if (upcoming) return upcoming;
  return periods[0] ?? null;
}

function StatusBadge({ status }: { status: DerivedStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        status === 'Active' && 'bg-emerald-50 text-emerald-800',
        status === 'Upcoming' && 'bg-sky-50 text-sky-800',
        status === 'Expired' && 'bg-slate-100 text-slate-600'
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'Active' && 'bg-emerald-500',
          status === 'Upcoming' && 'bg-sky-500',
          status === 'Expired' && 'bg-slate-400'
        )}
        aria-hidden
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  headerRight,
  className,
}: {
  title: string;
  icon: typeof CalendarRange;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Icon className="size-4 shrink-0 text-slate-500" aria-hidden />
          {title}
        </h2>
        {headerRight}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-1.5 text-sm font-semibold text-slate-900 wrap-break-word',
          mono && 'font-mono'
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CompanySummary({ companyName, companyId }: { companyName: string; companyId: string }) {
  return (
    <Section title="Công ty" icon={Building2}>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Tên công ty</p>
          <p className="mt-1.5 text-base font-semibold text-slate-900 wrap-break-word">
            {companyName || '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Mã công ty</p>
          <p
            className="mt-1.5 font-mono text-[11px] leading-relaxed text-slate-400 wrap-break-all"
            title={companyId}
          >
            {companyId || '—'}
          </p>
        </div>
      </div>
    </Section>
  );
}

function CurrentContract({ period }: { period: CompanyContractPeriod }) {
  const life = computeContractLife(period.startDate, period.endDate);

  return (
    <Section
      title="Kỳ hợp đồng hiện tại"
      icon={FileText}
      headerRight={<StatusBadge status={life.status} />}
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <Field label="Số hợp đồng" value={period.contractNumber} mono />
        <Field label="Loại hợp đồng" value={contractTypeLabel(period.contractType)} />
        <Field label="Ngày bắt đầu" value={formatCompanyDate(period.startDate)} />
        <Field label="Ngày kết thúc" value={formatCompanyDate(period.endDate)} />
      </div>
    </Section>
  );
}

function ContractDuration({ period }: { period: CompanyContractPeriod }) {
  const life = computeContractLife(period.startDate, period.endDate);
  const showProgress = life.status === 'Active';

  return (
    <Section title="Thời hạn hợp đồng" icon={CalendarRange}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:gap-6">
        <div>
          <p className="text-xs font-medium text-slate-500">Ngày bắt đầu</p>
          <p className="mt-1.5 text-base font-semibold tabular-nums text-slate-900">
            {formatCompanyDate(period.startDate)}
          </p>
        </div>
        <div className="hidden pb-1 sm:block" aria-hidden>
          <ArrowRight className="size-4 text-slate-300" />
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium text-slate-500">Ngày kết thúc</p>
          <p className="mt-1.5 text-base font-semibold tabular-nums text-slate-900">
            {formatCompanyDate(period.endDate)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
        {showProgress ? (
          <div
            className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={Math.round(life.progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tiến độ thời hạn hợp đồng"
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${life.progressPct}%` }}
            />
          </div>
        ) : (
          <div
            className={cn(
              'h-1.5 min-w-0 flex-1 rounded-full',
              life.status === 'Expired' ? 'bg-slate-200' : 'bg-sky-100'
            )}
            aria-hidden
          />
        )}
        <p
          className={cn(
            'flex shrink-0 items-center gap-1.5 text-sm font-medium',
            life.status === 'Expired' ? 'text-slate-500' : 'text-slate-700'
          )}
        >
          <Clock className="size-4 shrink-0" aria-hidden />
          {life.label}
        </p>
      </div>
    </Section>
  );
}

function PeriodHistoryItem({
  period,
  isCurrent,
  isLast,
}: {
  period: CompanyContractPeriod;
  isCurrent: boolean;
  isLast: boolean;
}) {
  const life = computeContractLife(period.startDate, period.endDate);
  const note = period.note?.trim() || null;
  const renewedBy = period.renewedByName?.trim() || null;

  return (
    <li className="relative flex gap-3 sm:gap-4">
      <div className="flex w-4 shrink-0 flex-col items-center pt-5">
        <span
          className={cn(
            'size-2.5 shrink-0 rounded-full ring-4 ring-[hsl(var(--background))]',
            isCurrent ? 'bg-brand' : 'bg-slate-300'
          )}
          aria-hidden
        />
        {!isLast ? <span className="mt-1 w-px flex-1 bg-slate-200" aria-hidden /> : null}
      </div>

      <article
        className={cn(
          'mb-3 min-w-0 flex-1 rounded-xl border bg-white p-4 sm:p-5',
          isLast && 'mb-0',
          isCurrent ? 'border-brand/25' : 'border-slate-200'
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-mono text-sm font-semibold text-slate-900">
                {period.contractNumber}
              </h3>
              <StatusBadge status={life.status} />
              {isCurrent ? (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                  Hiện tại
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-700">{contractTypeLabel(period.contractType)}</p>
          </div>
          <p className="text-xs tabular-nums text-slate-500">
            {formatCompanyDateTime(period.createdAt)}
          </p>
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
          <CalendarRange className="size-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="tabular-nums">{formatCompanyDate(period.startDate)}</span>
          <ArrowRight className="size-3.5 shrink-0 text-slate-300" aria-hidden />
          <span className="tabular-nums">{formatCompanyDate(period.endDate)}</span>
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <UserRound className="size-3.5" aria-hidden />
              Gia hạn bởi
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">{renewedBy ?? '—'}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock className="size-3.5" aria-hidden />
              Thời điểm ghi nhận
            </p>
            <p className="mt-1 text-sm font-medium tabular-nums text-slate-900">
              {formatCompanyDateTime(period.createdAt)}
            </p>
          </div>
        </div>

        {note ? (
          <div className="mt-4 rounded-lg bg-slate-50 px-3.5 py-3">
            <p className="text-xs font-medium text-slate-500">Ghi chú gia hạn</p>
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
              {note}
            </p>
          </div>
        ) : null}
      </article>
    </li>
  );
}

function ContractHistoryList({
  periods,
  currentId,
}: {
  periods: CompanyContractPeriod[];
  currentId: string | null;
}) {
  return (
    <Section
      title="Các kỳ hợp đồng"
      icon={ScrollText}
      headerRight={<span className="text-xs font-medium text-slate-500">{periods.length} kỳ</span>}
    >
      <ol>
        {periods.map((period, index) => (
          <PeriodHistoryItem
            key={period.id}
            period={period}
            isCurrent={period.id === currentId}
            isLast={index === periods.length - 1}
          />
        ))}
      </ol>
    </Section>
  );
}

const PAGE_PAD = 'px-4 pb-10 sm:px-6 md:px-6 lg:px-8';

function PageSkeleton() {
  return (
    <div className={cn('space-y-8', PAGE_PAD)} aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="space-y-4">
            <Skeleton className="h-4 w-44" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-4 border-t border-slate-100 pt-8">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
        <div className="space-y-4 lg:border-l lg:border-slate-100 lg:pl-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-48 max-w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="space-y-4 border-t border-slate-100 pt-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

export function CompanyContractHistoryView() {
  const { data, isPending, isError, refetch } = useMyCompanyContractHistory();

  if (isPending) return <PageSkeleton />;

  if (isError) {
    return (
      <div className={cn('flex items-start gap-3 py-2 text-sm', PAGE_PAD)} role="alert">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-red-700">Không tải được lịch sử hợp đồng</p>
            <p className="mt-1 text-slate-600">
              Không thể lấy thông tin hợp đồng của công ty. Vui lòng thử lại.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md px-0 py-1 text-slate-700 underline-offset-4 transition-colors duration-200 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <RefreshCw className="size-4" aria-hidden />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const companyName = data?.companyName?.trim() || '';
  const companyId = data?.companyId?.trim() || '';
  const periods = sortPeriodsNewestFirst(data?.periods ?? []);
  const current = pickCurrentPeriod(periods);

  if (periods.length === 0 || !current) {
    return (
      <div className={cn('space-y-8', PAGE_PAD)}>
        {(companyName || companyId) && (
          <div className="max-w-md">
            <CompanySummary companyName={companyName} companyId={companyId} />
          </div>
        )}
        <div className="flex flex-col items-start gap-3 border-t border-slate-100 py-10">
          <FileText className="size-8 text-slate-300" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Chưa có kỳ hợp đồng</p>
            <p className="max-w-md text-sm text-slate-500">
              Hiện chưa có kỳ hợp đồng nào cho công ty này.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', PAGE_PAD)}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <CurrentContract period={current} />
          <div className="border-t border-slate-100 pt-8">
            <ContractDuration period={current} />
          </div>
        </div>
        <div className="lg:border-l lg:border-slate-100 lg:pl-8">
          <CompanySummary companyName={companyName} companyId={companyId} />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-8">
        <ContractHistoryList periods={periods} currentId={current.id} />
      </div>
    </div>
  );
}
