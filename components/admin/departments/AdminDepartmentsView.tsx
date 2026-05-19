'use client';

import { DepartmentCreateDialog } from '@/components/admin/departments/DepartmentCreateDialog';
import { DepartmentDetailDialog } from '@/components/admin/departments/DepartmentDetailDialog';
import { DepartmentEditDialog } from '@/components/admin/departments/DepartmentEditDialog';
import { useDeactivateDepartment, useDepartmentsList } from '@/hooks/useDepartments';
import { ADMIN_DEPARTMENTS_PAGE_SIZE } from '@/lib/constants/adminDepartments';
import type { DepartmentListItem } from '@/lib/api/models/department';
import { getDepartmentMutationError } from '@/utils/departmentErrors';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ActiveFilter = 'active' | 'inactive' | 'all';

function formatCreatedAt(iso: string): string {
  if (!iso?.trim() || iso.startsWith('0001-01-01')) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()) || d.getFullYear() <= 1) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

function DepartmentSearchControls({
  searchQ,
  onApply,
}: {
  searchQ: string;
  onApply: (trimmed: string) => void;
}) {
  const [localSearch, setLocalSearch] = useState(searchQ);
  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="dept-search"
          type="search"
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onApply(localSearch.trim())}
          placeholder="HCM, Đồng Nai…"
          className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        />
      </div>
      <button
        type="button"
        onClick={() => onApply(localSearch.trim())}
        className="h-10 shrink-0 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
      >
        Tìm
      </button>
    </div>
  );
}

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
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

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

  const { data, isPending, isError, error, refetch } = useDepartmentsList(listParams);
  const deactivateMutation = useDeactivateDepartment();

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

  const handleDeactivate = (dept: DepartmentListItem) => {
    if (
      !window.confirm(
        `Vô hiệu hóa "${dept.name}"? Các văn phòng trực thuộc vẫn được giữ trong hệ thống.`
      )
    ) {
      return;
    }
    setDeactivatingId(dept.id);
    deactivateMutation.mutate(dept.id, {
      onSuccess: () => {
        toast.success('Đã vô hiệu hóa ủy ban.');
        setDeactivatingId(null);
      },
      onError: err => {
        toast.error(getDepartmentMutationError(err, 'Không thể vô hiệu hóa.'));
        setDeactivatingId(null);
      },
    });
  };

  return (
    <div className="w-full min-w-0">
      <header className="mb-6 border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">
          Quản lý ủy ban (Sở TNMT) cấp tỉnh — mỗi tỉnh một department, gắn văn phòng phường/xã.
        </p>
        {pagination && (
          <p className="mt-2 text-sm text-muted-foreground">
            Tổng{' '}
            <strong className="text-foreground tabular-nums">
              {pagination.totalItems.toLocaleString('vi-VN')}
            </strong>{' '}
            ủy ban
          </p>
        )}
      </header>

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex min-w-[220px] flex-col gap-2">
            <label htmlFor="dept-search" className="text-sm font-medium">
              Tìm ủy ban / tỉnh
            </label>
            <DepartmentSearchControls
              key={searchQ}
              searchQ={searchQ}
              onApply={q => setQuery({ q: q || null, page: '1' })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Trạng thái</span>
            <div className="flex h-10 flex-wrap rounded-lg border border-border bg-background p-1">
              {(
                [
                  ['active', 'Hoạt động'],
                  ['inactive', 'Vô hiệu'],
                  ['all', 'Tất cả'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setQuery({
                      status: value === 'active' ? null : value,
                      page: '1',
                    })
                  }
                  className={`rounded-md px-3 text-xs font-medium sm:text-sm ${
                    activeFilter === value
                      ? 'bg-emerald-700 text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
        >
          <Plus className="size-4" />
          Tạo ủy ban mới
        </button>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        {isPending && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
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
              className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {!isPending && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3">Ủy ban / Sở</th>
                  <th className="px-4 py-3">Tỉnh / TP</th>
                  <th className="px-4 py-3">Văn phòng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                      <Building2 className="mx-auto mb-2 size-8 opacity-30" />
                      Không có ủy ban phù hợp.
                    </td>
                  </tr>
                )}
                {items.map(row => (
                  <tr key={row.id} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.provinceName}
                      <span className="ml-1 text-xs opacity-60">({row.provinceCode})</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.officeCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {row.isActive ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCreatedAt(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-0.5">
                        <button
                          type="button"
                          title="Chi tiết"
                          onClick={() => setDetailId(row.id)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          title="Sửa"
                          onClick={() => setEditDept(row)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
                        >
                          <Pencil className="size-4" />
                        </button>
                        {row.isActive ? (
                          <button
                            type="button"
                            title="Vô hiệu hóa"
                            disabled={deactivatingId === row.id && deactivateMutation.isPending}
                            onClick={() => handleDeactivate(row)}
                            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
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
      />
    </div>
  );
}
