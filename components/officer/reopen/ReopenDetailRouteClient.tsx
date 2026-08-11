'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

import { ReopenDetailClient } from './ReopenDetailClient';
import { goBackWithListSoftReload } from '@/utils/notificationNavigation';
import { resolveSafeOfficerFrom } from '@/utils/officerNavigation';

export function ReopenDetailRouteClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const from = resolveSafeOfficerFrom(searchParams.get('from'));

  return (
    <ReopenDetailClient
      id={id}
      onBack={() =>
        goBackWithListSoftReload({
          router,
          queryClient,
          from,
          fallbackHref: '/officer/reopen',
        })
      }
    />
  );
}
