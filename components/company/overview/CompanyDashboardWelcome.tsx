'use client';

import { useAuthStore } from '@/lib/store/authStore';
import type { MyCompany } from '@/lib/api/models/company';
import { formatCompanyDate } from '@/utils/companyUi';

function displayNameFromSession(name: string | undefined, email: string | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email?.split('@')[0]?.trim();
  return local || 'bạn';
}

export function companyOverviewMetaLine(company: MyCompany): string {
  const parts = [
    company.departmentName.trim() || null,
    company.taxCode.trim() ? `MST ${company.taxCode.trim()}` : null,
    `Thành lập ${formatCompanyDate(company.createdAt)}`,
  ].filter((part): part is string => Boolean(part));
  return parts.join(' · ');
}

export function CompanyDashboardWelcome({ company }: { company: MyCompany }) {
  const name = useAuthStore(s => s.user?.name);
  const email = useAuthStore(s => s.user?.email);
  const greetingName = displayNameFromSession(name, email);

  return (
    <div className="min-w-0">
      <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        Chào mừng bạn đã trở lại {greetingName}!
      </h1>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
        {companyOverviewMetaLine(company)}
      </p>
    </div>
  );
}
