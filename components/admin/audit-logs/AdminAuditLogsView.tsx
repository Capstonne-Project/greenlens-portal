'use client';

import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
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
import { Eye, Filter, Loader2, RotateCcw } from 'lucide-react';
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
            <Select
              value={entityType || 'all'}
              onValueChange={v => {
                setEntityType(v === 'all' ? '' : v);
                resetToFirstPage();
              }}
            >
              <SelectTrigger id="audit-entity-filter" className="h-10 w-full rounded-lg">
                <SelectValue placeholder="Tất cả entity" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="all">Tất cả entity</SelectItem>
                {AUDIT_ENTITY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-action-filter" className="text-sm font-medium">
              Action
            </label>
            <Select
              value={action || 'all'}
              onValueChange={v => {
                setAction(v === 'all' ? '' : v);
                resetToFirstPage();
              }}
            >
              <SelectTrigger id="audit-action-filter" className="h-10 w-full rounded-lg">
                <SelectValue placeholder="Tất cả action" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="all">Tất cả action</SelectItem>
                {AUDIT_ACTIONS.map(auditAction => (
                  <SelectItem key={auditAction} value={auditAction}>
                    {auditAction}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      <div className={ADMIN_TABLE_SHELL}>
        <div className={ADMIN_TABLE_SCROLL}>
          <Table className={ADMIN_TABLE_CLASS}>
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}>
                <TableHead
                  className={cn(adminTableCellPad('first', 'head'), ADMIN_TABLE_HEAD_CELL)}
                >
                  Thời gian
                </TableHead>
                <TableHead
                  className={cn(adminTableCellPad('middle', 'head'), ADMIN_TABLE_HEAD_CELL)}
                >
                  Người thực hiện
                </TableHead>
                <TableHead
                  className={cn(adminTableCellPad('middle', 'head'), ADMIN_TABLE_HEAD_CELL)}
                >
                  Entity
                </TableHead>
                <TableHead
                  className={cn(adminTableCellPad('middle', 'head'), ADMIN_TABLE_HEAD_CELL)}
                >
                  Action
                </TableHead>
                <TableHead
                  className={cn(adminTableCellPad('middle', 'head'), ADMIN_TABLE_HEAD_CELL)}
                >
                  IP
                </TableHead>
                <TableHead
                  className={cn(adminTableCellPad('middle', 'head'), ADMIN_TABLE_HEAD_CELL)}
                >
                  User agent
                </TableHead>
                <TableHead
                  className={cn(
                    adminTableCellPad('last', 'head'),
                    ADMIN_TABLE_HEAD_CELL,
                    'text-right'
                  )}
                >
                  Chi tiết
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isPending ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={7} className="h-40 px-6 py-4 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-400" aria-hidden />
                  </TableCell>
                </TableRow>
              ) : listQuery.isError ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={7} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => void listQuery.refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={7} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <SaveIcon size={32} className="opacity-30" />
                      <span>Chưa có nhật ký kiểm toán phù hợp.</span>
                      <span className="text-xs">
                        Hãy thử đổi bộ lọc hoặc mở rộng khoảng thời gian tra cứu.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => (
                  <TableRow
                    key={item.id}
                    className={cn(ADMIN_TABLE_ROW_BORDER, 'transition hover:bg-sky-50/40')}
                  >
                    <TableCell className={cn(adminTableCellPad('first'), 'align-middle')}>
                      <p className="font-medium text-foreground">
                        {formatAuditDateTime(item.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className={cn(adminTableCellPad('middle'), 'align-middle')}>
                      <p className="max-w-52 truncate font-semibold text-foreground">
                        {formatActorLabel(item)}
                      </p>
                      {item.actorId ? (
                        <p className="mt-1 max-w-52 truncate font-mono text-xs text-muted-foreground">
                          {item.actorId}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className={cn(adminTableCellPad('middle'), 'align-middle')}>
                      <p className="font-medium text-foreground">{item.entityType}</p>
                      <p className="mt-1 max-w-48 truncate font-mono text-xs text-muted-foreground">
                        {item.entityId ?? '—'}
                      </p>
                    </TableCell>
                    <TableCell className={cn(adminTableCellPad('middle'), 'align-middle')}>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                          getAuditActionBadgeClass(item.action)
                        )}
                      >
                        {item.action}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        adminTableCellPad('middle'),
                        'align-middle font-mono text-xs text-muted-foreground'
                      )}
                    >
                      {item.ipAddress ?? '—'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        adminTableCellPad('middle'),
                        'align-middle text-xs text-muted-foreground'
                      )}
                    >
                      {truncateUserAgent(item.userAgent)}
                    </TableCell>
                    <TableCell className={cn(adminTableCellPad('last'), 'align-middle text-right')}>
                      <Link
                        href={`/admin/audit-logs/${item.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        <Eye className="size-3.5" aria-hidden />
                        Chi tiết
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
          <div className="min-w-0">
            {pagination.totalPages > 1 ? (
              <PaginationSimple
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                className="w-auto"
              />
            ) : null}
          </div>
          <p className="shrink-0 text-xs text-slate-500 tabular-nums">
            {pagination.totalItems.toLocaleString('vi-VN')} rows
          </p>
        </div>
      </div>
    </div>
  );
}
