'use client';

import { DepartmentAssignOfficerDialog } from '@/components/admin/departments/DepartmentAssignOfficerDialog';
import { DepartmentCreateDialog } from '@/components/admin/departments/DepartmentCreateDialog';
import { DepartmentDeactivateDialog } from '@/components/admin/departments/DepartmentDeactivateDialog';
import { DepartmentDetailDialog } from '@/components/admin/departments/DepartmentDetailDialog';
import { DepartmentEditDialog } from '@/components/admin/departments/DepartmentEditDialog';
import { DepartmentLiveSearch } from '@/components/admin/departments/DepartmentLiveSearch';
import { DepartmentsDataList } from '@/components/admin/departments/DepartmentsDataList';
import { DepartmentsOverviewSidebar } from '@/components/admin/departments/DepartmentsOverviewSidebar';
import { useDepartmentsList } from '@/hooks/useDepartments';
import { ADMIN_DEPARTMENTS_PAGE_SIZE } from '@/lib/constants/adminDepartments';
import type { DepartmentListItem } from '@/lib/api/models/department';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

type ActiveFilter = 'active' | 'inactive' | 'all';

const STATUS_FILTERS: { value: ActiveFilter; label: string }[] = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Vô hiệu' },
  { value: 'all', label: 'Tất cả' },
];

export function AdminDepartmentsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const searchQ = searchParams.get('q') ?? '';
  const activeFilter: ActiveFilter =
    searchParams.get('status') === 'inactive'
      ? 'inactive'
      : searchParams.get('status') === 'all'
        ? 'all'
        : 'active';

  const [createOpen, setCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState<DepartmentListItem | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assignDept, setAssignDept] = useState<DepartmentListItem | null>(null);
  const [deactivateDept, setDeactivateDept] = useState<DepartmentListItem | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      pageSize: ADMIN_DEPARTMENTS_PAGE_SIZE,
      ...(activeFilter === 'active'
        ? { isActive: true }
        : activeFilter === 'inactive'
          ? { isActive: false }
          : {}),
    }),
    [page, activeFilter]
  );

  const overviewParams = useMemo(() => ({ page: 1, pageSize: 100 }), []);

  const { data, isPending, isError, error, refetch } = useDepartmentsList(listParams);
  const overviewQuery = useDepartmentsList(overviewParams);

  const allForTaken = useDepartmentsList({
    page: 1,
    pageSize: 100,
    isActive: true,
  });

  const takenProvinceCodes = useMemo(
    () => (allForTaken.data?.items ?? []).map(d => d.provinceCode),
    [allForTaken.data]
  );

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

  const items = useMemo(() => {
    const base = data?.items ?? [];
    const q = searchQ.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      d =>
        d.name.toLowerCase().includes(q) ||
        d.provinceName.toLowerCase().includes(q) ||
        d.provinceCode.includes(q)
    );
  }, [data, searchQ]);

  const pagination = data?.pagination;
  const overviewItems = overviewQuery.data?.items ?? [];
  const overviewTotal = overviewQuery.data?.pagination.totalItems ?? 0;

  const handleSearchChange = useCallback(
    (q: string) => setQuery({ q: q || null, page: '1' }),
    [setQuery]
  );

  return (
    <div className="w-full min-w-0">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] xl:gap-8">
        <div className="order-2 min-w-0 space-y-5 xl:order-1">
          <p className="max-w-xl text-sm text-muted-foreground">
            Mỗi tỉnh, thành một đơn vị quản lý · liên kết văn phòng phường, xã trực thuộc
          </p>

          <section className="overflow-hidden rounded-card border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {STATUS_FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setQuery({
                          status: value === 'active' ? null : value,
                          page: '1',
                        })
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                        activeFilter === value
                          ? 'border-zinc-800 bg-zinc-800 text-white dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-900'
                          : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 sm:shrink-0">
                  <DepartmentLiveSearch
                    key={searchQ}
                    value={searchQ}
                    onChange={handleSearchChange}
                    resultCount={searchQ.trim() ? items.length : undefined}
                    className="w-full min-w-[180px] sm:w-52"
                  />
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-3.5 text-sm font-medium text-white transition hover:bg-teal-800"
                  >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Tạo mới</span>
                  </button>
                </div>
              </div>

              {pagination ? (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {items.length.toLocaleString('vi-VN')}
                  </span>{' '}
                  / {(pagination.totalItems ?? 0).toLocaleString('vi-VN')} đơn vị{' '}
                </p>
              ) : null}
            </div>

            {isPending && (
              <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Đang tải…
              </div>
            )}

            {isError && (
              <div className="py-16 text-center">
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

            {!isPending && !isError && (
              <>
                <DepartmentsDataList
                  items={items}
                  deactivatingId={null}
                  isDeactivating={false}
                  onDetail={setDetailId}
                  onEdit={setEditDept}
                  onDeactivate={setDeactivateDept}
                />

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex flex-col gap-2 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-muted-foreground">
                      Trang {pagination.page}/{pagination.totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!pagination.hasPrev}
                        onClick={() => setQuery({ page: String(page - 1) })}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium disabled:opacity-40"
                      >
                        <ChevronLeft className="size-3.5" />
                        Trước
                      </button>
                      <button
                        type="button"
                        disabled={!pagination.hasNext}
                        onClick={() => setQuery({ page: String(page + 1) })}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium disabled:opacity-40"
                      >
                        Sau
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <div className="order-1 xl:order-2 xl:sticky xl:top-[4.5rem] xl:self-start">
          <DepartmentsOverviewSidebar
            items={overviewItems}
            totalItems={overviewTotal}
            isLoading={overviewQuery.isPending}
          />
        </div>
      </div>

      <DepartmentCreateDialog
        open={createOpen}
        takenProvinceCodes={takenProvinceCodes}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void refetch()}
      />
      <DepartmentEditDialog
        open={Boolean(editDept)}
        department={editDept}
        onClose={() => setEditDept(null)}
        onSaved={() => void refetch()}
      />
      <DepartmentDetailDialog
        open={Boolean(detailId)}
        departmentId={detailId}
        onClose={() => setDetailId(null)}
        onAssignOfficer={dept => {
          setDetailId(null);
          setAssignDept(dept);
        }}
      />
      <DepartmentAssignOfficerDialog
        open={Boolean(assignDept)}
        department={assignDept}
        onClose={() => setAssignDept(null)}
        onAssigned={() => void refetch()}
      />
      <DepartmentDeactivateDialog
        department={deactivateDept}
        onClose={() => setDeactivateDept(null)}
        onDeactivated={() => void refetch()}
      />
    </div>
  );
}
