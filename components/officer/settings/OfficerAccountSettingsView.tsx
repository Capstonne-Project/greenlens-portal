'use client';

import { ShieldCheck, UserRound } from 'lucide-react';

export function OfficerAccountSettingsView() {
  return (
    <div className="mx-auto flex min-h-[58vh] w-full max-w-4xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UserRound className="size-8" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold">Cài đặt tài khoản</h2>
      <p className="max-w-xl text-sm text-muted-foreground">
        Khu vực này dành cho cập nhật hồ sơ, bảo mật và tuỳ chọn tài khoản của cán bộ. Tính năng sẽ
        được mở rộng theo phase tiếp theo.
      </p>
      <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <ShieldCheck className="size-3.5" aria-hidden />
        Security-ready structure
      </div>
    </div>
  );
}
