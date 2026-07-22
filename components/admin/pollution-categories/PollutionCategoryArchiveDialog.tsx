'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import { Loader2 } from 'lucide-react';

interface PollutionCategoryArchiveDialogProps {
  category: PollutionCategory | null;
  /** true = ngưng, false = kích hoạt lại */
  archive: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PollutionCategoryArchiveDialog({
  category,
  archive,
  busy,
  onClose,
  onConfirm,
}: PollutionCategoryArchiveDialogProps) {
  const deactivating = archive;

  return (
    <OfficeDialogShell
      open={category != null}
      title={deactivating ? 'Ngưng danh mục' : 'Kích hoạt danh mục'}
      titleId="admin-pollution-category-archive-title"
      onClose={onClose}
    >
      {category && (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {deactivating ? (
              <>
                Bạn có chắc muốn ngưng{' '}
                <span className="font-semibold text-foreground">{category.nameVi}</span> (
                <span className="font-mono text-xs">{category.code}</span>)? Danh mục sẽ chuyển sang
                tab Ngưng và có thể kích hoạt lại sau.
              </>
            ) : (
              <>
                Kích hoạt lại{' '}
                <span className="font-semibold text-foreground">{category.nameVi}</span> (
                <span className="font-mono text-xs">{category.code}</span>)? Danh mục sẽ nhận báo
                cáo mới trở lại.
              </>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-60 ${
                deactivating
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {deactivating ? 'Ngưng' : 'Kích hoạt'}
            </button>
          </div>
        </div>
      )}
    </OfficeDialogShell>
  );
}
