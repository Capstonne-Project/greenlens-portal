'use client';

import {
  PenaltyFrameworkCreateDialog,
  type PenaltyFrameworkFormValues,
} from '@/components/admin/penalty-frameworks/PenaltyFrameworkCreateDialog';
import {
  PenaltyFrameworkEditDialog,
  type PenaltyFrameworkEditFormValues,
} from '@/components/admin/penalty-frameworks/PenaltyFrameworkEditDialog';
import {
  useCreatePenaltyFramework,
  usePenaltyFrameworksList,
  useTogglePenaltyFramework,
  useUpdatePenaltyFramework,
} from '@/hooks/usePenaltyFrameworks';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type {
  PenaltyFramework,
  PenaltyFrameworkPagination,
} from '@/lib/api/models/penaltyFramework';
import {
  PENALTY_FRAMEWORKS_PAGE_SIZE,
  PENALTY_VIOLATION_LEVEL_LABEL_VI,
  PENALTY_VIOLATION_LEVELS,
  type PenaltyViolationLevel,
} from '@/lib/constants/penaltyFrameworks';
import { cn } from '@/lib/utils';
import {
  formatPenaltyAmount,
  formatPenaltyAmountRange,
  getPenaltyMutationError,
  getPenaltyViolationBadgeClass,
} from '@/utils/penaltyFrameworkUi';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Power,
  Scale,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'active' | 'inactive';

