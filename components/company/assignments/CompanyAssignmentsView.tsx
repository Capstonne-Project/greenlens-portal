'use client';

import { CompanyAssignmentDetailTab } from '@/components/company/assignments/CompanyAssignmentDetailTab';
import { CompanyAssignmentsTrackingTab } from '@/components/company/assignments/CompanyAssignmentsTrackingTab';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * List ↔ detail via `?reportId=` only.
 * Shell header already shows the page title — no second page header / tabs.
 */
export function CompanyAssignmentsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId');

  const openDetail = useCallback(
    (id: string) => {
      router.replace(`/company/assignments?reportId=${encodeURIComponent(id)}`, { scroll: false });
    },
    [router]
  );

  const backToList = useCallback(() => {
    router.replace('/company/assignments', { scroll: false });
  }, [router]);

  if (reportId) {
    return <CompanyAssignmentDetailTab reportId={reportId} onBack={backToList} />;
  }

  return <CompanyAssignmentsTrackingTab onSelectReport={openDetail} />;
}
