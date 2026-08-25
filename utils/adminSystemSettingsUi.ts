import type { SystemSettingItem, SystemSettingModule } from '@/lib/api/models/adminSystemSettings';
import {
  SYSTEM_SETTING_DISPLAY,
  inferSystemSettingDetail,
  inferSystemSettingLabel,
} from '@/lib/constants/adminSystemSettingsDisplay';
import {
  isHiddenSystemSettingKey,
  isHiddenSystemSettingModule,
} from '@/lib/constants/adminSystemSettings';

export type SystemSettingDisplay = {
  label: string;
  detail: string;
  key: string;
};

/** Luôn dùng nhãn tiếng Việt — không hiển thị mô tả kỹ thuật từ API. */
export function getSystemSettingDisplay(item: SystemSettingItem): SystemSettingDisplay {
  const mapped = SYSTEM_SETTING_DISPLAY[item.key];
  if (mapped) {
    return { label: mapped.label, detail: mapped.detail, key: item.key };
  }

  return {
    label: inferSystemSettingLabel(item.key),
    detail: inferSystemSettingDetail(item.key),
    key: item.key,
  };
}

export function formatSystemSettingConstraints(item: SystemSettingItem): string {
  if (item.minValue != null || item.maxValue != null) {
    return `Cho phép: ${item.minValue ?? '—'} – ${item.maxValue ?? '—'}`;
  }
  return '';
}

export function getSystemSettingPlaceholder(item: SystemSettingItem): string {
  if (isBooleanValueType(item.valueType)) return '';

  const defaultValue = item.defaultValue?.trim();
  if (!defaultValue) return '';

  if (isNumericValueType(item.valueType) && item.minValue != null && item.maxValue != null) {
    return `${defaultValue} (${item.minValue}–${item.maxValue})`;
  }

  return defaultValue;
}

export function filterVisibleSystemSettings(items: SystemSettingItem[]): SystemSettingItem[] {
  return items.filter(item => !isHiddenSystemSettingKey(item.key));
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
  return items.map(item => `${item.key}\0${item.value}\0${item.defaultValue}`).join('\n');
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

/** Chuyển value BE sang form — mặc định = ô trống + placeholder; custom = hiện số đã lưu. */
export function systemSettingValueToFormValue(item: SystemSettingItem): string {
  if (isBooleanValueType(item.valueType)) {
    return getSystemSettingEffectiveValue(item);
  }

  if (isSystemSettingAtDefault(item)) {
    return '';
  }

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
