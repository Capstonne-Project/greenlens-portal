import { Suspense } from 'react';

import OfficerVerifyDetailLoading from '@/app/(officer)/officer/verify/[id]/loading';
import { VerifyDetailRouteClient } from '@/components/officer/verify/VerifyDetailRouteClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfficerVerifyDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<OfficerVerifyDetailLoading />}>
      <VerifyDetailRouteClient id={id} />
    </Suspense>
  );
}
