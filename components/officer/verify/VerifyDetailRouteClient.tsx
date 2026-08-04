'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { VerifyDetailClient } from '@/components/officer/verify/VerifyDetailClient';
import { resolveSafeOfficerFrom } from '@/utils/officerNavigation';

type VerifyDetailRouteClientProps = {
  id: string;
};

/** ACL DEO/LEO do proxy — không render Access Denied trên client. */
export function VerifyDetailRouteClient({ id }: VerifyDetailRouteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = resolveSafeOfficerFrom(searchParams.get('from'));

  return <VerifyDetailClient id={id} onBack={from ? () => router.push(from) : undefined} />;
}
