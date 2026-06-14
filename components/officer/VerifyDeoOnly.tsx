'use client';

import { Button } from '@/components/ui/button';
import { canAccessVerifyQueue } from '@/lib/constants/officerRoles';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';

export function VerifyDeoOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user);

  if (canAccessVerifyQueue(user?.systemRole)) {
    return <>{children}</>;
  }

  const home = getDefaultOfficerHomePath(user?.systemRole);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <h2 className="text-lg font-semibold text-foreground">Không có quyền truy cập</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Màn xác minh báo cáo chỉ dành cho cán bộ Sở TNMT
      </p>
      <Button asChild className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500">
        <Link href={home}>Về trang chính</Link>
      </Button>
    </div>
  );
}
