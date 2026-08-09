'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { ReportsReportDetailClient } from '@/components/officer/reports/ReportsReportDetailClient';
import { resolveSafeOfficerFrom } from '@/utils/officerNavigation';

type ReportsReportDetailRouteClientProps = {
  id: string;
};

/** Route client — `/officer/reports/[id]`. Quay lại list hoặc `?from=`. */
export function ReportsReportDetailRouteClient({ id }: ReportsReportDetailRouteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = resolveSafeOfficerFrom(searchParams.get('from'));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ReportsReportDetailClient
        reportId={id}
        onBack={() => router.push(from ?? '/officer/reports')}
      />
    </div>
  );
}
