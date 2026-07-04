'use client';

import { WasteTagCatalogFlow } from '@/components/admin/waste-tags/WasteTagCatalogFlow';
import { WasteTagInactiveFlow } from '@/components/admin/waste-tags/WasteTagInactiveFlow';
import { WasteTagLiveSearch } from '@/components/admin/waste-tags/WasteTagLiveSearch';
import {
  WasteTagFormDialog,
  type WasteTagFormValues,
} from '@/components/admin/waste-tags/WasteTagFormDialog';
import {
  useCatalogWasteTags,
  useCreateWasteTag,
  useAdminWasteTagsList,
  useToggleWasteTag,
  useUpdateWasteTag,
} from '@/hooks/useWasteTags';
import { ADMIN_WASTE_TAGS_PAGE_SIZE } from '@/lib/constants/adminWasteTags';
import type { WasteTag } from '@/lib/api/models/wasteTag';
import { getWasteTagMutationError } from '@/utils/wasteTagErrors';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type StatusFilter = 'active' | 'inactive';

const EMPTY_TAGS: WasteTag[] = [];

function filterTags(tags: WasteTag[], query: string): WasteTag[] {
  const q = query.trim().toLowerCase();
  if (!q) return tags;
  return tags.filter(
    t =>
      t.nameVi.toLowerCase().includes(q) ||
      t.nameEn.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false)
  );
}

