'use client';

import { BadgeCard } from '@/components/admin/badges/BadgeCard';
import { BadgeFormDialog, type BadgeFormValues } from '@/components/admin/badges/BadgeFormDialog';
import { BadgeIconPreviewDialog } from '@/components/admin/badges/BadgeIconPreviewDialog';
import { BadgeToggleDialog } from '@/components/admin/badges/BadgeToggleDialog';
import {
  AdminFilterSearch,
  AdminFilterStatusToggle,
} from '@/components/admin/shared/AdminFilterToolbar';
import { ADMIN_TABLE_PAGINATION_NAV } from '@/components/admin/shared/adminDataTableChrome';
import {
  useAdminBadgesList,
  useToggleAdminBadge,
  useUpdateAdminBadge,
} from '@/hooks/useAdminBadges';
import type { AdminBadge } from '@/lib/api/models/adminBadge';
import { ADMIN_BADGES_PAGE_SIZE } from '@/lib/constants/adminBadges';
import { getAdminBadgeMutationError } from '@/utils/adminBadgeErrors';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

type StatusFilter = 'active' | 'inactive';

export function AdminBadgesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status: StatusFilter = searchParams.get('status') === 'inactive' ? 'inactive' : 'active';
  const searchQ = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [editBadge, setEditBadge] = useState<AdminBadge | null>(null);
  const [previewBadge, setPreviewBadge] = useState<AdminBadge | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<{
    badge: AdminBadge;
    isActive: boolean;
  } | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      pageSize: ADMIN_BADGES_PAGE_SIZE,
      ...(searchQ.trim() ? { search: searchQ.trim() } : {}),
      isActive: status === 'active',
      sortBy: 'code' as const,
      sortDesc: false,
    }),
    [page, searchQ, status]
  );

  const listQuery = useAdminBadgesList(listParams);
  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination;

  const updateMutation = useUpdateAdminBadge();
  const toggleMutation = useToggleAdminBadge();

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

  const handleUpdate = (values: BadgeFormValues) => {
    if (!editBadge) return;
    updateMutation.mutate(
      {
        id: editBadge.id,
        body: {
          nameVi: values.nameVi.trim(),
          nameEn: values.nameEn.trim(),
          ...(values.description?.trim() ? { description: values.description.trim() } : {}),
          ...(values.iconUrl?.trim() ? { iconUrl: values.iconUrl.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật huy hiệu.');
          setEditBadge(null);
        },
        onError: err =>
          toast.error(getAdminBadgeMutationError(err, 'Không thể cập nhật huy hiệu.')),
      }
    );
  };

  const requestToggle = (badge: AdminBadge, isActive: boolean) => {
    setToggleTarget({ badge, isActive });
  };

  const confirmToggle = () => {
    if (!toggleTarget) return;
    const { badge, isActive } = toggleTarget;
    setTogglingId(badge.id);
    toggleMutation.mutate(
      { id: badge.id, body: { isActive } },
      {
        onSuccess: () => {
          toast.success(isActive ? 'Đã kích hoạt huy hiệu.' : 'Đã vô hiệu hóa huy hiệu.');
          setTogglingId(null);
          setToggleTarget(null);
          if (!isActive) setQuery({ status: 'inactive', page: '1' });
        },
        onError: err => {
          toast.error(getAdminBadgeMutationError(err, 'Không thể đổi trạng thái.'));
          setTogglingId(null);
        },
      }
    );
  };

  const formBusy = updateMutation.isPending;
  const isPending = listQuery.isPending;
  const isError = listQuery.isError;
  const error = listQuery.error;

  return (
    <div className="w-full min-w-0">
      <header className="mb-6 border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">
          Quản lý huy hiệu thành tích · chỉnh nội dung và bật/tắt hiển thị
          {pagination ? <> · {pagination.totalItems.toLocaleString('vi-VN')} kết quả</> : null}
        </p>
      </header>

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <AdminFilterSearch
            id="badge-search"
            label="Tìm huy hiệu"
            value={searchQ}
            onCommit={handleSearchCommit}
            placeholder="code, tên VN, tên EN, mô tả…"
          />
          <AdminFilterStatusToggle
            isActive={status === 'active'}
            inactiveLabel="Đã tắt"
            onActive={() => setQuery({ status: null, page: '1' })}
            onInactive={() => setQuery({ status: 'inactive', page: '1' })}
          />
        </div>
      </section>

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Đang tải huy hiệu…
        </div>
      )}

      {isError && (
        <div className="py-16 text-center">
          <p className="text-sm text-destructive">
            {(error as Error)?.message ?? 'Không tải được danh sách huy hiệu.'}
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
          {searchQ ? 'Không tìm thấy huy hiệu phù hợp.' : 'Chưa có huy hiệu trong nhóm này.'}
        </p>
      )}

      {!isPending && !isError && items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map(badge => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onEdit={setEditBadge}
                onToggle={requestToggle}
                onPreviewIcon={setPreviewBadge}
                toggleBusy={togglingId === badge.id && toggleMutation.isPending}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className={ADMIN_TABLE_PAGINATION_NAV}>
              <span className="text-xs text-muted-foreground">
                Trang {pagination.page}/{Math.max(1, pagination.totalPages)} ·{' '}
                {pagination.totalItems.toLocaleString('vi-VN')} huy hiệu
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

      <BadgeFormDialog
        open={Boolean(editBadge)}
        badge={editBadge}
        busy={formBusy}
        onClose={() => setEditBadge(null)}
        onSubmit={handleUpdate}
      />
      <BadgeToggleDialog
        badge={toggleTarget?.badge ?? null}
        isActive={toggleTarget?.isActive ?? false}
        busy={toggleMutation.isPending}
        onClose={() => {
          if (!toggleMutation.isPending) setToggleTarget(null);
        }}
        onConfirm={confirmToggle}
      />
      <BadgeIconPreviewDialog
        badge={previewBadge}
        open={previewBadge != null}
        onClose={() => setPreviewBadge(null)}
      />
    </div>
  );
}
