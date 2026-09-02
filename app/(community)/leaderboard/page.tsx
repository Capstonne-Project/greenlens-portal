import type { Metadata } from 'next';
import { LeaderboardPageContent } from '@/components/landing/LeaderboardPageContent';
import { PublicSiteFooter } from '@/components/landing/PublicSiteFooter';
import { PublicSiteHeader } from '@/components/landing/PublicSiteHeader';
import { PublicSiteShell } from '@/components/landing/PublicSiteShell';
import { APP_NAME } from '@/lib/constants/brand';

export const metadata: Metadata = {
  title: 'Bảng xếp hạng',
  description: `Top công dân đóng góp báo cáo ô nhiễm trên ${APP_NAME} — gamification minh bạch, công khai.`,
};

export default function LeaderboardPage() {
  return (
    <PublicSiteShell>
      <PublicSiteHeader activePath="/leaderboard" tone="forest" />
      <main className="flex-1">
        <LeaderboardPageContent />
      </main>
      <div className="landing-hit">
        <PublicSiteFooter tone="forest" />
      </div>
    </PublicSiteShell>
  );
}
