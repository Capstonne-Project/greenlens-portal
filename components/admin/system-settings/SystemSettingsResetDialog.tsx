'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { Loader2 } from 'lucide-react';

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
      title="Reset về mặc định"
      titleId="system-settings-reset-title"
      onClose={onClose}
    >
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Khôi phục toàn bộ thiết lập module{' '}
          <span className="font-semibold text-foreground">{moduleLabel}</span> về giá trị seed mặc
          định? Hành động này không thể hoàn tác.
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
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Reset module
          </button>
        </div>
      </div>
    </OfficeDialogShell>
  );
}
