'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import type { SystemSettingItem } from '@/lib/api/models/adminSystemSettings';
import {
  getSystemSettingDisplay,
  systemSettingFormValueToPatchValue,
  systemSettingValueToFormValue,
} from '@/utils/adminSystemSettingsUi';
import { Loader2 } from 'lucide-react';

interface SystemSettingsConfirmDialogProps {
  open: boolean;
  moduleLabel: string;
  changedItems: SystemSettingItem[];
  formValues: Record<string, string>;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SystemSettingsConfirmDialog({
  open,
  moduleLabel,
  changedItems,
  formValues,
  busy,
  onClose,
  onConfirm,
}: SystemSettingsConfirmDialogProps) {
  return (
    <OfficeDialogShell
      open={open}
      title="Xác nhận cập nhật cấu hình"
      titleId="system-settings-confirm-title"
      onClose={onClose}
      size="wide"
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Bạn sắp thay đổi{' '}
          <span className="font-semibold text-foreground">{changedItems.length}</span> thiết lập
          trong nhóm <span className="font-semibold text-foreground">{moduleLabel}</span>. Thay đổi
          có hiệu lực ngay và có thể ảnh hưởng bảng nghi spam, cảnh báo quá hạn hoặc giới hạn gửi
          báo cáo.
        </p>

        {changedItems.length > 0 ? (
          <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 text-sm">
            {changedItems.map(item => {
              const display = getSystemSettingDisplay(item);
              return (
                <li key={item.key} className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{display.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{display.key}</span>
                  <span>
                    <span className="text-muted-foreground">
                      {systemSettingValueToFormValue(item) || item.defaultValue || '(trống)'}
                    </span>
                    <span className="mx-1.5 text-muted-foreground" aria-hidden>
                      →
                    </span>
                    <span className="font-medium text-foreground">
                      {systemSettingFormValueToPatchValue(item, formValues[item.key] ?? '') ||
                        '(trống)'}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}

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
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Xác nhận lưu
          </button>
        </div>
      </div>
    </OfficeDialogShell>
  );
}
