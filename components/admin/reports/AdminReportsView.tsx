'use client';

import { ValidatedInput, ValidatedSearchInput } from '@/components/common/ValidatedField';
import { AdminReportDetailPanel } from '@/components/admin/reports/AdminReportDetailPanel';
import { AdminReportHideDialog } from '@/components/admin/reports/AdminReportHideDialog';
import { AdminReportSummaryStrip } from '@/components/admin/reports/AdminReportSummaryStrip';
import { ReportSeverityBars } from '@/components/admin/reports/ReportSeverityBars';
import { ReportStatusBadge } from '@/components/admin/reports/ReportStatusBadge';
import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
  ADMIN_TABLE_PAGINATION_FOOTER,
  ADMIN_TABLE_PAGINATION_META,
  adminTableCellPad,
} from '@/components/admin/shared/adminDataTableChrome';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAdminReportsList,
  usePollutionCategories,
  useUnhideAdminReport,
} from '@/hooks/useAdminReports';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ADMIN_REPORT_PAGE_SIZE, ADMIN_REPORT_STATUS_TABS } from '@/lib/constants/adminReports';
import { SEARCH_INPUT_MAX_LENGTH } from '@/lib/validation/formDefaults';
import type { AdminReportListItem } from '@/lib/api/models/adminReport';
import {
  isAdminReportMarkedHidden,
  markAdminReportHidden,
  markAdminReportVisible,
} from '@/lib/storage/adminHiddenReports';
import { cn } from '@/lib/utils';
import { OPEN_REPORT_STATUSES } from '@/utils/adminOverview';
import { getAdminReportMutationError } from '@/utils/adminReportErrors';
import { formatReportRelativeTime, reportListTitle } from '@/utils/adminReportUi';
import { Download, Eye, EyeOff, FileWarning, Loader2, MoreHorizontal, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

function categoryInitial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

type AdminColumnKey =
  | 'report'
  | 'category'
  | 'severity'
  | 'address'
  | 'reporter'
  | 'status'
  | 'ai'
  | 'received'
  | 'actions';

const FIRST_COL: AdminColumnKey = 'report';
const LAST_COL: AdminColumnKey = 'actions';

const COLUMN_DEFS: { key: AdminColumnKey; label: string; className?: string }[] = [
  { key: 'report', label: 'Báo cáo', className: 'w-[22%]' },
  { key: 'category', label: 'Loại', className: 'w-[10%]' },
  { key: 'severity', label: 'Mức độ', className: 'w-[8%]' },
  { key: 'address', label: 'Khu vực', className: 'w-[14%]' },
  { key: 'reporter', label: 'Người gửi', className: 'w-[10%]' },
  { key: 'status', label: 'Trạng thái', className: 'w-[10%]' },
  { key: 'ai', label: 'AI', className: 'w-[8%]' },
  { key: 'received', label: 'Nhận', className: 'w-[8%]' },
  { key: 'actions', label: 'Hành động', className: 'w-[14%]' },
];

function colPad(key: AdminColumnKey, layer: 'head' | 'body' = 'body') {
  const position = key === FIRST_COL ? 'first' : key === LAST_COL ? 'last' : 'middle';
  return adminTableCellPad(position, layer);
}

/** Local draft + debounce; remount via `key={searchQ}` when URL search changes. */
function AdminReportsSearchField({
  searchQ,
  onCommit,
}: {
  searchQ: string;
  onCommit: (trimmed: string) => void;
}) {
  const [searchInput, setSearchInput] = useState(searchQ);

  useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS, value => {
    const next = value.trim();
    if (next === searchQ.trim()) return;
    onCommit(next);
  });

  return (
    <div className="relative min-w-[12rem] flex-1">
      <Search className="pointer-events-none absolute left-3 top-[13px] z-10 size-4 text-muted-foreground" />
      <ValidatedSearchInput
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        maxLength={SEARCH_INPUT_MAX_LENGTH}
        placeholder="Mã, tiêu đề, khu vực, người gửi..."
        className="pl-9"
        aria-label="Tìm báo cáo"
      />
    </div>
  );
}

