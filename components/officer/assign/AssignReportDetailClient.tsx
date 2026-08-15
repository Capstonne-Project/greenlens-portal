'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { VerifyDetailClient } from '@/components/officer/verify/VerifyDetailClient';
import { goBackWithListSoftReload } from '@/utils/notificationNavigation';
import { resolveSafeOfficerFrom } from '@/utils/officerNavigation';

type AssignReportDetailClientProps = {
  id: string;
};

/**
 * Chi tiết báo cáo trong ngữ cảnh Phân công — URL `/officer/assign/[id]`.
 * Reuse UI + logic `VerifyDetailClient` (shell responsive `DETAIL_PAGE_SHELL`);
 * back về `?from=` hoặc danh sách assign + highlight.
 * Soft-reload list khi quay lại (noti / deep-link) — không F5 browser.
 */
export function AssignReportDetailClient({ id }: AssignReportDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const from = resolveSafeOfficerFrom(searchParams.get('from'));

  useEffect(() => {
    router.prefetch('/officer/assign');
  }, [router]);

  return (
    <VerifyDetailClient
      id={id}
      detailMode="assign"
      onBack={opts =>
        goBackWithListSoftReload({
          router,
          queryClient,
          from: opts?.assigned ? null : from,
          fallbackHref: opts?.assigned
            ? '/officer/assign'
            : `/officer/assign?${new URLSearchParams({ highlightReportId: id }).toString()}`,
          method: opts?.assigned ? 'replace' : 'push',
        })
      }
    />
  );
}
