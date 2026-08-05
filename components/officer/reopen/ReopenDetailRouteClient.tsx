'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { ReopenDetailClient } from './ReopenDetailClient';
import { resolveSafeOfficerFrom } from '@/utils/officerNavigation';

export function ReopenDetailRouteClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = resolveSafeOfficerFrom(searchParams.get('from'));

  return <ReopenDetailClient id={id} onBack={() => router.push(from ?? '/officer/reopen')} />;
}
