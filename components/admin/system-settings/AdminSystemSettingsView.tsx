'use client';

import { SystemSettingsConfirmDialog } from '@/components/admin/system-settings/SystemSettingsConfirmDialog';
import { SystemSettingsModuleForm } from '@/components/admin/system-settings/SystemSettingsModuleForm';
import { SystemSettingsModuleSidebar } from '@/components/admin/system-settings/SystemSettingsModuleSidebar';
import { SystemSettingsResetDialog } from '@/components/admin/system-settings/SystemSettingsResetDialog';
import { GreenLensLookupSpinner } from '@/components/ui/greenlens-lookup-spinner';
import {
  usePatchSystemSettings,
  useResetSystemSettings,
  useSystemSettingModules,
  useSystemSettingsModule,
} from '@/hooks/useAdminSystemSettings';
import type { SystemSettingItem } from '@/lib/api/models/adminSystemSettings';
import {
  buildPatchSystemSettingsBody,
  filterVisibleSystemSettingModules,
  filterVisibleSystemSettings,
  getSystemSettingsMutationError,
  hasSystemSettingsChanges,
  resolveSystemSettingsModuleKey,
  systemSettingValueToFormValue,
} from '@/utils/adminSystemSettingsUi';
import { applySystemSettingOverrides } from '@/lib/storage/systemSettingsOverrides';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface AdminSystemSettingsViewProps {
  moduleSlug: string;
}

export function AdminSystemSettingsView({ moduleSlug }: AdminSystemSettingsViewProps) {
  const router = useRouter();
  const modulesQuery = useSystemSettingModules();
  const patchMutation = usePatchSystemSettings();
  const resetMutation = useResetSystemSettings();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<Record<string, string>>({});

  const modules = useMemo(
    () => filterVisibleSystemSettingModules(modulesQuery.data?.data?.modules ?? []),
    [modulesQuery.data?.data?.modules]
  );
  const apiModuleKey = useMemo(
    () => resolveSystemSettingsModuleKey(moduleSlug, modules),
    [moduleSlug, modules]
  );
  const modulesReady = !modulesQuery.isPending;
  const settingsQuery = useSystemSettingsModule(moduleSlug, apiModuleKey, modulesReady);
  const rawItems = settingsQuery.data?.data?.items ?? [];
  const items = useMemo(
    () => applySystemSettingOverrides(moduleSlug, rawItems),
    [moduleSlug, rawItems]
  );
  const visibleItems = useMemo(() => filterVisibleSystemSettings(items), [items]);

  useEffect(() => {
    if (modulesQuery.isPending || modules.length === 0) return;
    const isCurrentVisible = modules.some(
      mod => mod.routeSlug === moduleSlug || mod.module === moduleSlug
    );
    if (isCurrentVisible) return;
    const first = modules[0];
    if (!first) return;
    const slug = first.routeSlug || first.module;
    router.replace(`/admin/system-settings/${encodeURIComponent(slug)}`);
  }, [moduleSlug, modules, modulesQuery.isPending, router]);

  const activeModuleMeta = useMemo(
    () => modules.find(mod => mod.routeSlug === moduleSlug || mod.module === moduleSlug) ?? null,
    [moduleSlug, modules]
  );

  const moduleLabel = activeModuleMeta?.displayNameVi || moduleSlug;

  const changedItems = useMemo((): SystemSettingItem[] => {
    if (!confirmOpen) return [];
    return visibleItems.filter(
      item => systemSettingValueToFormValue(item) !== (pendingValues[item.key] ?? '')
    );
  }, [confirmOpen, pendingValues, visibleItems]);

  const handleSaveRequest = (formValues: Record<string, string>) => {
    if (!hasSystemSettingsChanges(visibleItems, formValues)) return;
    setPendingValues(formValues);
    setConfirmOpen(true);
  };

  const confirmSave = () => {
    const body = buildPatchSystemSettingsBody(visibleItems, pendingValues);
    if (Object.keys(body).length === 0) {
      toast.error('Không có thay đổi hợp lệ để lưu.');
      return;
    }

    patchMutation.mutate(
      { module: apiModuleKey, body, cacheModule: moduleSlug },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật cấu hình hệ thống.');
          setConfirmOpen(false);
          setPendingValues({});
        },
        onError: err =>
          toast.error(getSystemSettingsMutationError(err, 'Không thể cập nhật cấu hình.')),
      }
    );
  };

  const confirmReset = () => {
    resetMutation.mutate(
      { module: apiModuleKey, cacheModule: moduleSlug },
      {
        onSuccess: () => {
          toast.success('Đã reset module về mặc định.');
          setResetOpen(false);
        },
        onError: err => toast.error(getSystemSettingsMutationError(err, 'Không thể reset module.')),
      }
    );
  };

  const isLoading = modulesQuery.isPending || settingsQuery.isPending;
  const isError = modulesQuery.isError || settingsQuery.isError;
  const error = settingsQuery.error ?? modulesQuery.error;

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">
          Cấu hình hệ thống theo từng nhóm — giới hạn gửi tin, hạn xử lý, vòng đời báo cáo và mẫu
          thông báo. Thay đổi áp dụng ngay sau khi lưu.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <GreenLensLookupSpinner className="size-8" />
          Đang tải cấu hình…
        </div>
      ) : isError ? (
        <div className="py-16 text-center">
          <p className="text-sm text-destructive">
            {(error as Error)?.message ?? 'Không tải được cấu hình hệ thống.'}
          </p>
          <button
            type="button"
            onClick={() => {
              void modulesQuery.refetch();
              void settingsQuery.refetch();
            }}
            className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
          <SystemSettingsModuleSidebar modules={modules} activeModule={moduleSlug} />
          <SystemSettingsModuleForm
            moduleLabel={moduleLabel}
            items={visibleItems}
            busy={patchMutation.isPending}
            resetBusy={resetMutation.isPending}
            onSave={handleSaveRequest}
            onReset={() => setResetOpen(true)}
          />
        </div>
      )}

      <SystemSettingsConfirmDialog
        open={confirmOpen}
        moduleLabel={moduleLabel}
        changedItems={changedItems}
        formValues={pendingValues}
        busy={patchMutation.isPending}
        onClose={() => {
          if (!patchMutation.isPending) setConfirmOpen(false);
        }}
        onConfirm={confirmSave}
      />

      <SystemSettingsResetDialog
        open={resetOpen}
        moduleLabel={moduleLabel}
        busy={resetMutation.isPending}
        onClose={() => {
          if (!resetMutation.isPending) setResetOpen(false);
        }}
        onConfirm={confirmReset}
      />
    </div>
  );
}
