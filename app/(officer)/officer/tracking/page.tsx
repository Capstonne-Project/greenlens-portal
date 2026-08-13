import { Suspense } from 'react';

import OfficerTrackingLoading from '@/app/(officer)/officer/tracking/loading';
import { TrackingPageClient } from '@/components/officer/tracking/TrackingPageClient';

export default function OfficerTrackingPage() {
  return (
    <Suspense fallback={<OfficerTrackingLoading />}>
      <TrackingPageClient />
    </Suspense>
  );
}
