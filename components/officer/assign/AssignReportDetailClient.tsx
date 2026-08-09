'use client';

import { useRouter } from 'next/navigation';

import { VerifyDetailClient } from '@/components/officer/verify/VerifyDetailClient';

type AssignReportDetailClientProps = {
  id: string;
};

/**
 * Chi tiết báo cáo trong ngữ cảnh Phân công — URL `/officer/assign/[id]`.
 * Reuse UI + logic `VerifyDetailClient`; back về danh sách assign kèm highlight.
 */
export function AssignReportDetailClient({ id }: AssignReportDetailClientProps) {
  const router = useRouter();

  return (
    <VerifyDetailClient
      id={id}
      onBack={() => {
        router.push(`/officer/assign?${new URLSearchParams({ highlightReportId: id }).toString()}`);
      }}
    />
  );
}
