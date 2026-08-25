import type {
  SystemSettingModulesDataDto,
  SystemSettingsDataDto,
  UpdateSystemSettingsDataDto,
} from '@/lib/api/dto/adminSystemSettings.dto';
import {
  mapSystemSettingModulesDataDto,
  mapSystemSettingsDataDto,
  mapUpdateSystemSettingsDataDto,
} from '@/lib/api/mappers/adminSystemSettings.mapper';
import type {
  PatchSystemSettingsInput,
  SystemSettingModulesList,
  SystemSettingsList,
  UpdateSystemSettingsResult,
} from '@/lib/api/models/adminSystemSettings';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

/** GET /v1/admin/system-settings/modules */
export async function adaptSystemSettingModules(): Promise<ApiEnvelope<SystemSettingModulesList>> {
  const res = await apiService.get<ApiEnvelope<SystemSettingModulesDataDto>>(
    '/v1/admin/system-settings/modules'
  );
  return mapApiEnvelope(res.data, mapSystemSettingModulesDataDto);
}

/** GET /v1/admin/system-settings — optional ?module= */
export async function adaptSystemSettings(
  module?: string
): Promise<ApiEnvelope<SystemSettingsList>> {
  const query = module?.trim() ? { module: module.trim() } : undefined;
  const res = await apiService.get<ApiEnvelope<SystemSettingsDataDto>>(
    '/v1/admin/system-settings',
    query
  );
  return mapApiEnvelope(res.data, mapSystemSettingsDataDto);
}

/** GET /v1/admin/system-settings/{module} */
export async function adaptSystemSettingsByModule(
  module: string
): Promise<ApiEnvelope<SystemSettingsList>> {
  const res = await apiService.get<ApiEnvelope<SystemSettingsDataDto>>(
    `/v1/admin/system-settings/${encodeURIComponent(module)}`
  );
  return mapApiEnvelope(res.data, mapSystemSettingsDataDto);
}

/** PATCH /v1/admin/system-settings/{module} */
export async function adaptPatchSystemSettings(
  module: string,
  body: PatchSystemSettingsInput
): Promise<ApiEnvelope<UpdateSystemSettingsResult>> {
  const res = await apiService.patch<ApiEnvelope<UpdateSystemSettingsDataDto>>(
    `/v1/admin/system-settings/${encodeURIComponent(module)}`,
    body
  );
  return mapApiEnvelope(res.data, mapUpdateSystemSettingsDataDto);
}

/** POST /v1/admin/system-settings/{module}/reset */
export async function adaptResetSystemSettings(
  module: string
): Promise<ApiEnvelope<SystemSettingsList>> {
  const res = await apiService.post<ApiEnvelope<SystemSettingsDataDto>>(
    `/v1/admin/system-settings/${encodeURIComponent(module)}/reset`,
    {}
  );
  return mapApiEnvelope(res.data, mapSystemSettingsDataDto);
}
