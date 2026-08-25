'use client';

import { GreenLensLookupSpinner } from '@/components/ui/greenlens-lookup-spinner';
import { useSystemSettingModules } from '@/hooks/useAdminSystemSettings';
import { filterVisibleSystemSettingModules } from '@/utils/adminSystemSettingsUi';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

/** Chuyển tới module đầu tiên từ GET /system-settings/modules. */
export function AdminSystemSettingsRedirect() {
  const router = useRouter();
  const modulesQuery = useSystemSettingModules();
  const modules = useMemo(
    () => filterVisibleSystemSettingModules(modulesQuery.data?.data?.modules ?? []),
    [modulesQuery.data?.data?.modules]
  );
  const firstModule = modules[0];

  useEffect(() => {
    if (!firstModule) return;
    const slug = firstModule.routeSlug || firstModule.module;
    router.replace(`/admin/system-settings/${encodeURIComponent(slug)}`);
  }, [firstModule, router]);

  if (modulesQuery.isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-destructive">
          {(modulesQuery.error as Error)?.message ?? 'Không tải được danh mục module.'}
        </p>
        <button
          type="button"
          onClick={() => void modulesQuery.refetch()}
          className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!modulesQuery.isPending && !firstModule) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Chưa có module cấu hình hệ thống.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
      <GreenLensLookupSpinner className="size-8" />
      Đang tải module cấu hình…
    </div>
  );
}
