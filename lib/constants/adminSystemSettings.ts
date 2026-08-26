/** Ngưỡng badge eligibility — PATCH /v1/admin/badges/{id}/thresholds. */
export const BADGE_THRESHOLD_MIN = 1;
export const BADGE_THRESHOLD_MAX = 1_000_000;

/** Module ẩn khỏi UI — đã có màn hình admin riêng (vd. Huy hiệu /admin/badges). */
export const HIDDEN_SYSTEM_SETTING_MODULES = ['gamification'] as const;

export type HiddenSystemSettingModule = (typeof HIDDEN_SYSTEM_SETTING_MODULES)[number];

export function isHiddenSystemSettingModule(mod: {
  module: string;
  routeSlug?: string | null;
}): boolean {
  const hidden = HIDDEN_SYSTEM_SETTING_MODULES as readonly string[];
  const moduleKey = mod.module.trim().toLowerCase();
  const slugKey = mod.routeSlug?.trim().toLowerCase();
  return hidden.includes(moduleKey) || (slugKey != null && hidden.includes(slugKey));
}

/** Keys tạm ẩn khỏi UI admin — BE vẫn giữ seed, chưa cần chỉnh tay. */
export const HIDDEN_SYSTEM_SETTING_KEYS = [
  'vietnam_min_latitude',
  'vietnam_max_latitude',
  'vietnam_min_longitude',
  'vietnam_max_longitude',
] as const;

export type HiddenSystemSettingKey = (typeof HIDDEN_SYSTEM_SETTING_KEYS)[number];

export function isHiddenSystemSettingKey(key: string): boolean {
  return (HIDDEN_SYSTEM_SETTING_KEYS as readonly string[]).includes(key);
}
