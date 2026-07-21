'use client';

import { OfficerAccessDenied } from '@/components/officer/OfficerAccessDenied';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { isLeoOfficer } from '@/lib/constants/officerRoles';
import { useAuthStore } from '@/lib/store/authStore';
import { LeoWorkforcePageClient } from './LeoWorkforcePageClient';

export function WorkforcePageClient() {
  const user = useAuthStore(s => s.user);

  if (!isLeoOfficer(user?.systemRole)) {
    return (
      <OfficerAccessDenied
        message="Quản lý đội ngũ chỉ dành cho cán bộ văn phòng MT phường (LEO)."
        homeHref={getDefaultOfficerHomePath(user?.systemRole)}
      />
    );
  }

  return <LeoWorkforcePageClient />;
}
