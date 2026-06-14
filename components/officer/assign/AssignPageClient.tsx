'use client';

import { isDeoOfficer } from '@/lib/constants/officerRoles';
import { useAuthStore } from '@/lib/store/authStore';
import { DeoAssignPageClient } from './DeoAssignPageClient';
import { LeoAssignPageClient } from './LeoAssignPageClient';

export function AssignPageClient() {
  const systemRole = useAuthStore(s => s.user?.systemRole);
  const deoAssign = isDeoOfficer(systemRole);

  if (deoAssign) {
    return <DeoAssignPageClient />;
  }

  return <LeoAssignPageClient />;
}
