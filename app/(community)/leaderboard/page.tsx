import type { Metadata } from 'next';
import { LeaderboardPageContent } from '@/components/landing/LeaderboardPageContent';
import { LandingAtmosphere } from '@/components/landing/LandingAtmosphere';
import { PublicSiteFooter } from '@/components/landing/PublicSiteFooter';
import { PublicSiteHeader } from '@/components/landing/PublicSiteHeader';
import { APP_NAME } from '@/lib/constants/brand';

export const metadata: Metadata = {
  title: 'Bảng xếp hạng',
  description: `Top công dân đóng góp báo cáo ô nhiễm trên ${APP_NAME} — gamification minh bạch, công khai.`,
};

export default function LeaderboardPage() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <LandingAtmosphere />
      <div className="pointer-events-none relative z-10 flex min-h-dvh flex-col">
        <PublicSiteHeader activePath="/leaderboard" />
        <main className="flex-1">
          <LeaderboardPageContent />
        </main>
        <div className="landing-hit">
          <PublicSiteFooter />
        </div>
      </div>
    </div>
  );
}
