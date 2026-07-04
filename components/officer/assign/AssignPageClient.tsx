'use client';

import { OfficerAccessDenied } from '@/components/officer/OfficerAccessDenied';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { isLeoOfficer } from '@/lib/constants/officerRoles';
import { useAuthStore } from '@/lib/store/authStore';
import { LeoAssignPageClient, type LeoAssignSection } from './LeoAssignPageClient';

export function AssignPageClient({ section = 'reports' }: { section?: LeoAssignSection }) {
  const user = useAuthStore(s => s.user);

  if (!isLeoOfficer(user?.systemRole)) {
    return (
      <OfficerAccessDenied
        message="Quản lý phân công chỉ dành cho cán bộ văn phòng MT phường (LEO)."
        homeHref={getDefaultOfficerHomePath(user?.systemRole)}
      />
    );
  }

  return <LeoAssignPageClient section={section} />;
}
