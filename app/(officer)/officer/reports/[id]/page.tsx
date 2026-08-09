import { Suspense } from 'react';

import OfficerReportsDetailLoading from '@/app/(officer)/officer/reports/[id]/loading';
import { ReportsReportDetailRouteClient } from '@/components/officer/reports/ReportsReportDetailRouteClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfficerReportsDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<OfficerReportsDetailLoading />}>
      <ReportsReportDetailRouteClient id={id} />
    </Suspense>
  );
}
