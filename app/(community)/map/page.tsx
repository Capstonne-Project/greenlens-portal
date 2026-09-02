import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CitizenMapPageClient } from '@/components/map/citizen/CitizenMapPageClient';

export const metadata: Metadata = {
  title: 'Bản đồ ô nhiễm toàn quốc',
  description:
    'Bản đồ công khai các báo cáo ô nhiễm tại Việt Nam — chọn tỉnh/thành để xem mức độ theo phường/xã và các điểm rác thải cụ thể.',
  robots: { index: true, follow: true },
};

function PublicMapFallback() {
  return <div className="absolute inset-0 z-0 animate-pulse bg-slate-200" aria-hidden />;
}

export default function PublicMapPage() {
  return (
    <Suspense fallback={<PublicMapFallback />}>
      <CitizenMapPageClient />
    </Suspense>
  );
}