function AdminReportsLocationFields({
  provinceCode,
  wardCode,
  onCommit,
}: {
  provinceCode: string;
  wardCode: string;
  onCommit: (next: { provinceCode: string | null; wardCode: string | null }) => void;
}) {
  const [province, setProvince] = useState(provinceCode);
  const [ward, setWard] = useState(wardCode);

  return (
    <>
      <ValidatedInput
        type="text"
        value={province}
        onChange={e => setProvince(e.target.value)}
        onBlur={() =>
          onCommit({
            provinceCode: province.trim() || null,
            wardCode: ward.trim() || null,
          })
        }
        minLength={0}
        maxLength={10}
        placeholder="Mã tỉnh"
        className="h-10 w-24 shrink-0"
        aria-label="Mã tỉnh"
      />
      <ValidatedInput
        type="text"
        value={ward}
        onChange={e => setWard(e.target.value)}
        onBlur={() =>
          onCommit({
            provinceCode: province.trim() || null,
            wardCode: ward.trim() || null,
          })
        }
        minLength={0}
        maxLength={12}
        placeholder="Mã phường"
        className="h-10 w-28 shrink-0"
        aria-label="Mã phường"
      />
    </>
  );
}

type RenderAdminCellCtx = {
  hidden: boolean;
  unhiding: boolean;
  onUnhide: (report: AdminReportListItem) => void;
  setHideTarget: (report: AdminReportListItem | null) => void;
  openDetail: (item: AdminReportListItem) => void;
};

