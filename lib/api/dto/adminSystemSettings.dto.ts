export interface SystemSettingModuleDto {
  module?: string | null;
  routeSlug?: string | null;
  displayNameVi?: string | null;
  descriptionVi?: string | null;
}

export interface SystemSettingItemDto {
  id?: string;
  module?: string | null;
  key?: string | null;
  valueType?: string | null;
  value?: string | null;
  defaultValue?: string | null;
  description?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  isActive?: boolean;
}

export interface SystemSettingModulesDataDto {
  modules?: SystemSettingModuleDto[] | null;
}

export interface SystemSettingsDataDto {
  items?: SystemSettingItemDto[] | null;
}

export interface UpdateSystemSettingsDataDto {
  updated?: SystemSettingItemDto[] | null;
}
