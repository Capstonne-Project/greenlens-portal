'use client';

import { CompanyStatusBadge } from '@/components/company/CompanyStatusBadge';
import { useCompanyOverviewPage } from '@/hooks/useCompanyOverviewPage';
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
  const { isFetching: dashFetching, refetch: refetchDash } = useCompanyOverviewPage(dateParams);

  const isFetching = companyFetching || dashFetching;
  const hasQueue = typeof queueCount === 'number' && queueCount > 0;

  if (!company) {
    return <div className="h-11 min-w-0 flex-1 animate-pulse rounded-lg bg-muted" aria-hidden />;
  }

  const initials = companyInitials(company.name);

  return (
    <div className="grid min-w-0 flex-1 grid-cols-1 items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-4">
      <div className="flex min-w-0 items-center gap-2.5 md:gap-3 lg:justify-self-start">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white sm:size-11 sm:text-sm"
          aria-hidden
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {company.name}
            </p>
            <CompanyStatusBadge
              status={company.status}
              className="shrink-0 px-2.5 py-0.5 text-xs sm:text-sm"
            />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
            {company.departmentName} · MST {company.taxCode} · Thành lập{' '}
            {formatCompanyDate(company.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex justify-center lg:justify-self-center" role="presentation">
        <div
          className="flex shrink-0 rounded-lg border border-border bg-muted/30 p-1"
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
                'rounded-md px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 sm:py-2 sm:text-sm',
                datePreset === option.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end lg:justify-self-end">
        <button
          type="button"
          onClick={() => {
            void refetchCompany();
            refetchDash();
          }}
          disabled={isFetching}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold transition hover:bg-muted disabled:opacity-60 sm:h-10 sm:text-sm"
          aria-label="Làm mới"
        >
          <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} aria-hidden />
          <span>Làm mới</span>
        </button>
        <Link
          href="/company/queue"
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition sm:h-10 sm:text-sm',
            hasQueue
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'border border-border bg-background text-foreground hover:bg-muted'
          )}
        >
          <ClipboardList className="size-4" aria-hidden />
          {hasQueue ? `${queueCount} hàng đợi` : 'Hàng đợi'}
        </Link>
      </div>
    </div>
  );
}
