import type { ReactNode } from 'react';
import Link from 'next/link';
import '@designcodeio/threeui/style.css';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Leaf,
  ShieldCheck,
  Smartphone,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobeCollectionIsland } from '@/components/landing/GlobeCollectionIsland';
import { LandingFaqSection } from '@/components/landing/LandingFaqSection';
import { LandingFinalCtaSection } from '@/components/landing/LandingFinalCtaSection';
import { LandingHowItWorksSection } from '@/components/landing/LandingHowItWorksSection';
import { PublicSiteFooter } from '@/components/landing/PublicSiteFooter';
import { PublicSiteHeader } from '@/components/landing/PublicSiteHeader';
import { SylvaLivingWorldBackground } from '@/components/landing/SylvaLivingWorldBackground';
import { APP_NAME } from '@/lib/constants/brand';
import { ANDROID_APK_HREF, ANDROID_APK_LABEL, PUBLIC_SITE_CTA } from '@/lib/constants/publicSite';

const apkExternal = /^https?:\/\//i.test(ANDROID_APK_HREF);

const AUDIENCES = [
  {
    title: 'Người dân',
    desc: 'Báo cáo điểm rác gần nhà, theo dõi xử lý, xem bản đồ công khai không cần tài khoản.',
    icon: Users,
  },
  {
    title: 'Cán bộ môi trường',
    desc: 'Xác minh, ưu tiên và giao việc trên cổng riêng — dữ liệu public map không lộ PII.',
    icon: ShieldCheck,
  },
  {
    title: 'Đội dọn / công ty DVMT',
    desc: 'Nhận task, check-in hiện trường, nộp ảnh after để cộng đồng thấy kết quả.',
    icon: Leaf,
  },
  {
    title: 'Nhà báo & cộng đồng',
    desc: 'Một bản đồ minh bạch: đâu còn bẩn, đâu đã sạch — mở, không cần đăng ký.',
    icon: Eye,
  },
] as const;

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="landing-section-label">{children}</p>;
}

export function HomeLanding() {
  return (
    <div className="landing-sylva relative flex min-h-dvh flex-col text-stone-50">
      <div className="shader-frame landing-sylva-canvas" aria-hidden>
        <SylvaLivingWorldBackground />
      </div>

      {/* pointer-events-none → empty gaps show the living-world canvas; islands use landing-hit */}
      <div className="pointer-events-none relative z-10 flex min-h-dvh flex-col">
        <PublicSiteHeader activePath="/" tone="forest" />

        <main className="flex-1">
          {/* Hero — ARGOS-style: copy | globe, globe height matches copy on lg+ */}
          <section className="relative">
            <div className="landing-hit landing-shell landing-hero">
              <div className="landing-hero-copy">
                <p className="landing-hero-kicker">
                  <span className="landing-hero-kicker-dot" aria-hidden />
                  <span className="landing-hero-kicker-live">Việt Nam · công khai</span>
                  <span className="landing-hero-kicker-sep" aria-hidden>
                    //
                  </span>
                  <span className="landing-hero-kicker-meta">không cần tài khoản để xem</span>
                </p>
                <h1 className="landing-hero-title">
                  <span className="landing-hero-title-line">Một bản đồ để thấy</span>
                  <span className="landing-hero-title-line">ô nhiễm môi trường</span>
                  <span className="landing-hero-title-accent">và đã dọn sạch</span>
                </h1>
                <p className="landing-hero-body max-w-xl text-lg text-pretty">
                  {APP_NAME} tập hợp báo cáo cộng đồng đã xác minh:{' '}
                  <span className="landing-hero-body-em">điểm còn rác</span>,{' '}
                  <span className="landing-hero-body-em">điểm đã xử lý</span> kèm ảnh after, trên
                  cùng một <span className="landing-hero-body-em">bản đồ toàn quốc</span>. Miễn phí
                  xem. Không cần cài gì trên web.
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
                      <GlobeCollectionIsland />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <LandingHowItWorksSection />

          {/* Audiences */}
          <section>
            <div className="landing-hit landing-shell py-16 sm:py-20">
              <div className="max-w-2xl space-y-3">
                <SectionLabel>Dành cho ai</SectionLabel>
                <h2 className="text-3xl font-bold tracking-tight text-[#f4f0e6]">
                  Một nền tảng, nhiều góc nhìn
                </h2>
              </div>
              <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {AUDIENCES.map(item => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="landing-glass rounded-2xl p-5">
                      <Icon className="size-5 text-lime-200" aria-hidden />
                      <h3 className="mt-3 text-sm font-semibold text-[#f4f0e6]">{item.title}</h3>
                      <p className="mt-2 text-sm text-stone-300/90">{item.desc}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Trust + APK — glass panels, keep living-world canvas visible */}
          <section>
            <div className="landing-hit landing-shell grid gap-6 py-16 sm:py-20 lg:grid-cols-2">
              <div className="landing-glass space-y-4 rounded-2xl p-6 sm:p-8">
                <SectionLabel>Minh bạch</SectionLabel>
                <h2 className="text-3xl font-bold tracking-tight text-[#f4f0e6]">
                  Dữ liệu mở trên bản đồ, quyền riêng tư được giữ
                </h2>
                <ul className="space-y-3 text-sm text-stone-300/90">
                  <li className="flex gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-lime-200" aria-hidden />
                    Public map không hiện tên, SĐT hay email người báo cáo
                  </li>
                  <li className="flex gap-2">
                    <Eye className="mt-0.5 size-4 shrink-0 text-lime-200" aria-hidden />
                    Xem bản đồ không bắt buộc đăng nhập
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-lime-200" aria-hidden />
                    Chỉ status đã qua xác minh mới lên lớp công khai
                  </li>
                </ul>
              </div>
              <div className="landing-glass rounded-2xl p-6 sm:p-8">
                <Smartphone className="size-8 text-lime-200" aria-hidden />
                <h3 className="mt-4 text-xl font-semibold text-[#f4f0e6]">
                  Ứng dụng Android (APK)
                </h3>
                <p className="mt-2 text-sm text-stone-300/90">
                  Đồ án không phát hành lên CH Play. Tải file APK đã build để báo cáo ngoài hiện
                  trường.
                </p>
                <Button asChild className="mt-5 bg-emerald-600 text-white hover:bg-emerald-500">
                  <a
                    href={ANDROID_APK_HREF}
                    download={apkExternal ? undefined : true}
                    {...(apkExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {ANDROID_APK_LABEL}
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                </Button>
                <p className="mt-3 text-xs text-stone-400">
                  Đặt file tại{' '}
                  <code className="text-stone-300">public/downloads/greenlens.apk</code> hoặc cấu
                  hình <code className="text-stone-300">NEXT_PUBLIC_ANDROID_APK_URL</code>.
                </p>
              </div>
            </div>
          </section>

          <LandingFaqSection />

          <LandingFinalCtaSection />
        </main>

        <div className="landing-hit">
          <PublicSiteFooter tone="forest" />
        </div>
      </div>
    </div>
  );
}
