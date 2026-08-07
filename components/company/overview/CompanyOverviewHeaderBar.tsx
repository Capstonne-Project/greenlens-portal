'use client';

import { CompanyStatusBadge } from '@/components/company/CompanyStatusBadge';
import { useCompanyOverview } from '@/hooks/useCompanyOverview';
import { useCompanyQueueCount, useMyCompany } from '@/hooks/useCompany';
import {
  COMPANY_OVERVIEW_DATE_PRESETS,
  useCompanyOverviewUiStore,
} from '@/lib/store/companyOverviewUiStore';
import { cn } from '@/lib/utils';
import { formatCompanyDate } from '@/utils/companyUi';
import { ClipboardList, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'CM';
}

/** Single-row company identity + filters — rendered inside CompanyTopHeader on `/company`. */
export function CompanyOverviewHeaderBar() {
  const datePreset = useCompanyOverviewUiStore(s => s.datePreset);
  const dateParams = useCompanyOverviewUiStore(s => s.dateParams);
  const setDatePreset = useCompanyOverviewUiStore(s => s.setDatePreset);

  const { data: company, isFetching: companyFetching, refetch: refetchCompany } = useMyCompany();
  const { data: queueCount } = useCompanyQueueCount();
  const { isFetching: dashFetching, refetch: refetchDash } = useCompanyOverview(dateParams);

  const isFetching = companyFetching || dashFetching;
  const hasQueue = typeof queueCount === 'number' && queueCount > 0;

  if (!company) {
    return <div className="h-9 min-w-0 flex-1 animate-pulse rounded-lg bg-muted" aria-hidden />;
  }

  const initials = companyInitials(company.name);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-[10px] font-bold text-white"
          aria-hidden
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              {company.name}
            </p>
            <CompanyStatusBadge status={company.status} className="shrink-0 scale-90" />
          </div>
          <p className="hidden truncate text-[10px] text-muted-foreground sm:block">
            {company.departmentName} · MST {company.taxCode} · Thành lập{' '}
            {formatCompanyDate(company.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 lg:shrink-0">
        <div
          className="flex shrink-0 rounded-lg border border-border bg-muted/30 p-0.5"
          role="radiogroup"
          aria-label="Khoảng thời gian"
        >
          {COMPANY_OVERVIEW_DATE_PRESETS.map(option => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={datePreset === option.value}
              onClick={() => setDatePreset(option.value)}
              className={cn(
                'rounded-md px-1.5 py-1 text-[10px] font-semibold transition md:px-2 md:text-[11px]',
                datePreset === option.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            void refetchCompany();
            refetchDash();
          }}
          disabled={isFetching}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[10px] font-semibold transition hover:bg-muted disabled:opacity-60 md:text-[11px]"
          aria-label="Làm mới"
        >
          <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} aria-hidden />
          <span className="hidden md:inline">Làm mới</span>
        </button>
        <Link
          href="/company/queue"
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold transition md:text-[11px]',
            hasQueue
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'border border-border bg-background text-foreground hover:bg-muted'
          )}
        >
          <ClipboardList className="size-3.5" aria-hidden />
          {hasQueue ? `${queueCount}` : 'Hàng đợi'}
        </Link>
      </div>
    </div>
  );
}
