'use client';

import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
  ADMIN_TABLE_PAGINATION_FOOTER,
  ADMIN_TABLE_PAGINATION_META,
  adminTableCellPad,
} from '@/components/admin/shared/adminDataTableChrome';
import { BlockedWordFormDialog } from '@/components/admin/blocked-words/BlockedWordFormDialog';
import { GreenLensLookupSpinner } from '@/components/ui/greenlens-lookup-spinner';
import { PaginationSimple } from '@/components/ui/pagination';
import {
  useBlockedWordsList,
  useCreateBlockedWord,
  useDeleteBlockedWord,
  useUpdateBlockedWord,
} from '@/hooks/useBlockedWords';
import type { BlockedWord } from '@/lib/api/models/blockedWord';
import { ADMIN_BLOCKED_WORDS_PAGE_SIZE } from '@/lib/constants/adminBlockedWords';
import { cn } from '@/lib/utils';
import { getBlockedWordMutationError } from '@/utils/blockedWordErrors';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function AdminBlockedWordsView() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BlockedWord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlockedWord | null>(null);

  const { data, isPending, isError, refetch } = useBlockedWordsList({
    page,
    pageSize: ADMIN_BLOCKED_WORDS_PAGE_SIZE,
  });

  const createMutation = useCreateBlockedWord();
  const updateMutation = useUpdateBlockedWord();
  const deleteMutation = useDeleteBlockedWord();

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: env => {
        toast.success(env.message?.trim() || 'Đã xóa từ cấm.');
        setDeleteTarget(null);
      },
      onError: err => toast.error(getBlockedWordMutationError(err, 'Không thể xóa từ cấm.')),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Danh sách từ cấm dùng để lọc bình luận và mô tả báo cáo.
        </p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus className="size-4" aria-hidden />
          Thêm từ
        </button>
      </div>

      <div className={ADMIN_TABLE_SHELL}>
        <div className={ADMIN_TABLE_SCROLL}>
          <table className={ADMIN_TABLE_CLASS}>
            <thead>
              <tr className={ADMIN_TABLE_ROW_BORDER}>
                <th className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('first', 'head'))}>
                  Từ cấm
                </th>
                <th className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}>
                  Trạng thái
                </th>
                <th
                  className={cn(
                    ADMIN_TABLE_HEAD_CELL,
                    adminTableCellPad('last', 'head'),
                    'text-right'
                  )}
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td colSpan={3} className="h-32 text-center">
                    <GreenLensLookupSpinner className="mx-auto size-8" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={3} className="h-32 text-center text-sm text-destructive">
                    Không tải được danh sách.{' '}
                    <button type="button" onClick={() => void refetch()} className="underline">
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="h-32 text-center text-sm text-muted-foreground">
                    Chưa có từ cấm.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-muted/30')}>
                    <td className={adminTableCellPad('first')}>
                      <span className="font-medium">{item.word}</span>
                    </td>
                    <td className={adminTableCellPad('middle')}>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-900'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {item.isActive ? 'Đang bật' : 'Đã tắt'}
                      </span>
                    </td>
                    <td className={cn(adminTableCellPad('last'), 'text-right')}>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditTarget(item)}
                          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className={ADMIN_TABLE_PAGINATION_FOOTER}>
            <PaginationSimple
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
            <p className={ADMIN_TABLE_PAGINATION_META}>
              {pagination.totalItems.toLocaleString('vi-VN')} từ
            </p>
          </div>
        ) : null}
      </div>

      <BlockedWordFormDialog
        open={createOpen}
        mode="create"
        busy={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={values => {
          createMutation.mutate(values, {
            onSuccess: () => {
              toast.success('Đã thêm từ cấm.');
              setCreateOpen(false);
            },
            onError: err => toast.error(getBlockedWordMutationError(err, 'Không thể thêm từ cấm.')),
          });
        }}
      />

      <BlockedWordFormDialog
        open={Boolean(editTarget)}
        mode="edit"
        initial={editTarget}
        busy={updateMutation.isPending}
        onClose={() => setEditTarget(null)}
        onSubmit={values => {
          if (!editTarget) return;
          updateMutation.mutate(
            { id: editTarget.id, body: { word: values.word, isActive: editTarget.isActive } },
            {
              onSuccess: env => {
                toast.success(env.message?.trim() || 'Đã cập nhật từ cấm.');
                setEditTarget(null);
              },
              onError: err =>
                toast.error(getBlockedWordMutationError(err, 'Không thể cập nhật từ cấm.')),
            }
          );
        }}
      />

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Đóng"
            onClick={() => !deleteMutation.isPending && setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border bg-card p-6 shadow-xl">
            <p className="text-sm">
              Xóa từ <strong>{deleteTarget.word}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
