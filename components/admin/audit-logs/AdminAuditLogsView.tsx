'use client';

import { useAuditLogsList } from '@/hooks/useAuditLogs';
import type { AuditLogPagination, AuditLogsListParams } from '@/lib/api/models/auditLog';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, AUDIT_LOGS_PAGE_SIZE } from '@/lib/constants/auditLogs';
import { cn } from '@/lib/utils';
import {
  formatActorLabel,
  formatAuditDateTime,
  getAuditActionBadgeClass,
  truncateUserAgent,
} from '@/utils/auditLogUi';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  RotateCcw,
  ScrollText,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const EMPTY_PAGINATION: AuditLogPagination = {
  page: 1,
  pageSize: AUDIT_LOGS_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

export function AdminAuditLogsView() {
  const [page, setPage] = useState(1);
  const [actorId, setActorId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const params = useMemo<AuditLogsListParams>(
    () => ({
      page,
      pageSize: AUDIT_LOGS_PAGE_SIZE,
      ...(actorId.trim() ? { actorId: actorId.trim() } : {}),
      ...(entityType ? { entityType } : {}),
      ...(action ? { action } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }),
    [action, actorId, entityType, fromDate, page, toDate]
  );

  const listQuery = useAuditLogsList(params);
  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? EMPTY_PAGINATION;

  const resetToFirstPage = () => setPage(1);

  const resetFilters = () => {
    setActorId('');
    setEntityType('');
    setAction('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const errorMessage =
    listQuery.error instanceof Error
      ? listQuery.error.message
      : 'Không tải được nhật ký kiểm toán.';

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Nhật ký kiểm toán bất biến, chỉ dùng để truy vết hành động quản trị và thay đổi hệ thống.
        </p>
      </header>

      <section className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-950">
          <Filter className="size-4 text-emerald-700" aria-hidden />
          Bộ lọc nhật ký
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_160px_150px_150px_auto] xl:items-end">
          <div className="space-y-2">
            <label htmlFor="audit-actor-filter" className="text-sm font-medium">
              Actor ID
            </label>
            <input
              id="audit-actor-filter"
              type="text"
              value={actorId}
              onChange={event => {
                setActorId(event.target.value);
                resetToFirstPage();
              }}
              placeholder="UUID / ID người dùng"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-entity-filter" className="text-sm font-medium">
              Entity
            </label>
            <select
              id="audit-entity-filter"
              value={entityType}
              onChange={event => {
                setEntityType(event.target.value);
                resetToFirstPage();
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              <option value="">Tất cả entity</option>
              {AUDIT_ENTITY_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-action-filter" className="text-sm font-medium">
              Action
            </label>
            <select
              id="audit-action-filter"
              value={action}
              onChange={event => {
                setAction(event.target.value);
                resetToFirstPage();
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              <option value="">Tất cả action</option>
              {AUDIT_ACTIONS.map(auditAction => (
                <option key={auditAction} value={auditAction}>
                  {auditAction}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-from-filter" className="text-sm font-medium">
              Từ ngày
            </label>
            <input
              id="audit-from-filter"
              type="date"
              value={fromDate}
              onChange={event => {
                setFromDate(event.target.value);
                resetToFirstPage();
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-to-filter" className="text-sm font-medium">
              Đến ngày
            </label>
            <input
              id="audit-to-filter"
              type="date"
              value={toDate}
              onChange={event => {
                setToDate(event.target.value);
                resetToFirstPage();
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 px-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50"
          >
            <RotateCcw className="size-4" aria-hidden />
            Đặt lại
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-emerald-50/50 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-emerald-950">Danh sách nhật ký kiểm toán</p>
          <p className="mt-1 text-xs text-emerald-900/65">
            Dữ liệu chỉ đọc, không hỗ trợ chỉnh sửa hoặc xoá để giữ nguyên tính toàn vẹn kiểm toán.
          </p>
        </div>

        {listQuery.isPending ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Đang tải nhật ký kiểm toán…
          </div>
        ) : null}

        {listQuery.isError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void listQuery.refetch()}
              className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : null}

        {!listQuery.isPending && !listQuery.isError && items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ScrollText className="size-6" aria-hidden />
            </div>
            <p className="text-sm font-medium text-foreground">
              Chưa có nhật ký kiểm toán phù hợp.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Hãy thử đổi bộ lọc hoặc mở rộng khoảng thời gian tra cứu.
            </p>
          </div>
        ) : null}

        {!listQuery.isPending && !listQuery.isError && items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Thời gian</th>
                    <th className="px-5 py-3 font-semibold">Người thực hiện</th>
                    <th className="px-5 py-3 font-semibold">Entity</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                    <th className="px-5 py-3 font-semibold">IP</th>
                    <th className="px-5 py-3 font-semibold">User agent</th>
                    <th className="px-5 py-3 text-right font-semibold">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map(item => (
                    <tr key={item.id} className="transition hover:bg-emerald-50/35">
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">
                          {formatAuditDateTime(item.createdAt)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-52 truncate font-semibold text-foreground">
                          {formatActorLabel(item)}
                        </p>
                        {item.actorId ? (
                          <p className="mt-1 max-w-52 truncate font-mono text-xs text-muted-foreground">
                            {item.actorId}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{item.entityType}</p>
                        <p className="mt-1 max-w-48 truncate font-mono text-xs text-muted-foreground">
                          {item.entityId ?? '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                            getAuditActionBadgeClass(item.action)
                          )}
                        >
                          {item.action}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                        {item.ipAddress ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {truncateUserAgent(item.userAgent)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/audit-logs/${item.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <Eye className="size-3.5" aria-hidden />
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                Trang {pagination.page}/{Math.max(1, pagination.totalPages)} ·{' '}
                <span className="font-medium text-foreground">
                  {items.length.toLocaleString('vi-VN')}
                </span>{' '}
                / {pagination.totalItems.toLocaleString('vi-VN')} nhật ký
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(current => Math.max(1, current - 1))}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" aria-hidden />
                  Trước
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(current => current + 1)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
                >
                  Sau
                  <ChevronRight className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
