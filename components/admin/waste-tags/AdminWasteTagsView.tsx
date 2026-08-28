'use client';

import { ADMIN_PAGINATION_BTN, ADMIN_TOOLBAR_CTA } from '@/components/admin/shared/adminUiTokens';
import { WasteTagCatalogFlow } from '@/components/admin/waste-tags/WasteTagCatalogFlow';
import { AdminRetryButton } from '@/components/admin/shared/AdminRetryButton';
import { Button } from '@/components/ui/button';
import { ADMIN_TABLE_PAGINATION_NAV } from '@/components/admin/shared/adminDataTableChrome';
import { WasteTagInactiveFlow } from '@/components/admin/waste-tags/WasteTagInactiveFlow';
import { WasteTagLiveSearch } from '@/components/admin/waste-tags/WasteTagLiveSearch';
import { AdminFilterStatusToggle } from '@/components/admin/shared/AdminFilterToolbar';
import {
  WasteTagFormDialog,
  type WasteTagFormValues,
} from '@/components/admin/waste-tags/WasteTagFormDialog';
import { WasteTagToggleDialog } from '@/components/admin/waste-tags/WasteTagToggleDialog';
import {
  useCreateWasteTag,
  useAdminWasteTagsList,
  useToggleWasteTag,
  useUpdateWasteTag,
} from '@/hooks/useWasteTags';
import {
  ADMIN_WASTE_TAGS_LIST_FETCH_SIZE,
  ADMIN_WASTE_TAGS_PAGE_SIZE,
} from '@/lib/constants/adminWasteTags';
import type { WasteTag } from '@/lib/api/models/wasteTag';
import {
  getWasteTagDeactivateBlockedMessage,
  isAdminCatalogInUse,
} from '@/utils/adminCatalogGuards';
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
  const [toggleTarget, setToggleTarget] = useState<{
    tag: WasteTag;
    isActive: boolean;
  } | null>(null);

  const activeQuery = useAdminWasteTagsList({
    isActive: true,
    page: 1,
    pageSize: ADMIN_WASTE_TAGS_LIST_FETCH_SIZE,
    sortBy: 'displayOrder',
    sortDesc: false,
  });
  const inactiveQuery = useAdminWasteTagsList({
    isActive: false,
    page: 1,
    pageSize: ADMIN_WASTE_TAGS_LIST_FETCH_SIZE,
    sortBy: 'displayOrder',
    sortDesc: false,
  });

  const activeTags = activeQuery.data?.items ?? EMPTY_TAGS;
  const inactiveTags = inactiveQuery.data?.items ?? EMPTY_TAGS;
  const sourceTags = status === 'active' ? activeTags : inactiveTags;

  const createMutation = useCreateWasteTag();
  const updateMutation = useUpdateWasteTag();
  const toggleMutation = useToggleWasteTag();

  const isPending = status === 'active' ? activeQuery.isPending : inactiveQuery.isPending;
  const isError = status === 'active' ? activeQuery.isError : inactiveQuery.isError;
  const error = status === 'active' ? activeQuery.error : inactiveQuery.error;

  const refetch = useCallback(() => {
    void activeQuery.refetch();
    void inactiveQuery.refetch();
  }, [activeQuery, inactiveQuery]);

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

  const requestToggle = (tag: WasteTag, isActive: boolean) => {
    if (!isActive && isAdminCatalogInUse(tag.reportCount)) {
      toast.error(getWasteTagDeactivateBlockedMessage(tag.reportCount));
      return;
    }
    setToggleTarget({ tag, isActive });
  };

  const confirmToggle = () => {
    if (!toggleTarget) return;
    const { tag, isActive } = toggleTarget;
    setTogglingId(tag.id);
    toggleMutation.mutate(
      { id: tag.id, body: { isActive } },
      {
        onSuccess: () => {
          toast.success(isActive ? 'Đã kích hoạt thẻ.' : 'Đã vô hiệu hóa thẻ.');
          setTogglingId(null);
          setToggleTarget(null);
          if (selectedId === tag.id) setSelectedId(null);
          if (!isActive) handleStatusChange('inactive');
        },
        onError: err => {
          toast.error(getWasteTagMutationError(err, 'Không thể đổi trạng thái.', tag.reportCount));
          setTogglingId(null);
        },
      }
    );
  };

  const formBusy = createMutation.isPending || updateMutation.isPending;

  const paginationBar =
    !isPending && !isError && filteredItems.length > 0 ? (
      <div className={ADMIN_TABLE_PAGINATION_NAV}>
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => setQuery({ page: String(pagination.page - 1) })}
              className={ADMIN_PAGINATION_BTN}
            >
              <ChevronLeft className="size-3.5" />
              Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setQuery({ page: String(pagination.page + 1) })}
              className={ADMIN_PAGINATION_BTN}
            >
              Sau
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <div className="w-full min-w-0">
      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <WasteTagLiveSearch
            value={searchQ}
            onChange={handleSearchChange}
            className="w-full sm:w-72"
          />

          <AdminFilterStatusToggle
            isActive={status === 'active'}
            inactiveLabel="Đã tắt"
            onActive={() => handleStatusChange('active')}
            onInactive={() => handleStatusChange('inactive')}
            activeBadge={!activeQuery.isPending ? activeTags.length : undefined}
            inactiveBadge={!inactiveQuery.isPending ? inactiveTags.length : undefined}
          />
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className={ADMIN_TOOLBAR_CTA}
        >
          <Plus className="size-4" />
          Thêm thẻ rác thải
        </Button>
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
          <div className="mt-2">
            <AdminRetryButton onClick={() => void refetch()} />
          </div>
        </div>
      )}

      {!isPending && !isError && filteredItems.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {searchQ.trim() ? 'Không tìm thấy thẻ phù hợp.' : 'Chưa có thẻ trong nhóm này.'}
        </p>
      )}

      {!isPending && !isError && pageItems.length > 0 && status === 'active' && (
        <div>
          <WasteTagCatalogFlow
            tags={pageItems}
            totalFiltered={filteredItems.length}
            selectedId={selectedId}
            togglingId={togglingId}
            toggleBusy={togglingId != null && toggleMutation.isPending}
            onSelect={id => setSelectedId(prev => (prev === id ? null : id))}
            onEdit={setEditTag}
            onToggle={tag => requestToggle(tag, false)}
          />
          {paginationBar}
        </div>
      )}

      {!isPending && !isError && pageItems.length > 0 && status === 'inactive' && (
        <div>
          <WasteTagInactiveFlow
            tags={pageItems}
            totalFiltered={filteredItems.length}
            selectedId={selectedId}
            togglingId={togglingId}
            toggleBusy={togglingId != null && toggleMutation.isPending}
            onSelect={id => setSelectedId(prev => (prev === id ? null : id))}
            onEdit={setEditTag}
            onToggle={(tag, active) => requestToggle(tag, active)}
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
      <WasteTagToggleDialog
        tag={toggleTarget?.tag ?? null}
        isActive={toggleTarget?.isActive ?? false}
        busy={toggleMutation.isPending}
        onClose={() => {
          if (!toggleMutation.isPending) setToggleTarget(null);
        }}
        onConfirm={confirmToggle}
      />
    </div>
  );
}
