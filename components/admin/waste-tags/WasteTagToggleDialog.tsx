'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import type { WasteTag } from '@/lib/api/models/wasteTag';
import {
  getWasteTagDeactivateBlockedMessage,
  isAdminCatalogInUse,
} from '@/utils/adminCatalogGuards';

interface WasteTagToggleDialogProps {
  tag: WasteTag | null;
  /** true = bật lại, false = vô hiệu hóa */
  isActive: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function WasteTagToggleDialog({
  tag,
  isActive,
  busy,
  onClose,
  onConfirm,
}: WasteTagToggleDialogProps) {
  const deactivating = !isActive;
  const deactivateBlocked = deactivating && tag != null && isAdminCatalogInUse(tag.reportCount);

  return (
    <OfficeDialogShell
      open={tag != null}
      title={deactivating ? 'Vô hiệu hóa thẻ' : 'Kích hoạt thẻ'}
      titleId="admin-waste-tag-toggle-title"
      onClose={onClose}
    >
      {tag && (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {deactivateBlocked ? (
              getWasteTagDeactivateBlockedMessage(tag.reportCount)
            ) : deactivating ? (
              <>
                Bạn có chắc muốn vô hiệu hóa{' '}
                <span className="font-semibold text-foreground">{tag.nameVi}</span> (
                <span className="font-mono text-xs">{tag.code}</span>)? Thẻ sẽ chuyển sang tab Đã
                tắt và có thể bật lại sau.
              </>
            ) : (
              <>
                Kích hoạt lại <span className="font-semibold text-foreground">{tag.nameVi}</span> (
                <span className="font-mono text-xs">{tag.code}</span>)? Thẻ sẽ hiện lại trên form
                báo cáo.
              </>
            )}
          </p>
          <AdminDialogFooter
            onCancel={onClose}
            onConfirm={deactivateBlocked ? undefined : onConfirm}
            cancelLabel={deactivateBlocked ? 'Đóng' : 'Hủy'}
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