const EMPTY_PAGINATION: PenaltyFrameworkPagination = {
  page: 1,
  pageSize: PENALTY_FRAMEWORKS_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

function getViolationLabel(level: string): string {
  if ((PENALTY_VIOLATION_LEVELS as readonly string[]).includes(level)) {
    return PENALTY_VIOLATION_LEVEL_LABEL_VI[level as PenaltyViolationLevel];
  }
  return level || 'Không rõ';
}

function formatAdminDate(value: string | null | undefined): string {
  if (!value) return 'Không giới hạn';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function AdminPenaltyFrameworksView() {
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [violationLevel, setViolationLevel] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PenaltyFramework | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      page,
      pageSize: PENALTY_FRAMEWORKS_PAGE_SIZE,
      ...(categoryId ? { categoryId } : {}),
      ...(violationLevel ? { violationLevel } : {}),
      ...(status === 'active' ? { isActive: true } : {}),
      ...(status === 'inactive' ? { isActive: false } : {}),
    }),
    [categoryId, page, status, violationLevel]
  );

  const listQuery = usePenaltyFrameworksList(params);
  const categoriesQuery = useCatalogPollutionCategories();
  const createMutation = useCreatePenaltyFramework();
  const updateMutation = useUpdatePenaltyFramework();
  const toggleMutation = useTogglePenaltyFramework();

  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? EMPTY_PAGINATION;
  const categories = categoriesQuery.data ?? [];

  const activeOnPage = items.filter(item => item.isActive).length;
  const highestAmount = items.reduce((max, item) => Math.max(max, item.maxAmount), 0);

  const resetToFirstPage = () => setPage(1);

  const handleCreate = (values: PenaltyFrameworkFormValues) => {
    createMutation.mutate(
      {
        categoryId: values.categoryId,
        violationLevel: values.violationLevel,
        minAmount: values.minAmount,
        maxAmount: values.maxAmount,
        effectiveFrom: `${values.effectiveFrom}T00:00:00.000Z`,
        effectiveTo: values.effectiveTo?.trim() ? `${values.effectiveTo}T23:59:59.000Z` : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Đã tạo khung xử phạt.');
          setCreateOpen(false);
        },
        onError: err => toast.error(getPenaltyMutationError(err, 'Không thể tạo khung xử phạt.')),
      }
    );
  };

  const handleUpdate = (values: PenaltyFrameworkEditFormValues) => {
    if (!editTarget) return;
    updateMutation.mutate(
      {
        id: editTarget.id,
        body: {
          minAmount: values.minAmount,
          maxAmount: values.maxAmount,
          effectiveFrom: `${values.effectiveFrom}T00:00:00.000Z`,
          effectiveTo: values.effectiveTo?.trim() ? `${values.effectiveTo}T23:59:59.000Z` : null,
        },
      },
      {
        onSuccess: env => {
          toast.success(env.message || 'Đã cập nhật khung xử phạt.');
          setEditTarget(null);
        },
        onError: err =>
          toast.error(getPenaltyMutationError(err, 'Không thể cập nhật khung xử phạt.')),
      }
    );
  };

  const handleToggle = (item: PenaltyFramework) => {
    const activate = !item.isActive;
    setTogglingId(item.id);
    toggleMutation.mutate(
      { id: item.id, body: { activate } },
      {
        onSuccess: env => {
          toast.success(
            env.message || (activate ? 'Đã bật khung xử phạt.' : 'Đã tắt khung xử phạt.')
          );
        },
        onError: err =>
          toast.error(getPenaltyMutationError(err, 'Không thể đổi trạng thái khung xử phạt.')),
        onSettled: () => setTogglingId(null),
      }
    );
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mức phạt theo loại ô nhiễm, cấp vi phạm và thời gian hiệu lực.
        </p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-800"
        >
          <Plus className="size-4" aria-hidden />
          Tạo khung phạt
        </button>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Khung phạt
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-950">
            {pagination.totalItems.toLocaleString('vi-VN')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Tổng theo bộ lọc hiện tại</p>
        </div>
        <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Đang hiệu lực
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-teal-950">{activeOnPage}</p>
          <p className="mt-1 text-xs text-muted-foreground">Trên trang này</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Mức cao nhất
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-950">
            {formatPenaltyAmount(highestAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Trên trang này</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_220px]">
            <div className="space-y-2">
              <label htmlFor="penalty-category-filter" className="text-sm font-medium">
                Loại ô nhiễm
              </label>
              <select
                id="penalty-category-filter"
                value={categoryId}
                onChange={event => {
                  setCategoryId(event.target.value);
                  resetToFirstPage();
                }}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.nameVi}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="penalty-level-filter" className="text-sm font-medium">
                Cấp vi phạm
              </label>
              <select
                id="penalty-level-filter"
                value={violationLevel}
                onChange={event => {
                  setViolationLevel(event.target.value);
                  resetToFirstPage();
                }}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                <option value="">Tất cả cấp</option>
                {PENALTY_VIOLATION_LEVELS.map(level => (
                  <option key={level} value={level}>
                    {PENALTY_VIOLATION_LEVEL_LABEL_VI[level]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              <Filter className="size-4 text-emerald-700" aria-hidden />
              Trạng thái
            </span>
            <div className="flex h-10 rounded-lg border border-border bg-background p-1">
              {(
                [
                  ['all', 'Tất cả'],
                  ['active', 'Đang hiệu lực'],
                  ['inactive', 'Ngưng'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setStatus(value);
                    resetToFirstPage();
                  }}
                  className={cn(
                    'rounded-md px-3 text-sm font-medium transition',
                    status === value
                      ? 'bg-emerald-700 text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-emerald-50/50 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-emerald-950">Danh sách khung xử phạt</p>
          <p className="mt-1 text-xs text-emerald-900/65">
            Mức phạt được hiển thị nổi bật để dễ rà soát nhanh trong quy trình quản trị.
          </p>
        </div>

        {listQuery.isPending ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Đang tải khung xử phạt…
          </div>
        ) : null}

        {listQuery.isError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-destructive">
              {(listQuery.error as Error)?.message ?? 'Không tải được khung xử phạt.'}
            </p>
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
              <Scale className="size-6" aria-hidden />
            </div>
            <p className="text-sm font-medium text-foreground">Chưa có khung xử phạt phù hợp.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Hãy thử đổi bộ lọc hoặc tạo khung phạt mới cho danh mục đang dùng.
            </p>
          </div>
        ) : null}

        {!listQuery.isPending && !listQuery.isError && items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Loại ô nhiễm</th>
                    <th className="px-5 py-3 font-semibold">Cấp vi phạm</th>
                    <th className="px-5 py-3 font-semibold">Mức phạt</th>
                    <th className="px-5 py-3 font-semibold">Hiệu lực</th>
                    <th className="px-5 py-3 font-semibold">Trạng thái</th>
                    <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                    <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map(item => (
                    <tr key={item.id} className="transition hover:bg-emerald-50/35">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">{item.categoryNameVi}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                            getPenaltyViolationBadgeClass(item.violationLevel)
                          )}
                        >
                          {getViolationLabel(item.violationLevel)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-lg font-extrabold tracking-tight text-emerald-950">
                          {formatPenaltyAmountRange(item.minAmount, item.maxAmount, item.currency)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.currency}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">
                          {formatAdminDate(item.effectiveFrom)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          đến {formatAdminDate(item.effectiveTo)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                            item.isActive
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {item.isActive ? 'Đang hiệu lực' : 'Ngưng'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {formatAdminDate(item.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditTarget(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                          >
                            <Pencil className="size-3.5" aria-hidden />
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={togglingId === item.id}
                            onClick={() => handleToggle(item)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50',
                              item.isActive
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            )}
                          >
                            {togglingId === item.id ? (
                              <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            ) : (
                              <Power className="size-3.5" aria-hidden />
                            )}
                            {item.isActive ? 'Tắt' : 'Bật'}
                          </button>
                        </div>
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
                / {pagination.totalItems.toLocaleString('vi-VN')} khung
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

      <PenaltyFrameworkCreateDialog
        key={createOpen ? 'penalty-create-open' : 'penalty-create-closed'}
        open={createOpen}
        busy={createMutation.isPending}
        categories={categories}
        categoriesLoading={categoriesQuery.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <PenaltyFrameworkEditDialog
        key={editTarget?.id ?? 'penalty-edit-closed'}
        open={Boolean(editTarget)}
        framework={editTarget}
        busy={updateMutation.isPending}
        onClose={() => {
          if (!updateMutation.isPending) setEditTarget(null);
        }}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
