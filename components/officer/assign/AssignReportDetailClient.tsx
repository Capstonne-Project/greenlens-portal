'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { VerifyDetailClient } from '@/components/officer/verify/VerifyDetailClient';
import { resolveSafeOfficerFrom } from '@/utils/officerNavigation';

type AssignReportDetailClientProps = {
  id: string;
};

/**
 * Chi tiết báo cáo trong ngữ cảnh Phân công — URL `/officer/assign/[id]`.
 * Reuse UI + logic `VerifyDetailClient`; back về `?from=` hoặc danh sách assign + highlight.
 */
export function AssignReportDetailClient({ id }: AssignReportDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = resolveSafeOfficerFrom(searchParams.get('from'));

  return (
    <VerifyDetailClient
      id={id}
      onBack={() => {
        router.push(
          from ?? `/officer/assign?${new URLSearchParams({ highlightReportId: id }).toString()}`
        );
      }}
    />
  );
}
