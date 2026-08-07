import { Suspense } from 'react';

import OfficerReopenDetailLoading from '@/app/(officer)/officer/reopen/[id]/loading';
import { ReopenDetailRouteClient } from '@/components/officer/reopen/ReopenDetailRouteClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfficerReopenDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<OfficerReopenDetailLoading />}>
      <ReopenDetailRouteClient id={id} />
    </Suspense>
  );
}
