'use client';

import {
  PollutionCategoryFormDialog,
  type PollutionCategoryFormValues,
} from '@/components/admin/pollution-categories/PollutionCategoryFormDialog';
import { PollutionCategoryCard } from '@/components/admin/pollution-categories/PollutionCategoryCard';
import {
  useArchivePollutionCategory,
  useCreatePollutionCategory,
  usePollutionCategoriesWithCounts,
  useUpdatePollutionCategory,
} from '@/hooks/usePollutionCategories';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import { getPollutionCategoryMutationError } from '@/utils/pollutionCategoryErrors';
import { AlertTriangle, Loader2, Plus, Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

type StatusFilter = 'active' | 'archived';

export function AdminPollutionCategoriesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status: StatusFilter = searchParams.get('status') === 'archived' ? 'archived' : 'active';
  const searchQ = searchParams.get('q') ?? '';

  const [localSearch, setLocalSearch] = useState(searchQ);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<PollutionCategory | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const {
    items: allItems,
    isPending,
    isError,
    error,
    refetch,
    totalReports,
  } = usePollutionCategoriesWithCounts();

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
      router.push(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const activeCount = allItems.filter(i => !i.isArchived).length;
  const archivedCount = allItems.filter(i => i.isArchived).length;

  const items = useMemo(() => {
    const byStatus = allItems.filter(c => (status === 'archived' ? c.isArchived : !c.isArchived));
    const q = searchQ.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      c =>
        c.nameVi.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [allItems, status, searchQ]);

  const applySearch = () => {
    setQuery({ q: localSearch.trim() || null });
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
    archiveMutation.mutate(
      { id: category.id, body: { archive } },
      {
        onSuccess: () => {
          toast.success(archive ? 'Đã xóa danh mục.' : 'Đã khôi phục danh mục.');
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

  return (
    <div className="w-full min-w-0">
      <header className="mb-6 border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">
          Danh mục
          {isPending ? (
            ' · …'
          ) : (
            <>
              {' '}
              · {activeCount} đang dùng · {archivedCount} đã xóa
              {typeof totalReports === 'number' ? (
                <> · tổng {totalReports.toLocaleString('vi-VN')} báo cáo</>
              ) : null}
            </>
          )}
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
                  placeholder="Không khí, nước, rác…"
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
                onClick={() => setQuery({ status: null })}
                className={`rounded-md px-4 text-sm font-medium transition ${
                  status === 'active'
                    ? 'bg-emerald-700 text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Đang dùng
                {!isPending ? (
                  <span className="ml-1 tabular-nums opacity-90">{activeCount}</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setQuery({ status: 'archived' })}
                className={`rounded-md px-4 text-sm font-medium transition ${
                  status === 'archived'
                    ? 'bg-emerald-700 text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Đã xóa
                {!isPending ? (
                  <span className="ml-1 tabular-nums opacity-90">{archivedCount}</span>
                ) : null}
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
            onClick={() => void refetch()}
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(category => (
            <PollutionCategoryCard
              key={category.id}
              category={category}
              onEdit={setEditCategory}
              onArchiveToggle={handleArchiveToggle}
              archiveBusy={archivingId === category.id && archiveMutation.isPending}
            />
          ))}
        </div>
      )}

      <aside className="mt-8 flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          <strong className="font-semibold">Lưu ý:</strong> Không thể xoá cứng một loại đang được
          dùng bởi báo cáo. Xóa sẽ ẩn loại khỏi lựa chọn mới nhưng vẫn giữ cho các báo cáo cũ.
        </p>
      </aside>

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
