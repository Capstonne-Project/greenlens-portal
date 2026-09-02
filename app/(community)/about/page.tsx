import type { Metadata } from 'next';
import { AboutPageContent } from '@/components/landing/AboutPageContent';
import { PublicSiteFooter } from '@/components/landing/PublicSiteFooter';
import { PublicSiteHeader } from '@/components/landing/PublicSiteHeader';
import { PublicSiteShell } from '@/components/landing/PublicSiteShell';
import { APP_NAME } from '@/lib/constants/brand';

export const metadata: Metadata = {
  title: 'Giới thiệu',
  description: `Mỗi điểm ô nhiễm kể một câu chuyện. ${APP_NAME} — crowdsourcing báo cáo ô nhiễm trên bản đồ công khai Việt Nam.`,
};

export default function AboutPage() {
  return (
    <PublicSiteShell>
      <PublicSiteHeader activePath="/about" tone="forest" />
      <main className="flex-1">
        <AboutPageContent />
      </main>
      <div className="landing-hit">
        <PublicSiteFooter tone="forest" />
      </div>
    </PublicSiteShell>
  );
}
