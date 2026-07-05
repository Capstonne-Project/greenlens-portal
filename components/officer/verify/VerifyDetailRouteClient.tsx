'use client';

import { OfficerAccessDenied } from '@/components/officer/OfficerAccessDenied';
import { VerifyDetailClient } from '@/components/officer/verify/VerifyDetailClient';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { canAccessVerifyQueue } from '@/lib/constants/officerRoles';
import { useAuthStore } from '@/lib/store/authStore';

type VerifyDetailRouteClientProps = {
  id: string;
};

export function VerifyDetailRouteClient({ id }: VerifyDetailRouteClientProps) {
  const user = useAuthStore(s => s.user);

  if (!canAccessVerifyQueue(user?.systemRole)) {
    return (
      <OfficerAccessDenied
        message="Hàng đợi xác minh chỉ dành cho cán bộ văn phòng MT phường (LEO)."
        homeHref={getDefaultOfficerHomePath(user?.systemRole)}
      />
    );
  }

  return <VerifyDetailClient id={id} />;
}
