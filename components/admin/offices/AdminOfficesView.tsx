'use client';

import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
  adminTableCellPad,
} from '@/components/admin/shared/adminDataTableChrome';
import { OfficeAssignOfficerDialog } from '@/components/admin/offices/OfficeAssignOfficerDialog';
import { OfficeCreateDialog } from '@/components/admin/offices/OfficeCreateDialog';
import { OfficeEditDialog } from '@/components/admin/offices/OfficeEditDialog';
import { OfficeLiveSearch } from '@/components/admin/offices/OfficeLiveSearch';
import { OfficesHierarchyList } from '@/components/admin/offices/OfficesHierarchyList';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOfficesList } from '@/hooks/useOffices';
import {
  ADMIN_OFFICES_HIERARCHY_PAGE_SIZE,
  ADMIN_OFFICES_PAGE_SIZE,
  type AdminOfficesViewMode,
} from '@/lib/constants/adminOffices';
import type { OfficeListItem } from '@/lib/api/models/office';
import { cn } from '@/lib/utils';
import { filterDepartmentGroups, groupOfficesByDepartment } from '@/utils/officeHierarchy';
import {
  Building2,
  CheckCircle2,
  Layers,
  Loader2,
  MapPinned,
  Pencil,
  Plus,
  Table2,
  UserPlus,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

const ONBOARD_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'yes', label: 'Đã onboard' },
  { value: 'no', label: 'Chưa onboard' },
] as const;

const EMPTY_ITEMS: OfficeListItem[] = [];

