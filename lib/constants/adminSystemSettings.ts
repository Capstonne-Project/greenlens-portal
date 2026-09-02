/** Ngưỡng badge eligibility — PATCH /v1/admin/badges/{id}/thresholds. */
export const BADGE_THRESHOLD_MIN = 1;
export const BADGE_THRESHOLD_MAX = 1_000_000;

/** Keys đã gỡ khỏi BE catalog — lọc an toàn nếu cache/mock còn sót. */
export const RETIRED_SYSTEM_SETTING_KEYS = [
  'recurrence_lookback_days',
  'max_image_size_bytes',
  'max_drafts_per_user',
  'draft_retention_days',
  'flag_notify_threshold',
  'sla_verify_breach_priority_boost',
  'map_viewport_default_days',
  'progress_update_interval_hours',
  'captcha_after_failed_attempts',
  'max_tasks_per_team',
  'team_workload_warning_threshold',
  'inspection_evidence_max_per_request',
  'escalation_reason_min_length',
] as const;

export type RetiredSystemSettingKey = (typeof RETIRED_SYSTEM_SETTING_KEYS)[number];

export function isRetiredSystemSettingKey(key: string): boolean {
  return (RETIRED_SYSTEM_SETTING_KEYS as readonly string[]).includes(key);
}

/** Module ẩn sidebar — quản lý riêng hoặc chưa bật trên admin (vd. Gamification → /admin/badges). */
export const HIDDEN_SYSTEM_SETTING_MODULES = ['gamification', 'comments'] as const;

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
