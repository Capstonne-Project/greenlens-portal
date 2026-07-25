'use client';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useCompanyContractHistory } from '@/hooks/useCompany';
import type { CompanyContractPeriod } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import { contractTypeLabel, formatCompanyDate, formatCompanyDateTime } from '@/utils/companyUi';
import {
  AlertTriangle,
  Building2,
  CalendarRange,
  FileText,
  Loader2,
  RefreshCw,
  UserRound,
  X,
} from 'lucide-react';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <div className="text-sm font-semibold text-slate-900">{children}</div>
    </div>
  );
}

function PeriodDetailCard({
  period,
  isLatest,
}: {
  period: CompanyContractPeriod;
  isLatest: boolean;
}) {
  return (
    <article
      className={cn(
        'rounded-xl border bg-white p-4 sm:p-5',
        isLatest ? 'border-brand/40 shadow-sm ring-1 ring-brand/10' : 'border-slate-200'
      )}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-slate-900">{period.contractNumber}</h3>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
          {contractTypeLabel(period.contractType)}
        </span>
        {isLatest ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            Kỳ hiện tại / mới nhất
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Số hợp đồng">{period.contractNumber}</Field>
        <Field label="Loại hợp đồng">{contractTypeLabel(period.contractType)}</Field>
        <Field label="Ngày bắt đầu">{formatCompanyDate(period.startDate)}</Field>
        <Field label="Ngày kết thúc">{formatCompanyDate(period.endDate)}</Field>
        <Field label="Người gia hạn / ghi nhận">
          {period.renewedByName?.trim() ? (
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="size-3.5 text-slate-400" aria-hidden />
              {period.renewedByName}
            </span>
          ) : (
            '—'
          )}
        </Field>
        <Field label="Ghi nhận lúc">{formatCompanyDateTime(period.createdAt)}</Field>
      </div>

      {period.note?.trim() ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            Ghi chú
          </p>
          <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
            <FileText className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>{period.note}</span>
          </p>
        </div>
      ) : null}
    </article>
  );
}

interface CompanyContractHistoryDrawerProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyContractHistoryDrawer({
  companyId,
  open,
  onOpenChange,
}: CompanyContractHistoryDrawerProps) {
  const { data, isPending, isError, refetch, isFetching } = useCompanyContractHistory(
    companyId,
    open
  );

  const periods = data?.periods ?? [];
  const [latest, ...older] = periods;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full max-h-none flex-col bg-white data-[vaul-drawer-direction=right]:max-w-lg">
        <DrawerHeader className="flex flex-row items-start gap-3 space-y-0 border-b border-slate-100 px-5 py-4 text-left">
          <DrawerClose asChild>
            <button
              type="button"
              className="mt-0.5 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Đóng lịch sử hợp đồng"
            >
              <X className="size-4" aria-hidden />
            </button>
          </DrawerClose>
          <div className="min-w-0 flex-1">
            <DrawerTitle className="text-left text-lg">Lịch sử hợp đồng</DrawerTitle>
            <DrawerDescription className="mt-1 text-left">
              {data?.companyName
                ? `Các kỳ hợp đồng của ${data.companyName}`
                : 'Tất cả kỳ hợp đồng, sắp xếp mới nhất trước.'}
            </DrawerDescription>
          </div>
        </DrawerHeader>

        <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {data?.companyName ? (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Building2 className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{data.companyName}</p>
                <p className="text-xs text-slate-500">
                  {periods.length} kỳ hợp đồng
                  {isFetching && !isPending ? ' · Đang cập nhật…' : ''}
                </p>
              </div>
            </div>
          ) : null}

          {isPending ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-sm text-slate-500">
              <Loader2 className="size-6 animate-spin text-brand" aria-hidden />
              Đang tải lịch sử…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-red-100 bg-red-50/60 p-4 text-sm">
              <div className="flex items-start gap-2 text-red-700">
                <AlertTriangle className="size-5 shrink-0" aria-hidden />
                <p className="font-medium">Không tải được lịch sử hợp đồng</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 border-red-200 bg-white text-red-700 hover:bg-red-50"
                onClick={() => void refetch()}
              >
                <RefreshCw className="size-3.5" aria-hidden />
                Thử lại
              </Button>
            </div>
          ) : periods.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <CalendarRange className="size-10 text-slate-300" aria-hidden />
              <p className="text-sm font-medium text-slate-800">Chưa có kỳ hợp đồng nào</p>
              <p className="max-w-sm text-sm text-slate-500">
                Khi hợp đồng được tạo hoặc gia hạn, các kỳ sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {latest ? (
                <section className="space-y-3">
                  <h4 className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                    Chi tiết kỳ mới nhất
                  </h4>
                  <PeriodDetailCard period={latest} isLatest />
                </section>
              ) : null}

              {older.length > 0 ? (
                <section className="space-y-3 border-t border-slate-100 pt-5">
                  <h4 className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                    Các kỳ trước ({older.length})
                  </h4>
                  <ol className="space-y-3">
                    {older.map(period => (
                      <li key={period.id}>
                        <PeriodDetailCard period={period} isLatest={false} />
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-slate-100 bg-slate-50/80 px-5 py-4">
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full border-slate-200 bg-white"
            >
              Đóng
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
