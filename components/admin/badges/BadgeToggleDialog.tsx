'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import type { AdminBadge } from '@/lib/api/models/adminBadge';
import { Loader2 } from 'lucide-react';

interface BadgeToggleDialogProps {
  badge: AdminBadge | null;
  /** true = bật lại, false = vô hiệu hóa */
  isActive: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function BadgeToggleDialog({
  badge,
  isActive,
  busy,
  onClose,
  onConfirm,
}: BadgeToggleDialogProps) {
  const deactivating = !isActive;

  return (
    <OfficeDialogShell
      open={badge != null}
      title={deactivating ? 'Vô hiệu hóa huy hiệu' : 'Kích hoạt huy hiệu'}
      titleId="admin-badge-toggle-title"
      onClose={onClose}
    >
      {badge && (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {deactivating ? (
              <>
                Bạn có chắc muốn vô hiệu hóa{' '}
                <span className="font-semibold text-foreground">{badge.nameVi}</span> (
                <span className="font-mono text-xs">{badge.code}</span>)? Huy hiệu sẽ không xuất
                hiện trong danh mục công khai và không được trao tự động mới.
              </>
            ) : (
              <>
                Kích hoạt lại <span className="font-semibold text-foreground">{badge.nameVi}</span>{' '}
                (<span className="font-mono text-xs">{badge.code}</span>)? Huy hiệu sẽ hiện lại
                trong danh mục công khai và có thể được trao tự động.
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
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {deactivating ? 'Vô hiệu hóa' : 'Kích hoạt'}
            </button>
          </div>
        </div>
      )}
    </OfficeDialogShell>
  );
}
