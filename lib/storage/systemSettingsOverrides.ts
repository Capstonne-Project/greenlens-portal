import type { PatchSystemSettingsInput } from '@/lib/api/models/adminSystemSettings';
import type { SystemSettingItem } from '@/lib/api/models/adminSystemSettings';

const STORAGE_PREFIX = 'gl:system-settings:';

function storageKey(module: string): string {
  return `${STORAGE_PREFIX}${module.trim().toLowerCase()}`;
}

/** Overrides đã lưu thành công trong session — bù khi BE/cache trả lại mặc định. */
export function readSystemSettingOverrides(module: string): Record<string, string> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = sessionStorage.getItem(storageKey(module));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    );
  } catch {
    return {};
  }
}

export function writeSystemSettingOverrides(
  module: string,
  overrides: Record<string, string>
): void {
  if (typeof window === 'undefined') return;

  const key = storageKey(module);
  if (Object.keys(overrides).length === 0) {
    sessionStorage.removeItem(key);
    return;
  }

  sessionStorage.setItem(key, JSON.stringify(overrides));
}

export function mergeSystemSettingOverrides(module: string, patch: PatchSystemSettingsInput): void {
  if (Object.keys(patch).length === 0) return;
  const current = readSystemSettingOverrides(module);
  writeSystemSettingOverrides(module, { ...current, ...patch });
}

export function clearSystemSettingOverrides(module: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(storageKey(module));
}

export function applySystemSettingOverrides(
  module: string,
  items: SystemSettingItem[]
): SystemSettingItem[] {
  const overrides = readSystemSettingOverrides(module);
  if (Object.keys(overrides).length === 0) return items;

  return items.map(item => {
    const override = overrides[item.key];
    if (override === undefined) return item;
    return { ...item, value: override };
  });
}