export function AdminOfficesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const provinceSearch = searchParams.get('q') ?? '';
  const onboardedFilter = searchParams.get('onboarded') ?? 'all';
  const viewMode: AdminOfficesViewMode =
    searchParams.get('view') === 'table' ? 'table' : 'hierarchy';
  const isHierarchy = viewMode === 'hierarchy';

  const [createOpen, setCreateOpen] = useState(false);
  const [editOffice, setEditOffice] = useState<OfficeListItem | null>(null);
  const [assignOffice, setAssignOffice] = useState<OfficeListItem | null>(null);

  const queryParams = useMemo(
    () => ({
      page: isHierarchy ? 1 : page,
      pageSize: isHierarchy ? ADMIN_OFFICES_HIERARCHY_PAGE_SIZE : ADMIN_OFFICES_PAGE_SIZE,
      ...(onboardedFilter === 'yes'
        ? { isOnboarded: true }
        : onboardedFilter === 'no'
          ? { isOnboarded: false }
          : {}),
    }),
    [page, onboardedFilter, isHierarchy]
  );

  const { data, isPending, isError, error, refetch } = useOfficesList(queryParams);

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
  const pagination = data?.pagination;
  const items = data?.items ?? EMPTY_ITEMS;

  const departmentGroups = useMemo(() => groupOfficesByDepartment(items), [items]);
  const filteredGroups = useMemo(
    () => filterDepartmentGroups(departmentGroups, provinceSearch),
    [departmentGroups, provinceSearch]
  );

  const provinceCount = departmentGroups.length;
  const wardCount = items.length;
  const onboardedTotal = items.filter(o => o.isOnboarded).length;
  const filteredWardCount = filteredGroups.reduce((n, g) => n + g.wardCount, 0);

  const handleProvinceSearch = useCallback(
    (q: string) => setQuery({ q: q || null, page: '1' }),
    [setQuery]
  );

  const searchMatchHint =
    isHierarchy && provinceSearch.trim()
      ? `${filteredGroups.length} tỉnh · ${filteredWardCount} phường/xã khớp “${provinceSearch.trim()}”`
      : undefined;

  return (
    <div className="w-full min-w-0">
      <section className="overflow-hidden rounded-card border border-border bg-card shadow-sm">
        <div className="relative border-b border-border bg-card">
          <div className="absolute left-0 top-0 h-full w-0.5 bg-teal-700" aria-hidden />

          <div className="relative px-4 py-5 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 pl-2 sm:pl-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Quản lý địa phương
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  Văn phòng địa phương
                </h2>
                <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  MT cấp phường, xã · liên kết theo Sở TNMT từng tỉnh
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-xl bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800"
              >
                <Plus className="size-4" />
                Tạo văn phòng
              </button>
            </div>

            <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 pl-2 text-sm sm:pl-3">
              <span className="inline-flex items-baseline gap-1.5 text-muted-foreground">
                <MapPinned className="size-3.5 shrink-0 translate-y-px text-zinc-400" aria-hidden />
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {provinceCount}
                </span>
                tỉnh
              </span>
              <span className="text-border select-none" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-baseline gap-1.5 text-muted-foreground">
                <Building2 className="size-3.5 shrink-0 translate-y-px text-zinc-400" aria-hidden />
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {wardCount}
                </span>
                phường/xã
              </span>
              <span className="text-border select-none" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-baseline gap-1.5 text-muted-foreground">
                <CheckCircle2
                  className="size-3.5 shrink-0 translate-y-px text-teal-700"
                  aria-hidden
                />
                <span className="text-lg font-semibold tabular-nums text-teal-800">
                  {onboardedTotal}
                </span>
                đã onboard
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:px-5">
          <OfficeLiveSearch
            key={provinceSearch}
            value={provinceSearch}
            onChange={handleProvinceSearch}
            matchHint={searchMatchHint}
            className="w-full sm:min-w-[220px] sm:max-w-lg sm:flex-1"
          />

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <div
              className="flex rounded-lg border border-border/70 bg-background p-0.5"
              role="group"
              aria-label="Lọc onboard"
            >
              {ONBOARD_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setQuery({
                      onboarded: value === 'all' ? null : value,
                      page: '1',
                    })
                  }
                  className={`rounded-md px-2.5 py-1 text-xs font-medium sm:text-sm ${
                    onboardedFilter === value
                      ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className="flex rounded-lg border border-border/70 bg-background p-0.5"
              role="group"
              aria-label="Hiển thị"
            >
              <button
                type="button"
                onClick={() => setQuery({ view: null, page: '1' })}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium sm:text-sm ${
                  isHierarchy
                    ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-muted-foreground'
                }`}
              >
                <Layers className="size-3.5" />
                Phân cấp
              </button>
              <button
                type="button"
                onClick={() => setQuery({ view: 'table', page: '1' })}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium sm:text-sm ${
                  !isHierarchy
                    ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-muted-foreground'
                }`}
              >
                <Table2 className="size-3.5" />
                Bảng
              </button>
            </div>
          </div>
        </div>

        {isPending && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Đang tải...
          </div>
        )}

        {isError && (
          <div className="py-20 text-center">
            <p className="text-sm text-destructive">
              {(error as Error)?.message ?? 'Không tải được danh sách.'}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {!isPending && !isError && isHierarchy && filteredGroups.length > 0 && (
          <>
            {pagination && pagination.totalItems > ADMIN_OFFICES_HIERARCHY_PAGE_SIZE && (
              <p className="border-b border-amber-200/80 bg-amber-50 px-6 py-2.5 text-xs text-amber-900">
                Hiển thị tối đa {ADMIN_OFFICES_HIERARCHY_PAGE_SIZE} văn phòng.
              </p>
            )}
            <OfficesHierarchyList
              groups={filteredGroups}
              onEdit={setEditOffice}
              onAssign={setAssignOffice}
            />
          </>
        )}

        {!isPending && !isError && isHierarchy && filteredGroups.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <Building2 className="mx-auto mb-2 size-9 opacity-30" />
            <p className="text-sm font-medium">Không tìm thấy tỉnh/ủy ban</p>
          </div>
        )}

        {!isPending && !isError && !isHierarchy && (
          <div className={ADMIN_TABLE_SHELL}>
            <div className={ADMIN_TABLE_SCROLL}>
              <Table className={ADMIN_TABLE_CLASS}>
                <TableHeader className="sticky top-0 z-10 bg-slate-100">
                  <TableRow
                    className={cn(ADMIN_TABLE_ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}
                  >
                    <TableHead
                      className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('first', 'head'))}
                    >
                      Văn phòng
                    </TableHead>
                    <TableHead
                      className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                    >
                      Ủy ban
                    </TableHead>
                    <TableHead
                      className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                    >
                      Phường/xã
                    </TableHead>
                    <TableHead
                      className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                    >
                      LEO
                    </TableHead>
                    <TableHead
                      className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                    >
                      Onboard
                    </TableHead>
                    <TableHead
                      className={cn(
                        ADMIN_TABLE_HEAD_CELL,
                        adminTableCellPad('last', 'head'),
                        'text-right'
                      )}
                    >
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-transparent')}>
                      <TableCell colSpan={6} className="h-40 px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                          <SaveIcon size={32} className="opacity-30" />
                          <span>Chưa có văn phòng.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map(row => (
                      <TableRow
                        key={row.id}
                        className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-sky-50/40')}
                      >
                        <TableCell className={cn(adminTableCellPad('first'), 'align-middle')}>
                          <span className="font-medium text-foreground">{row.name}</span>
                        </TableCell>
                        <TableCell
                          className={cn(
                            adminTableCellPad('middle'),
                            'align-middle text-muted-foreground'
                          )}
                        >
                          {row.departmentName}
                        </TableCell>
                        <TableCell className={cn(adminTableCellPad('middle'), 'align-middle')}>
                          {row.wardName}
                          <span className="ml-1 text-xs opacity-60">({row.wardCode})</span>
                        </TableCell>
                        <TableCell className={cn(adminTableCellPad('middle'), 'align-middle')}>
                          {row.officerName ?? '—'}
                        </TableCell>
                        <TableCell className={cn(adminTableCellPad('middle'), 'align-middle')}>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              row.isOnboarded
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {row.isOnboarded ? 'Có' : 'Chưa'}
                          </span>
                        </TableCell>
                        <TableCell
                          className={cn(adminTableCellPad('last'), 'text-right align-middle')}
                        >
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditOffice(row)}
                              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                              aria-label="Sửa văn phòng"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setAssignOffice(row)}
                              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                              aria-label="Gán LEO"
                            >
                              <UserPlus className="size-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {pagination ? (
              <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0">
                  {pagination.totalPages > 1 ? (
                    <PaginationSimple
                      page={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={p => setQuery({ page: String(p) })}
                      className="w-auto"
                    />
                  ) : null}
                </div>
                <p className="shrink-0 text-xs text-slate-500 tabular-nums">
                  {pagination.totalItems.toLocaleString('vi-VN')} rows
                </p>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <OfficeCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCompleted={() => void refetch()}
      />
      <OfficeEditDialog
        open={Boolean(editOffice)}
        office={editOffice}
        onClose={() => setEditOffice(null)}
        onSaved={() => void refetch()}
      />
      <OfficeAssignOfficerDialog
        open={Boolean(assignOffice)}
        office={assignOffice}
        onClose={() => setAssignOffice(null)}
        onAssigned={() => void refetch()}
      />
    </div>
  );
}
