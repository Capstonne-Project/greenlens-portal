import { Suspense } from 'react';

import OfficerCommunityDetailLoading from '@/app/(officer)/officer/community/[eventId]/loading';
import { CommunityCleanupDetailRouteClient } from '@/components/officer/community/CommunityCleanupDetailRouteClient';

type PageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function OfficerCommunityDetailPage({ params }: PageProps) {
  const { eventId } = await params;

  return (
    <Suspense fallback={<OfficerCommunityDetailLoading />}>
      <CommunityCleanupDetailRouteClient eventId={eventId} />
    </Suspense>
  );
}
