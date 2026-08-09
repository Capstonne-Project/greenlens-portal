import { Suspense } from 'react';

import OfficerAssignDetailLoading from '@/app/(officer)/officer/assign/[id]/loading';
import { AssignReportDetailClient } from '@/components/officer/assign/AssignReportDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfficerAssignDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<OfficerAssignDetailLoading />}>
      <AssignReportDetailClient id={id} />
    </Suspense>
  );
}
