'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';

import type { SystemSettingItem } from '@/lib/api/models/adminSystemSettings';

import {
  formatSystemSettingValueWithUnit,
  getSystemSettingDisplay,
  systemSettingFormValueToPatchValue,
  systemSettingValueToFormValue,
} from '@/utils/adminSystemSettingsUi';

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
      title="Xác nhận thay đổi cấu hình?"
      titleId="system-settings-confirm-title"
      onClose={onClose}
      size="wide"
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Bạn sắp áp dụng{' '}
          <span className="font-semibold text-foreground">{changedItems.length}</span> thay đổi
          trong nhóm <span className="font-semibold text-foreground">{moduleLabel}</span>. Thay đổi
          có hiệu lực ngay sau khi xác nhận.
        </p>

        {changedItems.length > 0 ? (
          <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-background text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="pb-2 pr-3 font-semibold">Thiết lập</th>

                  <th className="pb-2 pr-3 font-semibold">Trước</th>

                  <th className="pb-2 font-semibold">Sau</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {changedItems.map(item => {
                  const display = getSystemSettingDisplay(item);

                  const before = formatSystemSettingValueWithUnit(
                    systemSettingValueToFormValue(item) || '—',
                    item.unit
                  );

                  const after = formatSystemSettingValueWithUnit(
                    systemSettingFormValueToPatchValue(item, formValues[item.key] ?? '') || '—',
                    item.unit
                  );

                  return (
                    <tr key={item.key}>
                      <td className="py-2.5 pr-3 align-top">
                        <p className="font-medium text-foreground">{display.label}</p>
                      </td>

                      <td className="py-2.5 pr-3 align-top text-xs text-muted-foreground">
                        {before}
                      </td>

                      <td className="py-2.5 align-top text-xs font-semibold text-emerald-800">
                        {after}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        <AdminDialogFooter
          onCancel={onClose}
          onConfirm={onConfirm}
          cancelDisabled={busy}
          confirmDisabled={busy}
          confirmLoading={busy}
          confirmLabel="Xác nhận áp dụng"
        />
      </div>
    </OfficeDialogShell>
  );
}
