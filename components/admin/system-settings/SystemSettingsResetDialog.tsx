'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';

interface SystemSettingsResetDialogProps {
  open: boolean;

  moduleLabel: string;

  busy?: boolean;

  onClose: () => void;

  onConfirm: () => void;
}

export function SystemSettingsResetDialog({
  open,

  moduleLabel,

  busy,

  onClose,

  onConfirm,
}: SystemSettingsResetDialogProps) {
  return (
    <OfficeDialogShell
      open={open}
      title="Khôi phục về mặc định"
      titleId="system-settings-reset-title"
      onClose={onClose}
    >
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-amber-900/90">
          Toàn bộ thiết lập trong nhóm{' '}
          <span className="font-semibold text-foreground">{moduleLabel}</span> sẽ được khôi phục về
          giá trị mặc định ban đầu. Hành động này không thể hoàn tác.
        </p>

        <AdminDialogFooter
          onCancel={onClose}
          onConfirm={onConfirm}
          cancelDisabled={busy}
          confirmDisabled={busy}
          confirmLoading={busy}
          confirmLabel="Khôi phục mặc định"
          confirmVariant="destructive"
        />
      </div>
    </OfficeDialogShell>
  );
}
