/** FE models — admin system configuration. */

export type SystemSettingValueType = 'int' | 'decimal' | 'bool' | 'string' | string;

export interface SystemSettingModule {
  module: string;
  routeSlug: string;
  displayNameVi: string;
  descriptionVi: string | null;
}

export interface SystemSettingItem {
  id: string;
  module: string;
  key: string;
  /** Nhãn hiển thị form — source of truth từ BE seeder. */
  title: string;
  /** Đơn vị suffix cạnh input; null = không hiện. */
  unit: string | null;
  valueType: SystemSettingValueType;
  value: string;
  defaultValue: string;
  /** Tooltip / helper — ngữ cảnh áp dụng + hành vi hệ thống. */
  description: string | null;
  minValue: number | null;
  maxValue: number | null;
  isActive: boolean;
}

export interface SystemSettingModulesList {
  modules: SystemSettingModule[];
}

export interface SystemSettingsList {
  items: SystemSettingItem[];
}

export interface UpdateSystemSettingsResult {
  updated: SystemSettingItem[];
}

/** PATCH body — mọi value gửi dạng string theo contract BE. */
export type PatchSystemSettingsInput = Record<string, string>;
