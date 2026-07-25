'use client';

import { VerifyDetailClient } from '@/components/officer/verify/VerifyDetailClient';

type VerifyDetailRouteClientProps = {
  id: string;
};

/** ACL DEO/LEO do proxy — không render Access Denied trên client. */
export function VerifyDetailRouteClient({ id }: VerifyDetailRouteClientProps) {
  return <VerifyDetailClient id={id} />;
}