export function AdminReportsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const searchQ = searchParams.get('search') ?? '';
  const statusTab = searchParams.get('tab') ?? 'all';
  const categoryId = searchParams.get('categoryId') ?? '';
  const wardCode = searchParams.get('wardCode') ?? '';
  const provinceCode = searchParams.get('provinceCode') ?? '';

  const activeTab =
    ADMIN_REPORT_STATUS_TABS.find(t => t.id === statusTab) ?? ADMIN_REPORT_STATUS_TABS[0];

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailListItem, setDetailListItem] = useState<AdminReportListItem | null>(null);
  /** Optimistic + session — BE có thể không trả `isHidden`. */
  const [hiddenOverride, setHiddenOverride] = useState<Record<string, boolean>>({});
  const [hideTarget, setHideTarget] = useState<AdminReportListItem | null>(null);
  const unhideReport = useUnhideAdminReport();

  const isReportHidden = useCallback(
    (report: AdminReportListItem) => {
      if (report.id in hiddenOverride) return hiddenOverride[report.id];
      if (report.isHidden) return true;
      return isAdminReportMarkedHidden(report.id);
    },
    [hiddenOverride]
  );

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: ADMIN_REPORT_PAGE_SIZE,
      ...(searchQ.trim() ? { search: searchQ.trim() } : {}),
      ...(activeTab.status ? { status: activeTab.status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(wardCode.trim() ? { wardCode: wardCode.trim() } : {}),
      ...(provinceCode.trim() ? { provinceCode: provinceCode.trim() } : {}),
    }),
    [page, searchQ, activeTab.status, categoryId, wardCode, provinceCode]
  );

  const { data, isPending, isError, error, refetch } = useAdminReportsList(queryParams);
  const { data: categories } = usePollutionCategories();

  const setQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      });
      router.push(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const openOnPage = items.filter(r => OPEN_REPORT_STATUSES.includes(r.status)).length;
  const submittedOnPage = items.filter(r => r.status === 'Submitted').length;
  const anonymousOnPage = items.filter(r => r.isAnonymous).length;

  const openDetail = (item: AdminReportListItem) => {
    setDetailListItem(item);
    setDetailId(item.id);
  };

  const onUnhide = (report: AdminReportListItem) => {
    unhideReport.mutate(report.id, {
      onSuccess: env => {
        markAdminReportVisible(report.id);
        setHiddenOverride(prev => ({ ...prev, [report.id]: false }));
        toast.success(env.message || 'Đã hiện lại báo cáo.');
      },
      onError: err => toast.error(getAdminReportMutationError(err, 'Không thể hiện lại báo cáo.')),
    });
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="rounded-card border border-border bg-card p-4 shadow-sm">
        <AdminReportSummaryStrip
          totalItems={pagination?.totalItems ?? null}
          openOnPage={openOnPage}
          submittedOnPage={submittedOnPage}
          anonymousOnPage={anonymousOnPage}
          className="mb-3"
        />

        <div className="flex flex-wrap items-center gap-2">
          <AdminReportsSearchField
            key={searchQ}
            searchQ={searchQ}
            onCommit={next => setQuery({ search: next || null, page: '1' })}
          />

          <Select
            value={categoryId || 'all'}
            onValueChange={v => setQuery({ categoryId: v === 'all' ? null : v, page: '1' })}
          >
            <SelectTrigger
              className="h-10 w-[11.5rem] shrink-0 rounded-lg"
              aria-label="Loại ô nhiễm"
            >
              <SelectValue placeholder="Loại: Tất cả" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value="all">Loại: Tất cả</SelectItem>
              {(categories ?? []).map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nameVi}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <AdminReportsLocationFields
            key={`${provinceCode}|${wardCode}`}
            provinceCode={provinceCode}
            wardCode={wardCode}
            onCommit={({ provinceCode: p, wardCode: w }) =>
              setQuery({ provinceCode: p, wardCode: w, page: '1' })
            }
          />

          <button
            type="button"
            disabled
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground"
          >
            <Download className="size-4" />
            Xuất CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {ADMIN_REPORT_STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setQuery({ tab: tab.id === 'all' ? null : tab.id, page: '1' })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              statusTab === tab.id || (statusTab === '' && tab.id === 'all')
                ? 'bg-emerald-600/15 text-emerald-900'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={ADMIN_TABLE_SHELL}>
        <div className={ADMIN_TABLE_SCROLL}>
          <Table className={ADMIN_TABLE_CLASS}>
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}>
                {COLUMN_DEFS.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      colPad(col.key, 'head'),
                      ADMIN_TABLE_HEAD_CELL,
                      col.key === LAST_COL && 'text-right',
                      col.className
                    )}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">Không tải được danh sách báo cáo.</p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                    {error instanceof Error && (
                      <span className="mt-1 block text-xs text-slate-500">{error.message}</span>
                    )}
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <SaveIcon size={32} className="opacity-30" />
                      <span>Không có báo cáo phù hợp.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(report => {
                  const hidden = isReportHidden(report);
                  const unhiding = unhideReport.isPending && unhideReport.variables === report.id;
                  const ctx: RenderAdminCellCtx = {
                    hidden,
                    unhiding,
                    onUnhide,
                    setHideTarget,
                    openDetail,
                  };

                  return (
                    <TableRow
                      key={report.id}
                      className={cn(
                        ADMIN_TABLE_ROW_BORDER,
                        'transition-[opacity,filter]',
                        hidden
                          ? 'bg-muted/50 opacity-60 grayscale hover:opacity-75'
                          : 'hover:bg-sky-50/40'
                      )}
                    >
                      {COLUMN_DEFS.map(col => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            colPad(col.key, 'body'),
                            'align-middle',
                            col.className,
                            col.key === LAST_COL && 'text-right',
                            (col.key === 'category' || col.key === 'address') &&
                              'max-w-0 overflow-hidden'
                          )}
                        >
                          {renderAdminCell(col.key, report, ctx)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className={ADMIN_TABLE_PAGINATION_FOOTER}>
            {pagination.totalPages > 1 ? (
              <PaginationSimple
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={p => setQuery({ page: String(p) })}
                className="w-auto"
              />
            ) : null}
            <p className={ADMIN_TABLE_PAGINATION_META}>
              {pagination.totalItems.toLocaleString('vi-VN')} rows
            </p>
          </div>
        ) : null}
      </div>

      <AdminReportDetailPanel
        reportId={detailId}
        listItem={
          detailListItem
            ? {
                ...detailListItem,
                isHidden: isReportHidden(detailListItem),
              }
            : null
        }
        onClose={() => {
          setDetailId(null);
          setDetailListItem(null);
        }}
        onHiddenChange={(id, hidden) => setHiddenOverride(prev => ({ ...prev, [id]: hidden }))}
      />

      <AdminReportHideDialog
        reportId={hideTarget?.id ?? null}
        reportCode={hideTarget?.code}
        open={hideTarget != null}
        onClose={() => setHideTarget(null)}
        onHidden={() => {
          if (!hideTarget) return;
          markAdminReportHidden(hideTarget.id);
          setHiddenOverride(prev => ({ ...prev, [hideTarget.id]: true }));
        }}
      />
    </div>
  );
}