export function AdminWasteTagsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status: StatusFilter = searchParams.get('status') === 'inactive' ? 'inactive' : 'active';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchQ, setSearchQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<WasteTag | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const catalogQuery = useCatalogWasteTags(status === 'active');
  const inactiveQuery = useAdminWasteTagsList({ isActive: false });

  const activeTags = catalogQuery.data ?? EMPTY_TAGS;
  const inactiveTags = inactiveQuery.data?.items ?? EMPTY_TAGS;
  const sourceTags = status === 'active' ? activeTags : inactiveTags;

  const createMutation = useCreateWasteTag();
  const updateMutation = useUpdateWasteTag();
  const toggleMutation = useToggleWasteTag();

  const isPending = status === 'active' ? catalogQuery.isPending : inactiveQuery.isPending;
  const isError = status === 'active' ? catalogQuery.isError : inactiveQuery.isError;
  const error = status === 'active' ? catalogQuery.error : inactiveQuery.error;

  const refetch = useCallback(() => {
    void catalogQuery.refetch();
    void inactiveQuery.refetch();
  }, [catalogQuery, inactiveQuery]);

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

  const filteredItems = useMemo(() => filterTags(sourceTags, searchQ), [sourceTags, searchQ]);

  const pagination = useMemo(() => {
    const totalItems = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ADMIN_WASTE_TAGS_PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    return {
      page: safePage,
      totalPages,
      totalItems,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    };
  }, [filteredItems, page]);

  const pageItems = useMemo(() => {
    const start = (pagination.page - 1) * ADMIN_WASTE_TAGS_PAGE_SIZE;
    return filteredItems.slice(start, start + ADMIN_WASTE_TAGS_PAGE_SIZE);
  }, [filteredItems, pagination.page]);

  useEffect(() => {
    if (page > pagination.totalPages) {
      setQuery({ page: String(pagination.totalPages) });
    }
  }, [page, pagination.totalPages, setQuery]);

  const nextDisplayOrder = useMemo(() => {
    const combined = [...activeTags, ...inactiveTags];
    if (combined.length === 0) return 1;
    return Math.max(...combined.map(t => t.displayOrder)) + 1;
  }, [activeTags, inactiveTags]);

  const handleSearchChange = useCallback(
    (q: string) => {
      setSearchQ(q);
      if (page !== 1) setQuery({ page: '1' });
    },
    [page, setQuery]
  );

  const handleStatusChange = (next: StatusFilter) => {
    setSearchQ('');
    setQuery({
      status: next === 'active' ? null : 'inactive',
      page: '1',
    });
  };

  const handleCreate = (values: WasteTagFormValues) => {
    createMutation.mutate(
      {
        code: values.code.trim(),
        nameVi: values.nameVi.trim(),
        nameEn: values.nameEn.trim(),
        displayOrder: values.displayOrder,
        ...(values.iconUrl?.trim() ? { iconUrl: values.iconUrl.trim() } : {}),
        ...(values.description?.trim() ? { description: values.description.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success('Đã tạo thẻ rác thải.');
          setCreateOpen(false);
        },
        onError: err => toast.error(getWasteTagMutationError(err, 'Không thể tạo thẻ rác thải.')),
      }
    );
  };

  const handleUpdate = (values: WasteTagFormValues) => {
    if (!editTag) return;
    updateMutation.mutate(
      {
        id: editTag.id,
        body: {
          code: editTag.code,
          nameVi: values.nameVi.trim(),
          nameEn: values.nameEn.trim(),
          displayOrder: values.displayOrder,
          ...(values.iconUrl?.trim() ? { iconUrl: values.iconUrl.trim() } : {}),
          ...(values.description?.trim() ? { description: values.description.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật thẻ rác thải.');
          setEditTag(null);
        },
        onError: err =>
          toast.error(getWasteTagMutationError(err, 'Không thể cập nhật thẻ rác thải.')),
      }
    );
  };

  const handleToggle = (tag: WasteTag, isActive: boolean) => {
    setTogglingId(tag.id);
    toggleMutation.mutate(
      { id: tag.id, body: { isActive } },
      {
        onSuccess: () => {
          toast.success(isActive ? 'Đã kích hoạt thẻ.' : 'Đã tắt thẻ.');
          setTogglingId(null);
          if (selectedId === tag.id && !isActive) setSelectedId(null);
        },
        onError: err => {
          toast.error(getWasteTagMutationError(err, 'Không thể đổi trạng thái.'));
          setTogglingId(null);
        },
      }
    );
  };

  const formBusy = createMutation.isPending || updateMutation.isPending;

  const paginationBar =
    !isPending && !isError && filteredItems.length > 0 ? (
      <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-muted-foreground">
          Trang {pagination.page}/{pagination.totalPages} ·{' '}
          <span className="font-medium text-foreground">
            {pageItems.length.toLocaleString('vi-VN')}
          </span>{' '}
          / {pagination.totalItems.toLocaleString('vi-VN')} thẻ
          {searchQ.trim() ? ' (đã lọc)' : ''}
        </span>
        {pagination.totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrev}
              onClick={() => setQuery({ page: String(pagination.page - 1) })}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
              Trước
            </button>
            <button
              type="button"
              disabled={!pagination.hasNext}
              onClick={() => setQuery({ page: String(pagination.page + 1) })}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
            >
              Sau
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <div className="w-full min-w-0">
      <header className="mb-6 border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">
          Thẻ rác thải
          {catalogQuery.isPending && inactiveQuery.isPending ? (
            ' · …'
          ) : (
            <>
              {' '}
              · {activeTags.length} đang dùng · {inactiveTags.length} đã tắt
            </>
          )}
        </p>
      </header>

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <WasteTagLiveSearch
            key={status}
            value={searchQ}
            onChange={handleSearchChange}
            resultCount={searchQ.trim() ? filteredItems.length : undefined}
            totalCount={sourceTags.length}
            className="w-full sm:w-72"
          />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Trạng thái</span>
            <div className="flex h-10 rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => handleStatusChange('active')}
                className={`rounded-md px-4 text-sm font-medium transition ${
                  status === 'active'
                    ? 'bg-emerald-700 text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Đang dùng
                {!catalogQuery.isPending ? (
                  <span className="ml-1 tabular-nums opacity-90">{activeTags.length}</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('inactive')}
                className={`rounded-md px-4 text-sm font-medium transition ${
                  status === 'inactive'
                    ? 'bg-emerald-700 text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Đã tắt
                {!inactiveQuery.isPending ? (
                  <span className="ml-1 tabular-nums opacity-90">{inactiveTags.length}</span>
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
          Thêm thẻ rác thải
        </button>
      </section>

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Đang tải thẻ rác thải…
        </div>
      )}

      {isError && (
        <div className="py-16 text-center">
          <p className="text-sm text-destructive">
            {(error as Error)?.message ?? 'Không tải được thẻ rác thải.'}
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

      {!isPending && !isError && filteredItems.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {searchQ.trim() ? 'Không tìm thấy thẻ phù hợp.' : 'Chưa có thẻ trong nhóm này.'}
        </p>
      )}

      {!isPending && !isError && pageItems.length > 0 && status === 'active' && (
        <div className="rounded-xl border border-border/60 bg-gradient-to-b from-muted/20 to-transparent p-4 sm:p-6">
          <WasteTagCatalogFlow
            tags={pageItems}
            totalFiltered={filteredItems.length}
            selectedId={selectedId}
            togglingId={togglingId}
            toggleBusy={toggleMutation.isPending}
            onSelect={id => setSelectedId(prev => (prev === id ? null : id))}
            onEdit={setEditTag}
            onToggle={tag => handleToggle(tag, false)}
          />
          {paginationBar}
        </div>
      )}

      {!isPending && !isError && pageItems.length > 0 && status === 'inactive' && (
        <div className="rounded-xl border border-border/60 bg-gradient-to-b from-muted/20 to-transparent p-4 sm:p-6">
          <WasteTagInactiveFlow
            tags={pageItems}
            totalFiltered={filteredItems.length}
            selectedId={selectedId}
            togglingId={togglingId}
            toggleBusy={toggleMutation.isPending}
            onSelect={id => setSelectedId(prev => (prev === id ? null : id))}
            onEdit={setEditTag}
            onToggle={(tag, active) => handleToggle(tag, active)}
          />
          {paginationBar}
        </div>
      )}

      <WasteTagFormDialog
        open={createOpen}
        mode="create"
        busy={formBusy}
        defaultDisplayOrder={nextDisplayOrder}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <WasteTagFormDialog
        open={Boolean(editTag)}
        mode="edit"
        tag={editTag}
        busy={formBusy}
        onClose={() => setEditTag(null)}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
