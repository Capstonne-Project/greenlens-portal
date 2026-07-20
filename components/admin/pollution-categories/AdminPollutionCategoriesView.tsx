'use client';

import {
  PollutionCategoryFormDialog,
  type PollutionCategoryFormValues,
} from '@/components/admin/pollution-categories/PollutionCategoryFormDialog';
import { PollutionCategoryCard } from '@/components/admin/pollution-categories/PollutionCategoryCard';
import {
  useAdminPollutionCategoriesList,
  useArchivePollutionCategory,
  useCreatePollutionCategory,
  useDeletePollutionCategory,
  useUpdatePollutionCategory,
} from '@/hooks/usePollutionCategories';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import { ADMIN_POLLUTION_CATEGORIES_PAGE_SIZE } from '@/lib/constants/pollutionCategories';
import { getPollutionCategoryMutationError } from '@/utils/pollutionCategoryErrors';
import { ChevronLeft, ChevronRight, Loader2, Plus, Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

type StatusFilter = 'active' | 'inactive';

export function AdminPollutionCategoriesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status: StatusFilter =
    searchParams.get('status') === 'inactive' || searchParams.get('status') === 'archived'
      ? 'inactive'
      : 'active';
  const searchQ = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [localSearch, setLocalSearch] = useState(searchQ);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<PollutionCategory | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      pageSize: ADMIN_POLLUTION_CATEGORIES_PAGE_SIZE,
      ...(searchQ.trim() ? { search: searchQ.trim() } : {}),
      isActive: status === 'active',
      sortBy: 'code' as const,
      sortDesc: false,
    }),
    [page, searchQ, status]
  );

  const listQuery = useAdminPollutionCategoriesList(listParams);
  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination;

  const createMutation = useCreatePollutionCategory();
  const updateMutation = useUpdatePollutionCategory();
  const archiveMutation = useArchivePollutionCategory();
  const deleteMutation = useDeletePollutionCategory();

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

  const applySearch = () => {
    setQuery({ q: localSearch.trim() || null, page: '1' });
  };

  const handleCreate = (values: PollutionCategoryFormValues) => {
    createMutation.mutate(
      {
        code: values.code.trim(),
        nameVi: values.nameVi.trim(),
        nameEn: values.nameEn.trim(),
        ...(values.iconUrl?.trim() ? { iconUrl: values.iconUrl.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success('Đã tạo danh mục ô nhiễm.');
          setCreateOpen(false);
        },
        onError: err =>
          toast.error(getPollutionCategoryMutationError(err, 'Không thể tạo danh mục.')),
      }
    );
  };

  const handleUpdate = (values: PollutionCategoryFormValues) => {
    if (!editCategory) return;
    updateMutation.mutate(
      {
        id: editCategory.id,
        body: {
          nameVi: values.nameVi.trim(),
          nameEn: values.nameEn.trim(),
          ...(values.iconUrl?.trim() ? { iconUrl: values.iconUrl.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật danh mục.');
          setEditCategory(null);
        },
        onError: err =>
          toast.error(getPollutionCategoryMutationError(err, 'Không thể cập nhật danh mục.')),
      }
    );
  };

  const handleArchiveToggle = (category: PollutionCategory, archive: boolean) => {
    setArchivingId(category.id);
    if (archive) {
      deleteMutation.mutate(category.id, {
        onSuccess: () => {
          toast.success('Đã vô hiệu hóa danh mục.');
          setArchivingId(null);
        },
        onError: err => {
          toast.error(getPollutionCategoryMutationError(err, 'Không thể đổi trạng thái.'));
          setArchivingId(null);
        },
      });
      return;
    }
    archiveMutation.mutate(
      { id: category.id, body: { archive: false } },
      {
        onSuccess: () => {
          toast.success('Đã kích hoạt danh mục.');
          setArchivingId(null);
        },
        onError: err => {
          toast.error(getPollutionCategoryMutationError(err, 'Không thể đổi trạng thái.'));
          setArchivingId(null);
        },
      }
    );
  };

  const formBusy = createMutation.isPending || updateMutation.isPending;
  const isPending = listQuery.isPending;
  const isError = listQuery.isError;
  const error = listQuery.error;

  return (
    <div className="w-full min-w-0">
      <header className="mb-6 border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">
          Danh mục ô nhiễm · phân trang từ server · kèm số báo cáo đang dùng
          {pagination ? <> · {pagination.totalItems.toLocaleString('vi-VN')} kết quả</> : null}
        </p>
      </header>

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex min-w-[220px] flex-col gap-2">
            <label htmlFor="pc-search" className="text-sm font-medium">
              Tìm loại ô nhiễm
            </label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="pc-search"
                  type="search"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applySearch()}
                  placeholder="code, tên VN, tên EN…"
                  className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                />
              </div>
              <button
                type="button"
                onClick={applySearch}
                className="h-10 shrink-0 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Tìm
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Trạng thái</span>
            <div className="flex h-10 rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setQuery({ status: null, page: '1' })}
                className={`rounded-md px-4 text-sm font-medium transition ${
                  status === 'active'
                    ? 'bg-emerald-700 text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Đang dùng
              </button>
              <button
                type="button"
                onClick={() => setQuery({ status: 'inactive', page: '1' })}
                className={`rounded-md px-4 text-sm font-medium transition ${
                  status === 'inactive'
                    ? 'bg-emerald-700 text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Ngưng
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
        >
          <Plus className="size-4" />
          Thêm loại ô nhiễm
        </button>
      </section>

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Đang tải danh mục…
        </div>
      )}

      {isError && (
        <div className="py-16 text-center">
          <p className="text-sm text-destructive">
            {(error as Error)?.message ?? 'Không tải được danh mục.'}
          </p>
          <button
            type="button"
            onClick={() => void listQuery.refetch()}
            className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {!isPending && !isError && items.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {searchQ ? 'Không tìm thấy danh mục phù hợp.' : 'Chưa có danh mục trong nhóm này.'}
        </p>
      )}

      {!isPending && !isError && items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map(category => (
              <PollutionCategoryCard
                key={category.id}
                category={category}
                onEdit={setEditCategory}
                onArchiveToggle={handleArchiveToggle}
                archiveBusy={
                  archivingId === category.id &&
                  (archiveMutation.isPending || deleteMutation.isPending)
                }
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                Trang {pagination.page}/{Math.max(1, pagination.totalPages)} ·{' '}
                {pagination.totalItems.toLocaleString('vi-VN')} danh mục
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPrev}
                  onClick={() => setQuery({ page: String(Math.max(1, page - 1)) })}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" aria-hidden />
                  Trước
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNext}
                  onClick={() => setQuery({ page: String(page + 1) })}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
                >
                  Sau
                  <ChevronRight className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <PollutionCategoryFormDialog
        open={createOpen}
        mode="create"
        busy={formBusy}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <PollutionCategoryFormDialog
        open={Boolean(editCategory)}
        mode="edit"
        category={editCategory}
        busy={formBusy}
        onClose={() => setEditCategory(null)}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
