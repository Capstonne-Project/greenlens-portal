'use client';

import { DeoOverviewDashboard } from '@/components/officer/overview/DeoOverviewDashboard';
import { LeoOverviewDashboard } from '@/components/officer/overview/LeoOverviewDashboard';
import { isDeoOfficer } from '@/lib/constants/officerRoles';
import { useAuthStore } from '@/lib/store/authStore';

export function OfficerDashboardClient() {
  const systemRole = useAuthStore(s => s.user?.systemRole);

  if (isDeoOfficer(systemRole)) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <DeoOverviewDashboard />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <LeoOverviewDashboard />
    </div>
  );
}
