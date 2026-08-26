/**
 * L2 — Admin system configuration.
 */
import {
  adaptPatchSystemSettings,
  adaptResetSystemSettings,
  adaptSystemSettingModules,
  adaptSystemSettings,
  adaptSystemSettingsByModule,
} from '@/lib/api/adapters/adminSystemSettings.adapter';
import type {
  PatchSystemSettingsInput,
  SystemSettingModulesList,
  SystemSettingsList,
  UpdateSystemSettingsResult,
} from '@/lib/api/models/adminSystemSettings';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  PatchSystemSettingsInput,
  SystemSettingItem,
  SystemSettingModule,
  SystemSettingModulesList,
  SystemSettingsList,
  UpdateSystemSettingsResult,
} from '@/lib/api/models/adminSystemSettings';

export async function fetchSystemSettingModules(): Promise<ApiEnvelope<SystemSettingModulesList>> {
  return adaptSystemSettingModules();
}

export async function fetchSystemSettings(
  module?: string
): Promise<ApiEnvelope<SystemSettingsList>> {
  return adaptSystemSettings(module);
}

export async function fetchSystemSettingsByModule(
  module: string
): Promise<ApiEnvelope<SystemSettingsList>> {
  return adaptSystemSettingsByModule(module);
}

export async function patchSystemSettings(
  module: string,
  body: PatchSystemSettingsInput
): Promise<ApiEnvelope<UpdateSystemSettingsResult>> {
  return adaptPatchSystemSettings(module, body);
}

export async function resetSystemSettings(
  module: string
): Promise<ApiEnvelope<SystemSettingsList>> {
  return adaptResetSystemSettings(module);
}

const adminSystemSettingsApi = {
  fetchSystemSettingModules,
  fetchSystemSettings,
  fetchSystemSettingsByModule,
  patchSystemSettings,
  resetSystemSettings,
};

export default adminSystemSettingsApi;
