'use client';

import { DeoOverviewDashboard } from '@/components/officer/overview/DeoOverviewDashboard';
import { LeoDashboardPlaceholder } from '@/components/officer/overview/LeoDashboardPlaceholder';
import { isDeoOfficer } from '@/lib/constants/officerRoles';
import { useAuthStore } from '@/lib/store/authStore';

export function OfficerDashboardClient() {
  const systemRole = useAuthStore(s => s.user?.systemRole);

  if (isDeoOfficer(systemRole)) {
    return <DeoOverviewDashboard />;
  }

  return <LeoDashboardPlaceholder />;
}
