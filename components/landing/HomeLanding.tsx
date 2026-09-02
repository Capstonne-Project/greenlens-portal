import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LandingGlobe3DIsland } from '@/components/landing/LandingGlobe3DIsland';
import { LandingAudiencesSection } from '@/components/landing/LandingAudiencesSection';
import { LandingFaqSection } from '@/components/landing/LandingFaqSection';
import { LandingFinalCtaSection } from '@/components/landing/LandingFinalCtaSection';
import { LandingHowItWorksSection } from '@/components/landing/LandingHowItWorksSection';
import { PublicSiteFooter } from '@/components/landing/PublicSiteFooter';
import { PublicSiteHeader } from '@/components/landing/PublicSiteHeader';
import { PublicSiteShell } from '@/components/landing/PublicSiteShell';
import { APP_NAME } from '@/lib/constants/brand';
import { PUBLIC_SITE_CTA } from '@/lib/constants/publicSite';

export function HomeLanding() {
  return (
    <PublicSiteShell>
      <PublicSiteHeader activePath="/" tone="forest" />

      <main className="flex-1 overflow-x-clip">
        <section className="relative">
          <div className="landing-hit landing-shell landing-hero">
            <div className="landing-hero-copy">
              <p className="landing-hero-kicker">
                <span className="landing-hero-kicker-dot" aria-hidden />
                <span className="landing-hero-kicker-live">Việt Nam · công khai</span>
                <span className="landing-hero-kicker-sep" aria-hidden>
                  {'//'}
                </span>
                <span className="landing-hero-kicker-meta">không cần tài khoản để xem</span>
              </p>
              <h1 className="landing-hero-title">
                <span className="landing-hero-title-line">Một bản đồ để thấy</span>
                <span className="landing-hero-title-line">ô nhiễm môi trường</span>
                <span className="landing-hero-title-accent">và đã dọn sạch</span>
              </h1>
              <p className="landing-hero-body max-w-xl text-pretty text-base sm:text-lg">
                {APP_NAME} tập hợp báo cáo cộng đồng đã xác minh:{' '}
                <span className="landing-hero-body-em">điểm còn rác</span>,{' '}
                <span className="landing-hero-body-em">điểm đã xử lý</span> kèm ảnh after, trên cùng
                một <span className="landing-hero-body-em">bản đồ toàn quốc</span>. Miễn phí xem.
                Không cần cài gì trên web.
              </p>
              <div>
                <Link
                  href={PUBLIC_SITE_CTA.openMap.href}
                  className="landing-cta-chamfer landing-cta-primary landing-cta-hero transition-[background,box-shadow,transform] duration-300 focus-visible:ring-2 focus-visible:ring-lime-200/30 focus-visible:outline-none"
                >
                  {PUBLIC_SITE_CTA.openMap.label}
                  <ArrowRight className="landing-cta-arrow" aria-hidden />
                </Link>
              </div>
              <p className="landing-hero-footnote text-sm">
                Miễn phí · không bắt buộc đăng ký để xem bản đồ
              </p>
            </div>

            <div className="landing-hero-globe">
              <div className="landing-hero-globe-panel">
                <div className="landing-hero-globe-stage">
                  <div className="shader-frame landing-globe-frame">
                    <p className="landing-hero-globe-kicker">
                      <span className="landing-hero-kicker-dot" aria-hidden />
                      <span className="landing-hero-globe-kicker-live">Bản đồ công khai</span>
                    </p>
                    <LandingGlobe3DIsland />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingHowItWorksSection />

        <LandingAudiencesSection />

        <LandingFaqSection />

        <LandingFinalCtaSection />
      </main>

      <div className="landing-hit">
        <PublicSiteFooter tone="forest" />
      </div>
    </PublicSiteShell>
  );
}
