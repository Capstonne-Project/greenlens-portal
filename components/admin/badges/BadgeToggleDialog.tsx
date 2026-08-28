'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import type { AdminBadge } from '@/lib/api/models/adminBadge';

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
          <AdminDialogFooter
            onCancel={onClose}
            onConfirm={onConfirm}
            confirmLabel={deactivating ? 'Vô hiệu hóa' : 'Kích hoạt'}
            confirmLoading={busy}
            cancelDisabled={busy}
            confirmDisabled={busy}
            confirmVariant={deactivating ? 'destructive' : 'default'}
          />
        </div>
      )}
    </OfficeDialogShell>
  );
}
