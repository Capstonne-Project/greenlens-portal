import { Suspense } from 'react';

import OfficerTrackingDetailLoading from '@/app/(officer)/officer/tracking/[id]/loading';
import { LeoTrackingDetailRouteClient } from '@/components/officer/tracking/LeoTrackingDetailRouteClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfficerTrackingDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<OfficerTrackingDetailLoading />}>
      <LeoTrackingDetailRouteClient id={id} />
    </Suspense>
  );
}
