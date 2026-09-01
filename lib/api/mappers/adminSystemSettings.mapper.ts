import type {
  SystemSettingItemDto,
  SystemSettingModuleDto,
  SystemSettingModulesDataDto,
  SystemSettingsDataDto,
  UpdateSystemSettingsDataDto,
} from '@/lib/api/dto/adminSystemSettings.dto';
import type {
  SystemSettingItem,
  SystemSettingModule,
  SystemSettingModulesList,
  SystemSettingsList,
  UpdateSystemSettingsResult,
} from '@/lib/api/models/adminSystemSettings';

function optionalNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function mapSystemSettingModuleDto(dto: SystemSettingModuleDto): SystemSettingModule {
  return {
    module: dto.module?.trim() ?? '',
    routeSlug: dto.routeSlug?.trim() || dto.module?.trim() || '',
    displayNameVi: dto.displayNameVi?.trim() ?? '',
    descriptionVi: dto.descriptionVi?.trim() ? dto.descriptionVi.trim() : null,
  };
}

function pickDtoArray<T>(source: object, ...keys: string[]): T[] {
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

function pickDtoScalar(source: object, ...keys: string[]): unknown {
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function mapSettingScalar(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

export function mapSystemSettingItemDto(dto: SystemSettingItemDto): SystemSettingItem {
  const raw = dto as SystemSettingItemDto & Record<string, unknown>;
  const key = mapSettingScalar(pickDtoScalar(raw, 'key', 'Key'));
  const titleRaw = mapSettingScalar(pickDtoScalar(raw, 'title', 'Title'));
  return {
    id: String(pickDtoScalar(raw, 'id', 'Id') ?? ''),
    module: mapSettingScalar(pickDtoScalar(raw, 'module', 'Module')),
    key,
    title: titleRaw || key,
    unit: (() => {
      const text = mapSettingScalar(pickDtoScalar(raw, 'unit', 'Unit'));
      return text || null;
    })(),
    valueType: mapSettingScalar(pickDtoScalar(raw, 'valueType', 'ValueType')) || 'string',
    value: mapSettingScalar(pickDtoScalar(raw, 'value', 'Value')),
    defaultValue: mapSettingScalar(pickDtoScalar(raw, 'defaultValue', 'DefaultValue')),
    description: (() => {
      const text = mapSettingScalar(pickDtoScalar(raw, 'description', 'Description'));
      return text || null;
    })(),
    minValue: optionalNumber(pickDtoScalar(raw, 'minValue', 'MinValue')),
    maxValue: optionalNumber(pickDtoScalar(raw, 'maxValue', 'MaxValue')),
    isActive: (pickDtoScalar(raw, 'isActive', 'IsActive') as boolean | undefined) ?? true,
  };
}

export function mapSystemSettingModulesDataDto(
  data: SystemSettingModulesDataDto
): SystemSettingModulesList {
  return {
    modules: (data.modules ?? [])
      .map(mapSystemSettingModuleDto)
      .filter(item => item.module.length > 0),
  };
}

export function mapSystemSettingsDataDto(data: SystemSettingsDataDto): SystemSettingsList {
  const raw = data as SystemSettingsDataDto & Record<string, unknown>;
  const items = pickDtoArray<SystemSettingItemDto>(raw, 'items', 'Items');
  return {
    items: items.map(mapSystemSettingItemDto).filter(item => item.key.length > 0),
  };
}

export function mapUpdateSystemSettingsDataDto(
  data: UpdateSystemSettingsDataDto
): UpdateSystemSettingsResult {
  const raw = data as UpdateSystemSettingsDataDto & Record<string, unknown>;
  const updated = pickDtoArray<SystemSettingItemDto>(raw, 'updated', 'Updated');
  return {
    updated: updated.map(mapSystemSettingItemDto),
  };
}