function renderAdminCell(
  key: AdminColumnKey,
  report: AdminReportListItem,
  ctx: RenderAdminCellCtx
) {
  const { hidden, unhiding, onUnhide, setHideTarget, openDetail } = ctx;

  switch (key) {
    case 'report':
      return (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
              hidden ? 'bg-muted text-muted-foreground' : 'bg-emerald-600/10 text-emerald-900'
            )}
            aria-hidden
          >
            {categoryInitial(report.categoryName)}
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                'truncate font-semibold',
                hidden ? 'text-muted-foreground' : 'text-foreground'
              )}
            >
              {reportListTitle(report)}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {report.code}
              {hidden ? ' · Đã ẩn' : ''}
            </p>
          </div>
        </div>
      );
    case 'category':
      return (
        <span
          className="block truncate text-muted-foreground"
          title={report.categoryName || undefined}
        >
          {report.categoryName || '—'}
        </span>
      );
    case 'severity':
      return <ReportSeverityBars severity={report.severity} />;
    case 'address': {
      const address = report.address?.trim() || '';
      if (!address) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="block truncate text-muted-foreground" title={address}>
          {address}
        </span>
      );
    }
    case 'reporter':
      return (
        <span className="text-muted-foreground">
          {report.isAnonymous ? (
            <span className="text-amber-800">Ẩn danh</span>
          ) : (
            <span className="truncate">Người gửi #{report.reporterCount}</span>
          )}
        </span>
      );
    case 'status':
      return <ReportStatusBadge status={report.status} />;
    case 'ai':
      return (
        <span className="text-xs text-muted-foreground">
          {report.status === 'Duplicate' ? (
            <span className="text-amber-700">Trùng?</span>
          ) : report.reopenedCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-red-700">
              <FileWarning className="size-3.5" />
              Bất thường
            </span>
          ) : (
            '—'
          )}
        </span>
      );
    case 'received':
      return (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatReportRelativeTime(report.createdAt)}
        </span>
      );
    case 'actions':
      return (
        <div className="inline-flex items-center gap-1">
          {hidden ? (
            <button
              type="button"
              onClick={() => onUnhide(report)}
              disabled={unhiding}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
            >
              {unhiding ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Eye className="size-3.5" aria-hidden />
              )}
              Hiện lại
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setHideTarget(report)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              <EyeOff className="size-3.5" aria-hidden />
              Ẩn
            </button>
          )}
          <button
            type="button"
            onClick={() => openDetail(report)}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Chi tiết
          </button>
          <Link
            href={`/admin/reports/${report.id}`}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Mở trang chi tiết"
          >
            <MoreHorizontal className="size-4" />
          </Link>
        </div>
      );
  }
}
