import type { Metadata } from 'next';
import { HomeLanding } from '@/components/landing/HomeLanding';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/constants/brand';

export const metadata: Metadata = {
  title: `${APP_NAME} — Bản đồ ô nhiễm công khai`,
  description: APP_DESCRIPTION,
  robots: { index: true, follow: true },
};

/** Public marketing home (guest). Role portals redirect from proxy when logged in. */
export default function HomePage() {
  return <HomeLanding />;
}
