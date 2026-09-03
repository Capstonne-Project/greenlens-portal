import type { SystemSettingItem, SystemSettingModule } from '@/lib/api/models/adminSystemSettings';
import {
  inferSystemSettingDetail,
  inferSystemSettingLabel,
} from '@/lib/constants/adminSystemSettingsDisplay';
import {
  isHiddenSystemSettingItem,
  isHiddenSystemSettingModule,
  isRetiredSystemSettingKey,
} from '@/lib/constants/adminSystemSettings';

export type SystemSettingDisplay = {
  label: string;
  detail: string;
  key: string;
  unit: string | null;
};

/** Label — ưu tiên `title` từ BE; fallback suy luận key khi dev/mock thiếu. */
export function getSystemSettingLabel(item: SystemSettingItem): string {
  const title = item.title?.trim();
  if (title) return title;
  return inferSystemSettingLabel(item.key);
}

/** Helper / tooltip — ưu tiên `description` từ BE. */
export function getSystemSettingDetail(item: SystemSettingItem): string {
  const description = item.description?.trim();
  if (description) return description;
  return inferSystemSettingDetail(item.key);
}

/** Hiển thị form + dialog — label/detail từ API, không hardcode catalog FE. */
export function getSystemSettingDisplay(item: SystemSettingItem): SystemSettingDisplay {
  return {
    label: getSystemSettingLabel(item),
    detail: getSystemSettingDetail(item),
    key: item.key,
    unit: item.unit,
  };
}

export function formatSystemSettingValueWithUnit(value: string, unit: string | null): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '—') return '—';
  return unit ? `${trimmed} ${unit}` : trimmed;
}

export function formatSystemSettingConstraints(item: SystemSettingItem): string {
  if (item.minValue != null || item.maxValue != null) {
    const min = item.minValue ?? '—';
    const max = item.maxValue ?? '∞';
    const unitSuffix = item.unit ? ` ${item.unit}` : '';
    return `Cho phép: ${min} – ${max}${unitSuffix}`;
  }
  return '';
}

export function formatSystemSettingValidationError(
  item: SystemSettingItem,
  kind: 'min' | 'max'
): string {
  const unitSuffix = item.unit ? ` ${item.unit}` : '';
  if (kind === 'min' && item.minValue != null) {
    return `Tối thiểu ${item.minValue}${unitSuffix}`;
  }
  if (kind === 'max' && item.maxValue != null) {
    return `Tối đa ${item.maxValue}${unitSuffix}`;
  }
  return 'Giá trị không hợp lệ';
}

export function getSystemSettingPlaceholder(item: SystemSettingItem): string {
  if (isBooleanValueType(item.valueType) || isNumericValueType(item.valueType)) return '';
  const defaultValue = item.defaultValue?.trim();
  return defaultValue || '';
}

export function filterVisibleSystemSettings(items: SystemSettingItem[]): SystemSettingItem[] {
  return items.filter(item => !isHiddenSystemSettingItem(item) && !isRetiredSystemSettingKey(item.key));
}

export function filterVisibleSystemSettingModules(
  modules: SystemSettingModule[]
): SystemSettingModule[] {
  return modules.filter(mod => !isHiddenSystemSettingModule(mod));
}

/** Slug dùng cho GET/PATCH/reset — ưu tiên routeSlug từ BE catalog. */
export function resolveSystemSettingsModuleKey(
  moduleSlug: string,
  modules: SystemSettingModule[]
): string {
  const normalized = moduleSlug.trim().toLowerCase();
  if (!normalized) return moduleSlug;

  const meta = modules.find(mod => {
    const slug = mod.routeSlug.trim().toLowerCase();
    const name = mod.module.trim().toLowerCase();
    return slug === normalized || name === normalized;
  });

  return meta?.routeSlug || meta?.module || moduleSlug;
}

export function buildSystemSettingsItemsSignature(items: SystemSettingItem[]): string {
  return items
    .map(
      item => `${item.key}\0${item.title}\0${item.unit ?? ''}\0${item.value}\0${item.defaultValue}`
    )
    .join('\n');
}

export function isSystemSettingAtDefault(item: SystemSettingItem): boolean {
  if (isBooleanValueType(item.valueType)) return false;

  const raw = normalizeSettingScalar(item.value);
  if (raw === '') return true;

  const defaultValue = normalizeSettingScalar(item.defaultValue);
  return raw === defaultValue;
}

export function isNumericValueType(valueType: string): boolean {
  const normalized = valueType.toLowerCase();
  return normalized === 'int' || normalized === 'decimal' || normalized === 'number';
}

export function isBooleanValueType(valueType: string): boolean {
  return valueType.toLowerCase() === 'bool' || valueType.toLowerCase() === 'boolean';
}

function normalizeSettingScalar(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

/** Giá trị đang áp dụng — BE có thể để `value` rỗng khi trùng mặc định. */
export function getSystemSettingEffectiveValue(item: SystemSettingItem): string {
  if (isBooleanValueType(item.valueType)) {
    const raw = normalizeSettingScalar(item.value);
    if (raw === 'true' || raw === '1') return 'true';
    if (raw === 'false' || raw === '0') return 'false';
    const fallback = normalizeSettingScalar(item.defaultValue);
    return fallback === 'true' || fallback === '1' ? 'true' : 'false';
  }

  const current = normalizeSettingScalar(item.value);
  if (current !== '') return current;
  return normalizeSettingScalar(item.defaultValue);
}

/** Chuyển value BE sang form — luôn hiển thị giá trị đang áp dụng (kể cả mặc định). */
export function systemSettingValueToFormValue(item: SystemSettingItem): string {
  return getSystemSettingEffectiveValue(item);
}

/** Giá trị gửi PATCH — ô trống = quay về mặc định. */
export function systemSettingFormValueToPatchValue(
  item: SystemSettingItem,
  formValue: string
): string {
  if (isBooleanValueType(item.valueType)) {
    return formValue === 'true' ? 'true' : 'false';
  }

  const trimmed = formValue.trim();
  if (trimmed === '') {
    return (item.defaultValue ?? '').trim();
  }

  return trimmed;
}

/** Build PATCH body — chỉ gửi key thực sự thay đổi; mọi value là string. */
export function buildPatchSystemSettingsBody(
  items: SystemSettingItem[],
  formValues: Record<string, string>
): Record<string, string> {
  const body: Record<string, string> = {};
  for (const item of items) {
    const raw = formValues[item.key];
    if (raw === undefined) continue;

    const initial = systemSettingValueToFormValue(item);
    const next = raw.trim();
    if (initial === next) continue;

    body[item.key] = systemSettingFormValueToPatchValue(item, raw);
  }
  return body;
}

export function hasSystemSettingsChanges(
  items: SystemSettingItem[],
  formValues: Record<string, string>
): boolean {
  return items.some(item => systemSettingValueToFormValue(item) !== (formValues[item.key] ?? ''));
}

export function getSystemSettingsMutationError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
