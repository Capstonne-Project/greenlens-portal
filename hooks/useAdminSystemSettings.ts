'use client';

import { useCanFetchProtected } from '@/hooks/useAuthSession';
import {
  fetchSystemSettingModules,
  fetchSystemSettingsByModule,
  patchSystemSettings,
  resetSystemSettings,
} from '@/lib/api/services/fetchAdminSystemSettings';
import type {
  PatchSystemSettingsInput,
  SystemSettingItem,
  SystemSettingsList,
} from '@/lib/api/models/adminSystemSettings';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import {
  clearSystemSettingOverrides,
  mergeSystemSettingOverrides,
} from '@/lib/storage/systemSettingsOverrides';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

export const adminSystemSettingsKeys = {
  all: ['admin', 'system-settings'] as const,
  modules: () => [...adminSystemSettingsKeys.all, 'modules'] as const,
  module: (module: string) =>
    [...adminSystemSettingsKeys.all, 'module', module.trim().toLowerCase()] as const,
};

const MODULES_STALE_MS = 10 * 60 * 1000;
const MODULE_STALE_MS = 3 * 60 * 1000;
const MODULE_GC_MS = 30 * 60 * 1000;

function normalizeModuleCacheKey(module: string): string {
  return module.trim().toLowerCase();
}

function mergeItemsWithUpdates(
  items: SystemSettingItem[],
  updated: SystemSettingItem[]
): SystemSettingItem[] {
  const byKey = new Map(updated.map(item => [item.key, item]));
  return items.map(item => byKey.get(item.key) ?? item);
}

function mergeItemsWithBody(
  items: SystemSettingItem[],
  body: PatchSystemSettingsInput
): SystemSettingItem[] {
  return items.map(item => {
    const nextValue = body[item.key];
    if (nextValue === undefined) return item;
    return { ...item, value: nextValue };
  });
}

function mergeSystemSettingsModuleCache(
  queryClient: QueryClient,
  moduleKey: string,
  merge: (items: SystemSettingItem[]) => SystemSettingItem[]
): void {
  const cacheKey = adminSystemSettingsKeys.module(normalizeModuleCacheKey(moduleKey));

  queryClient.setQueryData<ApiEnvelope<SystemSettingsList>>(cacheKey, previous => {
    if (!previous?.data?.items?.length) return previous;
    return {
      ...previous,
      data: {
        items: merge(previous.data.items),
      },
    };
  });
}

/** GET /v1/admin/system-settings/modules — sidebar catalog. */
export function useSystemSettingModules() {
  const canFetch = useCanFetchProtected();

  return useQuery({
    queryKey: adminSystemSettingsKeys.modules(),
    queryFn: () => fetchSystemSettingModules(),
    enabled: canFetch,
    staleTime: MODULES_STALE_MS,
    gcTime: MODULE_GC_MS,
  });
}

/** GET /v1/admin/system-settings/{module} */
export function useSystemSettingsModule(
  cacheModuleSlug: string | undefined,
  fetchModuleKey?: string,
  modulesReady = true
) {
  const canFetch = useCanFetchProtected();
  const cacheKey = cacheModuleSlug?.trim() ?? '';
  const fetchKey = (fetchModuleKey ?? cacheModuleSlug)?.trim() ?? '';

  return useQuery({
    queryKey: adminSystemSettingsKeys.module(cacheKey),
    queryFn: () => fetchSystemSettingsByModule(fetchKey),
    enabled: canFetch && modulesReady && Boolean(cacheKey && fetchKey),
    staleTime: MODULE_STALE_MS,
    gcTime: MODULE_GC_MS,
  });
}

function useInvalidateSystemSettings() {
  const queryClient = useQueryClient();
  return (module?: string) => {
    void queryClient.invalidateQueries({ queryKey: adminSystemSettingsKeys.all });
    if (module?.trim()) {
      void queryClient.invalidateQueries({
        queryKey: adminSystemSettingsKeys.module(module.trim()),
      });
    }
  };
}

export function usePatchSystemSettings() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateSystemSettings();

  return useMutation({
    mutationFn: ({
      module,
      body,
    }: {
      module: string;
      body: PatchSystemSettingsInput;
      cacheModule?: string;
    }) => patchSystemSettings(module, body),
    onSuccess: (envelope, variables) => {
      const moduleKey = variables.module.trim();
      const cacheModule = variables.cacheModule?.trim() || moduleKey;
      const updated = envelope.data?.updated ?? [];

      mergeSystemSettingOverrides(cacheModule, variables.body);

      if (updated.length > 0) {
        mergeSystemSettingsModuleCache(queryClient, cacheModule, items =>
          mergeItemsWithUpdates(items, updated)
        );
      } else if (Object.keys(variables.body).length > 0) {
        mergeSystemSettingsModuleCache(queryClient, cacheModule, items =>
          mergeItemsWithBody(items, variables.body)
        );
      }

      invalidate(cacheModule);
    },
  });
}

export function useResetSystemSettings() {
  const invalidate = useInvalidateSystemSettings();
  return useMutation({
    mutationFn: ({ module }: { module: string; cacheModule?: string }) =>
      resetSystemSettings(module),
    onSuccess: (_data, variables) => {
      clearSystemSettingOverrides(variables.cacheModule ?? variables.module);
      invalidate(variables.cacheModule ?? variables.module);
    },
  });
}
