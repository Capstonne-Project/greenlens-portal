'use client';

import { SystemSettingFieldHeader } from '@/components/admin/system-settings/SystemSettingFieldHeader';
import { ValidatedInput, ValidatedNumberInput } from '@/components/common/ValidatedField';
import type { SystemSettingItem } from '@/lib/api/models/adminSystemSettings';
import {
  buildSystemSettingsItemsSignature,
  getSystemSettingPlaceholder,
  isBooleanValueType,
  isNumericValueType,
  systemSettingValueToFormValue,
} from '@/utils/adminSystemSettingsUi';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface SystemSettingsModuleFormProps {
  moduleLabel: string;
  items: SystemSettingItem[];
  busy?: boolean;
  resetBusy?: boolean;
  onSave: (formValues: Record<string, string>) => void;
  onReset: () => void;
}

function SettingField({
  item,
  value,
  disabled,
  onChange,
}: {
  item: SystemSettingItem;
  value: string;
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  if (isBooleanValueType(item.valueType)) {
    const checked = value === 'true';
    return (
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked ? 'true' : 'false')}
          className="size-4 rounded border-border text-emerald-700 focus:ring-emerald-600"
        />
        <span>{checked ? 'Bật' : 'Tắt'}</span>
      </label>
    );
  }

  const placeholder = getSystemSettingPlaceholder(item);

  if (isNumericValueType(item.valueType)) {
    return (
      <ValidatedNumberInput
        id={`setting-${item.key}`}
        min={item.minValue ?? undefined}
        max={item.maxValue ?? undefined}
        value={value}
        placeholder={placeholder}
        showCounter={false}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
      />
    );
  }

  return (
    <ValidatedInput
      id={`setting-${item.key}`}
      value={value}
      placeholder={placeholder}
      maxLength={500}
      showCounter={false}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
    />
  );
}

export function SystemSettingsModuleForm({
  moduleLabel,
  items,
  busy,
  resetBusy,
  onSave,
  onReset,
}: SystemSettingsModuleFormProps) {
  const itemsSignature = useMemo(() => buildSystemSettingsItemsSignature(items), [items]);

  const initialValues = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of items) {
      map[item.key] = systemSettingValueToFormValue(item);
    }
    return map;
  }, [itemsSignature, items]);

  const [formValues, setFormValues] = useState<Record<string, string>>(initialValues);
  const syncedSignatureRef = useRef(itemsSignature);

  useEffect(() => {
    if (syncedSignatureRef.current === itemsSignature) return;
    syncedSignatureRef.current = itemsSignature;
    setFormValues(initialValues);
  }, [itemsSignature, initialValues]);

  const hasChanges = useMemo(
    () => items.some(item => (formValues[item.key] ?? '') !== initialValues[item.key]),
    [formValues, initialValues, items]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formValues);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-white p-6 text-sm text-muted-foreground">
        Module <span className="font-medium text-foreground">{moduleLabel}</span> chưa có thiết lập
        nào.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm md:p-6"
    >
      <header className="mb-5 border-b border-border pb-4">
        <h2 className="text-lg font-semibold text-foreground">{moduleLabel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{items.length} thiết lập</p>
      </header>

      <div className="space-y-5">
        {items.map(item => (
          <div
            key={item.id || item.key}
            className="grid gap-2 border-b border-border/60 pb-5 last:border-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(0,220px)] md:items-start md:gap-6"
          >
            <SystemSettingFieldHeader item={item} />
            <SettingField
              item={item}
              value={formValues[item.key] ?? ''}
              disabled={busy || resetBusy || !item.isActive}
              onChange={next =>
                setFormValues(prev => ({
                  ...prev,
                  [item.key]: next,
                }))
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onReset}
          disabled={busy || resetBusy}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          {resetBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          <RotateCcw className="size-4" aria-hidden />
          Reset mặc định
        </button>
        <button
          type="submit"
          disabled={!hasChanges || busy || resetBusy}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          <Save className="size-4" aria-hidden />
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
}
