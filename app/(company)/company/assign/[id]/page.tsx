import { Suspense } from 'react';

import CompanyAssignDetailLoading from '@/app/(company)/company/assign/[id]/loading';
import { CompanyAssignReportDetailClient } from '@/components/company/assign/CompanyAssignReportDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CompanyAssignDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<CompanyAssignDetailLoading />}>
      <CompanyAssignReportDetailClient reportId={id} />
    </Suspense>
  );
}
