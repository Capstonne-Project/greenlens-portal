'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import {
  getPollutionCategoryArchiveBlockedMessage,
  isAdminCatalogInUse,
} from '@/utils/adminCatalogGuards';

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
  const archiveBlocked =
    deactivating && category != null && isAdminCatalogInUse(category.reportCount);

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
            {archiveBlocked ? (
              getPollutionCategoryArchiveBlockedMessage(category.reportCount)
            ) : deactivating ? (
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
          <AdminDialogFooter
            onCancel={onClose}
            onConfirm={archiveBlocked ? undefined : onConfirm}
            cancelLabel={archiveBlocked ? 'Đóng' : 'Hủy'}
            confirmLabel={deactivating ? 'Ngưng' : 'Kích hoạt'}
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
