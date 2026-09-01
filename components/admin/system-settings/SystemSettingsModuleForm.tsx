'use client';

import { SystemSettingFieldHeader } from '@/components/admin/system-settings/SystemSettingFieldHeader';

import { AdminFormActions } from '@/components/admin/shared/AdminFormActions';

import {
  ADMIN_NUMBER_INPUT_CLASS,
  ADMIN_SECTION_TITLE,
  ADMIN_SETTING_CONTROL_COLUMN_CLASS,
  ADMIN_SETTING_UNIT_SLOT_CLASS,
  ADMIN_TEXT_INPUT_CLASS,
} from '@/components/admin/shared/adminUiTokens';

import { ValidatedInput } from '@/components/common/ValidatedField';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Switch } from '@/components/ui/switch';

import type { SystemSettingItem } from '@/lib/api/models/adminSystemSettings';

import { cn } from '@/lib/utils';

import {
  buildSystemSettingsItemsSignature,
  formatSystemSettingValidationError,
  getSystemSettingDisplay,
  isBooleanValueType,
  isNumericValueType,
  systemSettingValueToFormValue,
} from '@/utils/adminSystemSettingsUi';

import { RotateCcw, Save, Undo2 } from 'lucide-react';

import { useEffect, useMemo, useRef, useState } from 'react';

interface SystemSettingsModuleFormProps {
  moduleLabel: string;

  moduleDescription?: string | null;

  items: SystemSettingItem[];

  busy?: boolean;

  resetBusy?: boolean;

  onSave: (formValues: Record<string, string>) => void;

  onReset: () => void;
}

function NumericSettingControl({
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
  const parsed = value.trim() === '' ? NaN : Number(value);

  const tooLow = item.minValue != null && !Number.isNaN(parsed) && parsed < item.minValue;

  const tooHigh = item.maxValue != null && !Number.isNaN(parsed) && parsed > item.maxValue;

  const invalid = tooLow || tooHigh;

  const isInt = item.valueType.toLowerCase() === 'int';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Input
          id={`setting-${item.key}`}
          type="number"
          inputMode={isInt ? 'numeric' : 'decimal'}
          step={isInt ? 1 : 'any'}
          min={item.minValue ?? undefined}
          max={item.maxValue ?? undefined}
          value={value}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `setting-${item.key}-error` : undefined}
          onChange={e => onChange(e.target.value)}
          onFocus={e => e.target.select()}
          className={cn(
            ADMIN_NUMBER_INPUT_CLASS,

            invalid && 'border-destructive focus-visible:ring-destructive/30'
          )}
        />

        <span
          className={cn(ADMIN_SETTING_UNIT_SLOT_CLASS, !item.unit && 'invisible')}
          aria-hidden={!item.unit}
        >
          {item.unit ?? '\u00a0'}
        </span>
      </div>

      {invalid ? (
        <p id={`setting-${item.key}-error`} className="text-xs text-destructive" role="alert">
          {tooLow
            ? formatSystemSettingValidationError(item, 'min')
            : tooHigh
              ? formatSystemSettingValidationError(item, 'max')
              : 'Giá trị không hợp lệ'}
        </p>
      ) : null}
    </div>
  );
}

function SettingControl({
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
      <div className="flex items-center gap-2.5">
        <Switch
          id={`setting-${item.key}`}
          checked={checked}
          disabled={disabled}
          onCheckedChange={next => onChange(next ? 'true' : 'false')}
          className="data-[state=checked]:bg-emerald-700"
        />

        <span
          className={cn(
            'text-xs font-medium',
            checked ? 'text-emerald-800' : 'text-muted-foreground'
          )}
        >
          {checked ? 'Bật' : 'Tắt'}
        </span>
      </div>
    );
  }

  if (isNumericValueType(item.valueType)) {
    return (
      <NumericSettingControl item={item} value={value} disabled={disabled} onChange={onChange} />
    );
  }

  return (
    <ValidatedInput
      id={`setting-${item.key}`}
      value={value}
      placeholder="—"
      maxLength={500}
      showCounter={false}
      disabled={disabled}
      className={ADMIN_TEXT_INPUT_CLASS}
      onChange={e => onChange(e.target.value)}
    />
  );
}

