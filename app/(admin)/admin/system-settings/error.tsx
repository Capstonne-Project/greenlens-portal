'use client';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminSystemSettingsError({ error, reset }: Props) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-destructive">
        {error.message || 'Không tải được trang cấu hình hệ thống.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
      >
        Thử lại
      </button>
    </div>
  );
}
