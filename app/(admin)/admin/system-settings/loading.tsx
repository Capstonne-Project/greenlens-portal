import { GreenLensLookupSpinner } from '@/components/ui/greenlens-lookup-spinner';

export default function AdminSystemSettingsLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
      <GreenLensLookupSpinner className="size-8" />
      Đang tải cấu hình hệ thống…
    </div>
  );
}
