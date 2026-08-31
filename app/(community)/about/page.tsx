import type { Metadata } from 'next';
import { AboutPageContent } from '@/components/landing/AboutPageContent';
import { LandingAtmosphere } from '@/components/landing/LandingAtmosphere';
import { PublicSiteFooter } from '@/components/landing/PublicSiteFooter';
import { PublicSiteHeader } from '@/components/landing/PublicSiteHeader';
import { APP_NAME } from '@/lib/constants/brand';

export const metadata: Metadata = {
  title: 'Giới thiệu',
  description: `Mỗi điểm ô nhiễm kể một câu chuyện. ${APP_NAME} — crowdsourcing báo cáo ô nhiễm trên bản đồ công khai Việt Nam.`,
};

export default function AboutPage() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <LandingAtmosphere />
      <div className="pointer-events-none relative z-10 flex min-h-dvh flex-col">
        <PublicSiteHeader activePath="/about" />
        <main className="flex-1">
          <AboutPageContent />
        </main>
        <div className="landing-hit">
          <PublicSiteFooter />
        </div>
      </div>
    </div>
  );
}
