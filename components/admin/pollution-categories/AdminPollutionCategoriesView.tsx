'use client';

import { PollutionCategoryArchiveDialog } from '@/components/admin/pollution-categories/PollutionCategoryArchiveDialog';
import {
  PollutionCategoryFormDialog,
  type PollutionCategoryFormValues,
} from '@/components/admin/pollution-categories/PollutionCategoryFormDialog';
import { PollutionCategoryCard } from '@/components/admin/pollution-categories/PollutionCategoryCard';
import {
  AdminFilterSearch,
  AdminFilterStatusToggle,
} from '@/components/admin/shared/AdminFilterToolbar';
import { ADMIN_TABLE_PAGINATION_NAV } from '@/components/admin/shared/adminDataTableChrome';
import {
  useAdminPollutionCategoriesList,
  useArchivePollutionCategory,
  useCreatePollutionCategory,
  useUpdatePollutionCategory,
} from '@/hooks/usePollutionCategories';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import { ADMIN_POLLUTION_CATEGORIES_PAGE_SIZE } from '@/lib/constants/pollutionCategories';
import { getPollutionCategoryMutationError } from '@/utils/pollutionCategoryErrors';
import {
  getPollutionCategoryArchiveBlockedMessage,
  isAdminCatalogInUse,
} from '@/utils/adminCatalogGuards';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
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

  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<PollutionCategory | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<{
    category: PollutionCategory;
    archive: boolean;
  } | null>(null);

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

  const setQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      });
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleSearchCommit = useCallback(
    (q: string) => setQuery({ q: q || null, page: '1' }),
    [setQuery]
  );

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

  const requestArchiveToggle = (category: PollutionCategory, archive: boolean) => {
    if (archive && isAdminCatalogInUse(category.reportCount)) {
      toast.error(getPollutionCategoryArchiveBlockedMessage(category.reportCount));
      return;
    }
    setArchiveTarget({ category, archive });
  };

  const confirmArchiveToggle = () => {
    if (!archiveTarget) return;
    const { category, archive } = archiveTarget;
    setArchivingId(category.id);
    archiveMutation.mutate(
      { id: category.id, body: { archive } },
      {
        onSuccess: () => {
          toast.success(archive ? 'Đã ngưng danh mục.' : 'Đã kích hoạt danh mục.');
          setArchivingId(null);
          setArchiveTarget(null);
          if (archive) setQuery({ status: 'inactive', page: '1' });
        },
        onError: err => {
          toast.error(
            getPollutionCategoryMutationError(
              err,
              'Không thể đổi trạng thái.',
              category.reportCount
            )
          );
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
          Quản lý danh mục loại ô nhiễm · kèm số báo cáo đang sử dụng
          {pagination ? <> · {pagination.totalItems.toLocaleString('vi-VN')} kết quả</> : null}
        </p>
      </header>

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <AdminFilterSearch
            id="pc-search"
            label="Tìm loại ô nhiễm"
            value={searchQ}
            onCommit={handleSearchCommit}
            placeholder="code, tên VN, tên EN…"
          />
          <AdminFilterStatusToggle
            isActive={status === 'active'}
            inactiveLabel="Ngưng"
            onActive={() => setQuery({ status: null, page: '1' })}
            onInactive={() => setQuery({ status: 'inactive', page: '1' })}
          />
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
                onArchiveToggle={requestArchiveToggle}
                archiveBusy={archivingId === category.id && archiveMutation.isPending}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className={ADMIN_TABLE_PAGINATION_NAV}>
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
      <PollutionCategoryArchiveDialog
        category={archiveTarget?.category ?? null}
        archive={archiveTarget?.archive ?? true}
        busy={archiveMutation.isPending}
        onClose={() => {
          if (!archiveMutation.isPending) setArchiveTarget(null);
        }}
        onConfirm={confirmArchiveToggle}
      />
    </div>
  );
}
