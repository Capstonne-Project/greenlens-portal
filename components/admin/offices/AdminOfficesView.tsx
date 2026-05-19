'use client';

import { OfficeAssignOfficerDialog } from '@/components/admin/offices/OfficeAssignOfficerDialog';
import { OfficeCreateDialog } from '@/components/admin/offices/OfficeCreateDialog';
import { OfficeEditDialog } from '@/components/admin/offices/OfficeEditDialog';
import { OfficesHierarchyList } from '@/components/admin/offices/OfficesHierarchyList';
import { useOfficesList } from '@/hooks/useOffices';
import {
  ADMIN_OFFICES_HIERARCHY_PAGE_SIZE,
  ADMIN_OFFICES_PAGE_SIZE,
  type AdminOfficesViewMode,
} from '@/lib/constants/adminOffices';
import type { OfficeListItem } from '@/lib/api/models/office';
import { filterDepartmentGroups, groupOfficesByDepartment } from '@/utils/officeHierarchy';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Search,
  Table2,
  UserPlus,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

function OfficeProvinceSearchControls({
  provinceSearch,
  onApply,
}: {
  provinceSearch: string;
  onApply: (trimmed: string) => void;
}) {
  const [localProvinceSearch, setLocalProvinceSearch] = useState(provinceSearch);
  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="office-province-search"
          type="search"
          value={localProvinceSearch}
          onChange={e => setLocalProvinceSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onApply(localProvinceSearch.trim())}
          placeholder="HCM, Đồng Nai, Vĩnh Long…"
          className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        />
      </div>
      <button
        type="button"
        onClick={() => onApply(localProvinceSearch.trim())}
        className="h-10 shrink-0 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
      >
        Tìm
      </button>
    </div>
  );
}

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

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const departmentGroups = useMemo(() => groupOfficesByDepartment(items), [items]);
  const filteredGroups = useMemo(
    () => filterDepartmentGroups(departmentGroups, provinceSearch),
    [departmentGroups, provinceSearch]
  );

  const provinceCount = departmentGroups.length;
  const wardCount = items.length;
  const onboardedTotal = items.filter(o => o.isOnboarded).length;
  const filteredWardCount = filteredGroups.reduce((n, g) => n + g.wardCount, 0);

  return (
    <div className="w-full min-w-0">
      {/* Header — một dải, không dùng 3 card */}
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Quản lý văn phòng MT cấp phường/xã theo tỉnh
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium tabular-nums">
              {provinceCount} tỉnh/ủy ban
            </span>
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium tabular-nums">
              {wardCount} phường/xã
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900 tabular-nums">
              {onboardedTotal} onboard
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
        >
          <Plus className="size-4" />
          Tạo văn phòng mới
        </button>
      </header>

      {/* Một panel duy nhất: filter + danh sách */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Thanh lọc */}
        <div className="border-b border-border bg-muted/20 px-4 py-4 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_11rem_10rem] lg:items-end lg:gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="office-province-search" className="text-sm font-medium">
                Tìm tỉnh / ủy ban
              </label>
              <OfficeProvinceSearchControls
                key={provinceSearch}
                provinceSearch={provinceSearch}
                onApply={q => setQuery({ q: q || null, page: '1' })}
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <label htmlFor="office-filter-onboard" className="text-sm font-medium">
                Trạng thái onboard
              </label>
              <select
                id="office-filter-onboard"
                value={onboardedFilter}
                onChange={e =>
                  setQuery({
                    onboarded: e.target.value === 'all' ? null : e.target.value,
                    page: '1',
                  })
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="yes">Đã onboard</option>
                <option value="no">Chưa onboard</option>
              </select>
            </div>

            <div className="flex w-full flex-col gap-2">
              <span className="text-sm font-medium">Hiển thị</span>
              <div className="flex h-10 rounded-lg border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setQuery({ view: null, page: '1' })}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md text-xs font-medium sm:text-sm ${
                    isHierarchy
                      ? 'bg-emerald-700 text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Layers className="size-3.5 shrink-0" />
                  Cấp
                </button>
                <button
                  type="button"
                  onClick={() => setQuery({ view: 'table', page: '1' })}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md text-xs font-medium sm:text-sm ${
                    !isHierarchy
                      ? 'bg-emerald-700 text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Table2 className="size-3.5 shrink-0" />
                  Bảng
                </button>
              </div>
            </div>
          </div>

          {isHierarchy && provinceSearch && (
            <p className="mt-3 text-xs text-muted-foreground">
              {filteredGroups.length} tỉnh · {filteredWardCount} phường/xã khớp &quot;
              {provinceSearch}&quot;
            </p>
          )}
        </div>

        {/* Nội dung */}
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
              className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3">Văn phòng</th>
                  <th className="px-4 py-3">Ủy ban</th>
                  <th className="px-4 py-3">Phường/xã</th>
                  <th className="px-4 py-3">LEO</th>
                  <th className="px-4 py-3">Onboard</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                      Chưa có văn phòng.
                    </td>
                  </tr>
                )}
                {items.map(row => (
                  <tr key={row.id} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.departmentName}</td>
                    <td className="px-4 py-3">
                      {row.wardName}
                      <span className="ml-1 text-xs opacity-60">({row.wardCode})</span>
                    </td>
                    <td className="px-4 py-3">{row.officerName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.isOnboarded
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {row.isOnboarded ? 'Có' : 'Chưa'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => setEditOffice(row)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssignOffice(row)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
                        >
                          <UserPlus className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <span className="text-xs text-muted-foreground">
                  Trang {pagination.page}/{pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPrev}
                    onClick={() => setQuery({ page: String(page - 1) })}
                    className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" />
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={!pagination.hasNext}
                    onClick={() => setQuery({ page: String(page + 1) })}
                    className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs disabled:opacity-40"
                  >
                    Sau
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
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
