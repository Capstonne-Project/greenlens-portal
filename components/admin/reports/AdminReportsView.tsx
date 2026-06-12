'use client';

import { AdminReportDetailPanel } from '@/components/admin/reports/AdminReportDetailPanel';
import { ReportSeverityBars } from '@/components/admin/reports/ReportSeverityBars';
import { ReportStatusBadge } from '@/components/admin/reports/ReportStatusBadge';
import { useAdminReportsList, usePollutionCategories } from '@/hooks/useAdminReports';
import { ADMIN_REPORT_PAGE_SIZE, ADMIN_REPORT_STATUS_TABS } from '@/lib/constants/adminReports';
import type { AdminReportListItem } from '@/lib/api/models/adminReport';
import { OPEN_REPORT_STATUSES } from '@/utils/adminOverview';
import { formatReportRelativeTime, reportListTitle } from '@/utils/adminReportUi';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileWarning,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

function categoryInitial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

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

  const subtitleParts = [
    'Báo cáo',
    pagination ? `${pagination.totalItems.toLocaleString('vi-VN')} tổng` : '…',
    `Trang ${pagination?.page ?? page}${pagination ? ` / ${pagination.totalPages}` : ''}`,
  ];

  const openDetail = (item: AdminReportListItem) => {
    setDetailListItem(item);
    setDetailId(item.id);
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <p className="border-b border-border pb-6 text-sm text-muted-foreground">
        {subtitleParts.join(' · ')}
        {pagination && (
          <>
            {' '}
            · {openOnPage} đang mở (trang) · {submittedOnPage} chờ xác minh (trang)
          </>
        )}
      </p>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Tổng báo cáo',
            value: pagination ? pagination.totalItems.toLocaleString('vi-VN') : '—',
            hint: 'Toàn hệ thống',
            ring: 100,
          },
          {
            label: 'Đang mở (trang)',
            value: String(openOnPage),
            hint: 'Đã gửi → đang xử lý (chưa đóng)',
            ring: items.length ? Math.round((openOnPage / items.length) * 100) : 0,
          },
          {
            label: 'Chờ xác minh (trang)',
            value: String(submittedOnPage),
            hint: 'Trạng thái đã gửi',
            ring: items.length ? Math.round((submittedOnPage / items.length) * 100) : 0,
          },
          {
            label: 'Ẩn danh (trang)',
            value: String(anonymousOnPage),
            hint: 'Theo dữ liệu trang hiện tại',
            ring: items.length ? Math.round((anonymousOnPage / items.length) * 100) : 0,
          },
        ].map(card => (
          <article
            key={card.label}
            className="rounded-card border border-border bg-card p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                <p className="mt-1 text-xs text-emerald-800/90">{card.hint}</p>
              </div>
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50 text-[11px] font-bold text-emerald-800"
                aria-hidden
              >
                {card.ring}%
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-4 shadow-sm">
        <form
          onSubmit={e => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const q = String(formData.get('q') ?? '').trim();
            setQuery({ search: q || null, page: '1' });
          }}
          className="flex min-w-[220px] flex-1 flex-wrap items-center gap-2"
        >
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={searchQ}
              placeholder="Mã, tiêu đề, khu vực, người gửi..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              aria-label="Tìm báo cáo"
            />
          </div>
          <button
            type="submit"
            className="h-10 shrink-0 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Tìm
          </button>

          <select
            value={categoryId}
            onChange={e => setQuery({ categoryId: e.target.value || null, page: '1' })}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            aria-label="Loại ô nhiễm"
          >
            <option value="">Loại: Tất cả</option>
            {(categories ?? []).map(c => (
              <option key={c.id} value={c.id}>
                {c.nameVi}
              </option>
            ))}
          </select>

          <input
            type="text"
            defaultValue={provinceCode}
            placeholder="Mã tỉnh"
            onBlur={e => setQuery({ provinceCode: e.target.value.trim() || null, page: '1' })}
            className="h-10 w-28 rounded-lg border border-input bg-background px-3 text-sm"
            aria-label="Mã tỉnh"
          />
          <input
            type="text"
            defaultValue={wardCode}
            placeholder="Mã phường"
            onBlur={e => setQuery({ wardCode: e.target.value.trim() || null, page: '1' })}
            className="h-10 w-28 rounded-lg border border-input bg-background px-3 text-sm"
            aria-label="Mã phường"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
            <AlertTriangle className="size-3.5" aria-hidden />
            AI gắn cờ: —
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
            Ẩn danh:{' '}
            {pagination && items.length
              ? `${Math.round((anonymousOnPage / items.length) * 100)}%`
              : '—'}
          </span>
          <button
            type="button"
            disabled
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground"
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

      {isError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          Không tải được danh sách báo cáo.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Thử lại
          </button>
          {error instanceof Error && (
            <span className="mt-1 block text-xs opacity-80">{error.message}</span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-card border border-border bg-card shadow-sm">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground">
              <th className="w-10 px-3 py-3">
                <input type="checkbox" className="rounded border-input" aria-label="Chọn tất cả" />
              </th>
              <th className="px-4 py-3 font-medium">Báo cáo</th>
              <th className="px-4 py-3 font-medium">Loại</th>
              <th className="px-4 py-3 font-medium">Mức độ</th>
              <th className="px-4 py-3 font-medium">Khu vực</th>
              <th className="px-4 py-3 font-medium">Người gửi</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">AI</th>
              <th className="px-4 py-3 font-medium">Nhận</th>
              <th className="px-4 py-3 text-right font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isPending &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={10} className="px-4 py-4">
                    <div className="h-10 animate-pulse rounded-lg bg-muted" />
                  </td>
                </tr>
              ))}
            {!isPending &&
              items.map(report => (
                <tr
                  key={report.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-3">
                    <input type="checkbox" className="rounded border-input" aria-label="Chọn" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-sm font-bold text-emerald-900"
                        aria-hidden
                      >
                        {categoryInitial(report.categoryName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{reportListTitle(report)}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {report.code}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-3 text-muted-foreground">
                    {report.categoryName}
                  </td>
                  <td className="px-4 py-3">
                    <ReportSeverityBars severity={report.severity} />
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-muted-foreground">
                    {report.address || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {report.isAnonymous ? (
                      <span className="text-amber-800">Ẩn danh</span>
                    ) : (
                      <span className="truncate">Người gửi #{report.reporterCount}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ReportStatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
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
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatReportRelativeTime(report.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
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
                  </td>
                </tr>
              ))}
            {!isPending && items.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                  Không có báo cáo phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Hiển thị {(pagination.page - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} /{' '}
            {pagination.totalItems.toLocaleString('vi-VN')} báo cáo
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrev}
              onClick={() => setQuery({ page: String(pagination.page - 1) })}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
              Trước
            </button>
            <span className="text-sm tabular-nums text-muted-foreground">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNext}
              onClick={() => setQuery({ page: String(pagination.page + 1) })}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
            >
              Sau
              <ChevronRight className="size-4" />
            </button>
            <Link
              href={`${pathname}?${(() => {
                const u = new URLSearchParams(searchParams.toString());
                u.set('page', String(pagination.totalPages));
                return u.toString();
              })()}`}
              className="text-sm text-emerald-800 underline-offset-4 hover:underline"
            >
              Trang cuối ({pagination.totalPages})
            </Link>
          </div>
        </div>
      )}

      <AdminReportDetailPanel
        reportId={detailId}
        listItem={detailListItem}
        onClose={() => {
          setDetailId(null);
          setDetailListItem(null);
        }}
      />
    </div>
  );
}