export function SystemSettingsModuleForm({
  moduleLabel,

  moduleDescription,

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

  const changedCount = useMemo(
    () =>
      items.filter(item => (formValues[item.key] ?? '') !== (initialValues[item.key] ?? '')).length,

    [formValues, initialValues, items]
  );

  const hasChanges = changedCount > 0;

  const hasInvalidNumbers = useMemo(
    () =>
      items.some(item => {
        if (!isNumericValueType(item.valueType)) return false;

        const raw = (formValues[item.key] ?? '').trim();

        if (raw === '') return true;

        const parsed = Number(raw);

        if (Number.isNaN(parsed)) return true;

        if (item.minValue != null && parsed < item.minValue) return true;

        if (item.maxValue != null && parsed > item.maxValue) return true;

        return false;
      }),

    [formValues, items]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasInvalidNumbers) return;

    onSave(formValues);
  };

  const resetField = (item: SystemSettingItem) => {
    setFormValues(prev => ({
      ...prev,

      [item.key]: initialValues[item.key] ?? '',
    }));
  };

  const discardAll = () => {
    setFormValues(initialValues);
  };

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Nhóm <span className="font-medium text-foreground">{moduleLabel}</span> chưa có thiết lập
          nào.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="mb-6">
        <div className="min-w-0">
          <h2 className={ADMIN_SECTION_TITLE}>{moduleLabel}</h2>

          {moduleDescription ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {moduleDescription}
            </p>
          ) : null}

          <p className="mt-2 text-xs text-muted-foreground">
            {items.length} thiết lập
            {hasChanges ? (
              <span className="text-amber-700"> · {changedCount} thay đổi chưa lưu</span>
            ) : null}
          </p>
        </div>
      </header>

      <div className="min-w-0 flex-1">
        <ul className="divide-y divide-border/60">
          {items.map(item => {
            const isModified = (formValues[item.key] ?? '') !== (initialValues[item.key] ?? '');

            const disabled = busy || resetBusy || !item.isActive;

            return (
              <li
                key={item.id || item.key}
                className={cn(
                  'grid gap-4 py-5 first:pt-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-8',

                  isModified &&
                    'relative before:absolute before:inset-y-0 before:-left-3 before:w-0.5 before:bg-amber-500/70 md:before:-left-4',

                  !item.isActive && 'opacity-50'
                )}
              >
                <SystemSettingFieldHeader item={item} isModified={isModified} />

                <div className="flex items-start gap-2 md:pt-0.5">
                  <div className={ADMIN_SETTING_CONTROL_COLUMN_CLASS}>
                    <SettingControl
                      item={item}
                      value={formValues[item.key] ?? ''}
                      disabled={disabled}
                      onChange={next =>
                        setFormValues(prev => ({
                          ...prev,

                          [item.key]: next,
                        }))
                      }
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => resetField(item)}
                    disabled={disabled || !isModified}
                    title="Hoàn tác"
                    aria-label={`Hoàn tác ${getSystemSettingDisplay(item).label}`}
                    aria-hidden={!isModified}
                    tabIndex={isModified ? 0 : -1}
                    className={cn(
                      'size-8 shrink-0 text-muted-foreground',
                      !isModified && 'pointer-events-none invisible'
                    )}
                  >
                    <Undo2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {hasChanges ? (
        <AdminFormActions
          sticky
          className="mt-8 animate-in fade-in slide-in-from-bottom-1 duration-200"
          message={
            <>
              <span className="font-medium text-foreground">{changedCount}</span> thiết lập sẽ được
              cập nhật
            </>
          }
          actions={[
            {
              label: 'Hủy',

              onClick: discardAll,

              disabled: busy || resetBusy,

              variant: 'ghost',
            },

            {
              label: 'Khôi phục mặc định',

              onClick: onReset,

              disabled: busy || resetBusy,

              loading: resetBusy,

              icon: RotateCcw,

              variant: 'outline',
            },

            {
              label: 'Lưu thay đổi',
              type: 'submit',
              disabled: !hasChanges || busy || resetBusy || hasInvalidNumbers,
              loading: busy,
              icon: Save,
              variant: 'default',
            },
          ]}
        />
      ) : null}
    </form>
  );
}
