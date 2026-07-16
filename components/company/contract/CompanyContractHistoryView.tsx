'use client';

import { useMyCompanyContractHistory } from '@/hooks/useCompany';
import { cn } from '@/lib/utils';
import { contractTypeLabel, formatCompanyDate, formatCompanyDateTime } from '@/utils/companyUi';
import {
  AlertTriangle,
  CalendarRange,
  FileText,
  Loader2,
  RefreshCw,
  ScrollText,
  UserRound,
} from 'lucide-react';

export function CompanyContractHistoryView() {
  const { data, isPending, isError, refetch } = useMyCompanyContractHistory();
  const periods = data?.periods ?? [];

  return (
    <div className="relative space-y-5">
      <div className="rounded-2xl border border-emerald-100/80 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <ScrollText className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">Lịch sử hợp đồng</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data?.companyName
                ? `Các kỳ hợp đồng của ${data.companyName}`
                : 'Theo dõi các kỳ hợp đồng đã ký và gia hạn với đơn vị quản lý.'}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Đang tải lịch sử…
          </div>
        ) : isError ? (
          <div className="flex items-start gap-3 p-6 text-sm">
            <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />
            <div className="space-y-3">
              <p className="font-semibold text-destructive">Không tải được lịch sử hợp đồng</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted"
              >
                <RefreshCw className="size-4" aria-hidden />
                Thử lại
              </button>
            </div>
          </div>
        ) : periods.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <CalendarRange className="size-10 text-emerald-200" aria-hidden />
            <p className="text-sm font-medium">Chưa có kỳ hợp đồng nào trong lịch sử</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Khi đơn vị quản lý gia hạn hoặc tái ký hợp đồng, các kỳ sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <ol className="divide-y divide-emerald-50 dark:divide-border">
            {periods.map((period, index) => (
              <li key={period.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                        index === 0
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-muted dark:text-foreground'
                      )}
                    >
                      {periods.length - index}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{period.contractNumber}</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                          {contractTypeLabel(period.contractType)}
                        </span>
                        {index === 0 && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                            Mới nhất
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarRange className="size-4 shrink-0" aria-hidden />
                        {formatCompanyDate(period.startDate)} → {formatCompanyDate(period.endDate)}
                      </p>
                      {period.renewedByName && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <UserRound className="size-4 shrink-0" aria-hidden />
                          Gia hạn bởi {period.renewedByName}
                        </p>
                      )}
                      {period.note?.trim() && (
                        <p className="flex items-start gap-2 text-sm">
                          <FileText
                            className="mt-0.5 size-4 shrink-0 text-emerald-600"
                            aria-hidden
                          />
                          <span className="text-muted-foreground">{period.note}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground sm:text-right">
                    Ghi nhận {formatCompanyDateTime(period.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
