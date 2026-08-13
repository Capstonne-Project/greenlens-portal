'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

import { LeoTrackingReportDetail } from '@/components/officer/tracking/LeoTrackingReportDetail';
import { goBackWithListSoftReload } from '@/utils/notificationNavigation';
import { resolveSafeOfficerFrom } from '@/utils/officerNavigation';

type LeoTrackingDetailRouteClientProps = {
  id: string;
};

/**
 * Chi tiết theo dõi xử lý — URL `/officer/tracking/[id]`.
 * Back về `?from=` hoặc danh sách tracking.
 */
export function LeoTrackingDetailRouteClient({ id }: LeoTrackingDetailRouteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const from = resolveSafeOfficerFrom(searchParams.get('from'));

  return (
    <LeoTrackingReportDetail
      reportId={id}
      onBack={() =>
        goBackWithListSoftReload({
          router,
          queryClient,
          from,
          fallbackHref: `/officer/tracking?highlight=${encodeURIComponent(id)}`,
        })
      }
    />
  );
}
