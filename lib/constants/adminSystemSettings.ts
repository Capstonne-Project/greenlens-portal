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
export const HIDDEN_SYSTEM_SETTING_MODULES = [
  'gamification',
  'comments',
  /** Bản đồ công khai — cấu hình map public, chưa cần trên admin. */
  'public-map',
  'publicmap',
  /** Cán bộ — quản lý officer qua module riêng. */
  'officers',
  'officer',
  /** Validation — chưa cần trên admin. */
  'validation',
  /** AI — cấu hình AI, chưa cần trên admin. */
  'ai',
] as const;

export type HiddenSystemSettingModule = (typeof HIDDEN_SYSTEM_SETTING_MODULES)[number];

/**
 * displayNameVi từ GET /system-settings/modules — khớp khi slug BE lệch giữa môi trường.
 */
export const HIDDEN_SYSTEM_SETTING_MODULE_LABELS = [
  'Bản đồ công khai',
  'AI',
] as const;

export type HiddenSystemSettingModuleLabel = (typeof HIDDEN_SYSTEM_SETTING_MODULE_LABELS)[number];

export function isHiddenSystemSettingModule(mod: {
  module: string;
  routeSlug?: string | null;
  displayNameVi?: string | null;
}): boolean {
  const hidden = HIDDEN_SYSTEM_SETTING_MODULES as readonly string[];
  const moduleKey = mod.module.trim().toLowerCase();
  const slugKey = mod.routeSlug?.trim().toLowerCase();
  if (hidden.includes(moduleKey) || (slugKey != null && hidden.includes(slugKey))) {
    return true;
  }

  const label = mod.displayNameVi?.trim();
  if (!label) return false;
  return (HIDDEN_SYSTEM_SETTING_MODULE_LABELS as readonly string[]).includes(label);
}

/** Keys tạm ẩn khỏi UI admin — BE vẫn giữ seed, chưa cần chỉnh tay. */
export const HIDDEN_SYSTEM_SETTING_KEYS = [
  'vietnam_min_latitude',
  'vietnam_max_latitude',
  'vietnam_min_longitude',
  'vietnam_max_longitude',
  /** Báo cáo — số ảnh tối đa mỗi báo cáo khi tải lên (BR cố định 1–5). */
  'max_images_per_report',
  /** Dọn cộng đồng — số ảnh trước dọn tối đa. */
  'community_before_images_max',
] as const;

export type HiddenSystemSettingKey = (typeof HIDDEN_SYSTEM_SETTING_KEYS)[number];

export function isHiddenSystemSettingKey(key: string): boolean {
  return (HIDDEN_SYSTEM_SETTING_KEYS as readonly string[]).includes(key);
}

/**
 * Title BE (tiếng Việt) — ẩn khi key seed lệch tên giữa môi trường.
 * Khớp exact trim với `SystemSettingItem.title` từ API.
 */
export const HIDDEN_SYSTEM_SETTING_TITLES = [
  'Số ảnh tối đa mỗi báo cáo khi tải lên',
  'Số ảnh trước dọn tối đa',
] as const;

export function isHiddenSystemSettingTitle(title: string | null | undefined): boolean {
  const normalized = title?.trim();
  if (!normalized) return false;
  return (HIDDEN_SYSTEM_SETTING_TITLES as readonly string[]).includes(normalized);
}

/** Ẩn khỏi form admin theo key hoặc title BE. */
export function isHiddenSystemSettingItem(item: {
  key: string;
  title?: string | null;
}): boolean {
  return isHiddenSystemSettingKey(item.key) || isHiddenSystemSettingTitle(item.title);
}
