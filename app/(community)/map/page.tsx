import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PublicMapPageClient } from '@/components/map/public/PublicMapPageClient';

export const metadata: Metadata = {
  title: 'Bản đồ ô nhiễm toàn quốc',
  description:
    'Bản đồ công khai các báo cáo ô nhiễm đã xác minh tại Việt Nam. Xem điểm còn ô nhiễm và điểm đã dọn, kèm ảnh sau xử lý.',
  robots: { index: true, follow: true },
};

function PublicMapFallback() {
  return <div className="absolute inset-0 z-0 animate-pulse bg-slate-200" aria-hidden />;
}

export default function PublicMapPage() {
  return (
    <Suspense fallback={<PublicMapFallback />}>
      <PublicMapPageClient />
    </Suspense>
  );
}
