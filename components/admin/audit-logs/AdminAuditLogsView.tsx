'use client';

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
import { AuditLogStatsPanel } from '@/components/admin/audit-logs/AuditLogStatsPanel';
import {
  AuditActorPicker,
  AuditEntityIdPicker,
} from '@/components/admin/audit-logs/AuditEntityPickers';
import { GreenLensLookupSpinner } from '@/components/ui/greenlens-lookup-spinner';
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
import { useAuditLogsExport, useAuditLogsList } from '@/hooks/useAuditLogs';
import type { AuditLogPagination, AuditLogsListParams } from '@/lib/api/models/auditLog';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  AUDIT_EXPORT_MAX_DAYS,
  AUDIT_LOGS_DEFAULT_PAGE_SIZE,
  AUDIT_LOGS_PAGE_SIZE_OPTIONS,
  type AuditLogsPageSize,
} from '@/lib/constants/auditLogs';
import { SYSTEM_ROLES } from '@/lib/constants/systemRoles';
import { cn } from '@/lib/utils';
import {
  formatActorLabel,
  formatAuditDateTime,
  getAuditActionBadgeClass,
  isAuditExportRangeValid,
  toUtcIsoEndOfDay,
  toUtcIsoStartOfDay,
  triggerBlobDownload,
  truncateUserAgent,
} from '@/utils/auditLogUi';
import { roleDisplayVi } from '@/utils/adminUserUi';
import { Download, Eye, Filter, Loader2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const EMPTY_PAGINATION: AuditLogPagination = {
  page: 1,
  pageSize: AUDIT_LOGS_DEFAULT_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

function parsePageSize(value: string | null): AuditLogsPageSize {
  const n = Number(value);
  if (AUDIT_LOGS_PAGE_SIZE_OPTIONS.includes(n as AuditLogsPageSize)) {
    return n as AuditLogsPageSize;
  }
  return AUDIT_LOGS_DEFAULT_PAGE_SIZE;
}

export function AdminAuditLogsView() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = parsePageSize(searchParams.get('pageSize'));
  const userId = searchParams.get('userId') ?? '';
  const actorRole = searchParams.get('actorRole') ?? '';
  const entityType = searchParams.get('entityType') ?? '';
  const entityId = searchParams.get('entityId') ?? '';
  const action = searchParams.get('action') ?? '';
  const fromDate = searchParams.get('fromDate') ?? '';
  const toDate = searchParams.get('toDate') ?? '';

  const [exportPending, setExportPending] = useState(false);
  const exportMutation = useAuditLogsExport();

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === '') next.delete(key);
        else next.set(key, value);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const resetPage = useCallback(() => patchParams({ page: '1' }), [patchParams]);

  const params = useMemo<AuditLogsListParams>(() => {
    const base: AuditLogsListParams = { page, pageSize };
    if (userId.trim()) base.userId = userId.trim();
    if (actorRole) base.actorRole = actorRole;
    if (entityType) base.entityType = entityType;
    if (entityId.trim()) base.entityId = entityId.trim();
    if (action) base.action = action;
    if (fromDate) base.fromDate = toUtcIsoStartOfDay(fromDate);
    if (toDate) base.toDate = toUtcIsoEndOfDay(toDate);
    return base;
  }, [action, actorRole, entityId, entityType, fromDate, page, pageSize, toDate, userId]);

  const statsParams = useMemo(() => {
    if (!fromDate || !toDate) return null;
    return {
      fromDate: toUtcIsoStartOfDay(fromDate),
      toDate: toUtcIsoEndOfDay(toDate),
    };
  }, [fromDate, toDate]);

  const listQuery = useAuditLogsList(params);
  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? EMPTY_PAGINATION;

  const resetFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  const handleExport = async () => {
    if (!fromDate || !toDate) {
      toast.error('Export CSV yêu cầu chọn Từ ngày và Đến ngày.');
      return;
    }
    if (!isAuditExportRangeValid(fromDate, toDate)) {
      toast.error(`Khoảng export tối đa ${AUDIT_EXPORT_MAX_DAYS} ngày.`);
      return;
    }

    setExportPending(true);
    try {
      const result = await exportMutation.mutateAsync({
        fromDate: toUtcIsoStartOfDay(fromDate),
        toDate: toUtcIsoEndOfDay(toDate),
        ...(userId.trim() ? { userId: userId.trim() } : {}),
        ...(actorRole ? { actorRole } : {}),
        ...(entityType ? { entityType } : {}),
        ...(action ? { action } : {}),
      });
      triggerBlobDownload(result.blob, result.filename);
      toast.success('Đã tải file CSV nhật ký kiểm toán.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không export được CSV.');
    } finally {
      setExportPending(false);
    }
  };

  const errorMessage =
    listQuery.error instanceof Error
      ? listQuery.error.message
      : 'Không tải được nhật ký kiểm toán.';

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Nhật ký kiểm toán chỉ đọc — truy vết ai thực hiện hành động gì, trên đối tượng nào và thời
          điểm nào.
        </p>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={exportPending}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-60"
        >
          {exportPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Download className="size-4" aria-hidden />
          )}
          Export CSV
        </button>
      </header>

      <section className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-950">
          <Filter className="size-4 text-emerald-700" aria-hidden />
          Bộ lọc nhật ký
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AuditActorPicker
            userId={userId}
            actorRole={actorRole}
            onChange={id => patchParams({ userId: id, page: '1' })}
            onPageReset={resetPage}
          />

          <div className="space-y-2">
            <label htmlFor="audit-role-filter" className="text-sm font-medium">
              Vai trò actor
            </label>
            <Select
              value={actorRole || 'all'}
              onValueChange={v => patchParams({ actorRole: v === 'all' ? null : v, page: '1' })}
            >
              <SelectTrigger id="audit-role-filter" className="h-10 w-full rounded-lg">
                <SelectValue placeholder="Tất cả vai trò" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                {SYSTEM_ROLES.map(role => (
                  <SelectItem key={role} value={role}>
                    {roleDisplayVi(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-entity-filter" className="text-sm font-medium">
              Loại đối tượng
            </label>
            <Select
              value={entityType || 'all'}
              onValueChange={v => {
                patchParams({
                  entityType: v === 'all' ? null : v,
                  entityId: null,
                  page: '1',
                });
              }}
            >
              <SelectTrigger id="audit-entity-filter" className="h-10 w-full rounded-lg">
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {AUDIT_ENTITY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AuditEntityIdPicker
            entityType={entityType}
            entityId={entityId}
            onChange={id => patchParams({ entityId: id, page: '1' })}
            onPageReset={resetPage}
          />

          <div className="space-y-2">
            <label htmlFor="audit-action-filter" className="text-sm font-medium">
              Action
            </label>
            <Select
              value={action || 'all'}
              onValueChange={v => patchParams({ action: v === 'all' ? null : v, page: '1' })}
            >
              <SelectTrigger id="audit-action-filter" className="h-10 w-full rounded-lg">
                <SelectValue placeholder="Tất cả action" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="max-h-72">
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
              Từ ngày (UTC)
            </label>
            <input
              id="audit-from-filter"
              type="date"
              value={fromDate}
              onChange={event => patchParams({ fromDate: event.target.value || null, page: '1' })}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-to-filter" className="text-sm font-medium">
              Đến ngày (UTC)
            </label>
            <input
              id="audit-to-filter"
              type="date"
              value={toDate}
              onChange={event => patchParams({ toDate: event.target.value || null, page: '1' })}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-page-size" className="text-sm font-medium">
              Số dòng / trang
            </label>
            <Select
              value={String(pageSize)}
              onValueChange={v => patchParams({ pageSize: v, page: '1' })}
            >
              <SelectTrigger id="audit-page-size" className="h-10 w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {AUDIT_LOGS_PAGE_SIZE_OPTIONS.map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
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

      <AuditLogStatsPanel params={statsParams} />

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
                  Vai trò
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
                  <TableCell colSpan={8} className="h-40 px-6 py-4 text-center">
                    <GreenLensLookupSpinner className="mx-auto size-8" />
                  </TableCell>
                </TableRow>
              ) : listQuery.isError ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={8} className="h-40 px-6 py-4 text-center">
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
                  <TableCell colSpan={8} className="h-40 px-6 py-4 text-center">
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
                      {item.userId ? (
                        <p className="mt-1 max-w-52 truncate font-mono text-xs text-muted-foreground">
                          {item.userId}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className={cn(adminTableCellPad('middle'), 'align-middle')}>
                      <span className="text-sm text-foreground">
                        {item.actorRole ? roleDisplayVi(item.actorRole) : '—'}
                      </span>
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

        <div className={ADMIN_TABLE_PAGINATION_FOOTER}>
          {pagination.totalPages > 1 || pagination.hasNext || pagination.hasPrev ? (
            <PaginationSimple
              page={pagination.page}
              totalPages={Math.max(1, pagination.totalPages)}
              onPageChange={nextPage => patchParams({ page: String(nextPage) })}
              className="w-auto"
            />
          ) : null}
          <p className={ADMIN_TABLE_PAGINATION_META}>
            {pagination.totalItems.toLocaleString('vi-VN')} rows · {pageSize}/trang
          </p>
        </div>
      </div>
    </div>
  );
}
