import { PrivacyPolicyContent } from '@/components/privacy/PrivacyPolicyContent';
import { APP_NAME } from '@/lib/constants/brand';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Chính sách quyền riêng tư — ${APP_NAME}`,
  description: `Chính sách quyền riêng tư của ${APP_NAME} dành cho cán bộ môi trường, quản trị viên và đơn vị đối tác.`,
  robots: { index: true, follow: true },
};

/**
 * Public Privacy Policy — Meta App Live URL.
 * Layout bám Meta Privacy Center; không auth.
 */
export default function PrivacyPage() {
  return (
    <main>
      <PrivacyPolicyContent variant="public" />
    </main>
  );
}
