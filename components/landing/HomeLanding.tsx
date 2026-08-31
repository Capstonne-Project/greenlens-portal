import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  Leaf,
  MapPinned,
  Recycle,
  ShieldCheck,
  Smartphone,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingAtmosphere } from '@/components/landing/LandingAtmosphere';
import { PublicSiteFooter } from '@/components/landing/PublicSiteFooter';
import { PublicSiteHeader } from '@/components/landing/PublicSiteHeader';
import { APP_NAME } from '@/lib/constants/brand';
import { ANDROID_APK_HREF, ANDROID_APK_LABEL, PUBLIC_SITE_CTA } from '@/lib/constants/publicSite';

const apkExternal = /^https?:\/\//i.test(ANDROID_APK_HREF);

const LAYERS = [
  {
    id: '01',
    eyebrow: 'Lớp · Còn ô nhiễm',
    title: 'Điểm rác và ô nhiễm đã được xác minh',
    body: 'Chỉ hiện báo cáo đã qua kiểm duyệt — không lẫn tin nháp hay từ chối. Zoom vào khu vực bạn quan tâm để thấy pin chi tiết.',
    points: [
      'Trạng thái công khai: đã xác minh, đang xử lý, đang dọn',
      'Ảnh và vị trí GPS trong phạm vi Việt Nam',
      'Lọc theo tỉnh / khung nhìn bản đồ',
    ],
    href: '/map?presence=active',
    cta: 'Xem điểm còn ô nhiễm',
    icon: MapPinned,
  },
  {
    id: '02',
    eyebrow: 'Lớp · Đã dọn',
    title: 'Câu chuyện before / after sau xử lý',
    body: 'Khi đội dọn hoàn tất hoặc công dân xác nhận đóng, điểm chuyển sang lớp đã dọn — kèm ảnh sau xử lý khi có.',
    points: [
      'Pin xanh: Resolved / Closed',
      'Ảnh sau dọn nổi bật trên thẻ báo cáo',
      'Minh bạch kết quả cho cộng đồng',
    ],
    href: '/map?presence=cleaned',
    cta: 'Xem điểm đã dọn',
    icon: Recycle,
  },
  {
    id: '03',
    eyebrow: 'Lớp · Báo cáo',
    title: 'Gửi điểm ô nhiễm bằng ảnh và GPS',
    body: 'Công dân chụp ảnh, gắn vị trí và mô tả. Officer xác minh; đội dọn nhận việc — vòng đời rõ ràng trên cùng một nền tảng.',
    points: [
      '1–5 ảnh, GPS hợp lệ trong Việt Nam',
      'Theo dõi trạng thái sau khi gửi',
      'Ứng dụng Android tải APK (đồ án)',
    ],
    href: '/register',
    cta: 'Đăng ký để báo cáo',
    icon: Camera,
  },
] as const;

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

const FAQS = [
  {
    q: `${APP_NAME} là gì? Có mất phí không?`,
    a: 'Nền tảng crowdsourcing báo cáo ô nhiễm môi trường tại Việt Nam. Bản đồ công khai miễn phí, không bắt buộc đăng ký để xem. Gửi báo cáo cần tài khoản công dân hoặc ứng dụng Android.',
  },
  {
    q: 'Ai được thấy trên bản đồ công khai?',
    a: 'Chỉ báo cáo đã xác minh trở đi (còn ô nhiễm hoặc đã dọn). Bản nháp, từ chối, trùng lặp không hiện. Thông tin cá nhân người gửi được ẩn.',
  },
  {
    q: '“Mở bản đồ” khác gì đăng nhập?',
    a: 'Mở bản đồ vào chế độ guest: pan/zoom, lọc còn ô nhiễm / đã dọn. Đăng nhập để gửi báo cáo, quản lý hồ sơ hoặc vào cổng officer / cleanup.',
  },
  {
    q: 'Tải ứng dụng ở đâu?',
    a: 'Đồ án cung cấp file APK đã build (không lên CH Play). Dùng nút “Tải ứng dụng” trên trang này. Cài đặt có thể cần cho phép nguồn không xác định trên Android.',
  },
] as const;

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">{children}</p>
  );
}

export function HomeLanding() {
  return (
    <div className="relative flex min-h-dvh flex-col text-foreground">
      <LandingAtmosphere />

      {/* pointer-events-none → empty gaps hit the ripple grid; islands use landing-hit */}
      <div className="pointer-events-none relative z-10 flex min-h-dvh flex-col">
        <PublicSiteHeader activePath="/" />

        <main className="flex-1">
          {/* Hero */}
          <section className="relative">
            <div className="landing-hit landing-shell flex flex-col gap-10 py-16 sm:py-24 lg:flex-row lg:items-end lg:justify-between lg:py-28">
              <div className="max-w-2xl space-y-6">
                <p className="text-sm font-medium text-emerald-800">
                  Việt Nam · công khai · không cần tài khoản để xem
                </p>
                <h1 className="text-4xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                  Một bản đồ để thấy ô nhiễm — và nơi đã được dọn sạch
                </h1>
                <p className="max-w-xl text-lg text-slate-600 text-pretty">
                  {APP_NAME} tập hợp báo cáo cộng đồng đã xác minh: điểm còn rác, điểm đã xử lý kèm
                  ảnh after, trên cùng một bản đồ toàn quốc. Miễn phí xem. Không cần cài gì trên
                  web.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-emerald-600 px-6 text-white hover:bg-emerald-500"
                  >
                    <Link href={PUBLIC_SITE_CTA.openMap.href}>
                      {PUBLIC_SITE_CTA.openMap.label}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-emerald-700/20 bg-white/60 backdrop-blur-sm"
                  >
                    <Link href={PUBLIC_SITE_CTA.register.href}>
                      {PUBLIC_SITE_CTA.register.label}
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-slate-500">
                  Miễn phí · không bắt buộc đăng ký để xem bản đồ · APK cho điện thoại
                </p>
              </div>

              <div className="landing-glass w-full max-w-md rounded-2xl p-5">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Trên bản đồ
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="mt-1 size-2.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                    <span>
                      <strong className="font-medium text-slate-900">Còn ô nhiễm</strong>
                      <span className="block text-slate-600">
                        Đã xác minh / đang xử lý — cần cộng đồng theo dõi
                      </span>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span
                      className="mt-1 size-2.5 shrink-0 rounded-full bg-emerald-600"
                      aria-hidden
                    />
                    <span>
                      <strong className="font-medium text-slate-900">Đã dọn</strong>
                      <span className="block text-slate-600">
                        Resolved / Closed — có thể kèm ảnh sau xử lý
                      </span>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                    <span className="text-slate-600">
                      Guest pan/zoom tự do — đăng nhập chỉ khi muốn gửi báo cáo
                    </span>
                  </li>
                </ul>
                <Button asChild className="mt-5 w-full bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/map">
                    Vào bản đồ ngay
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Feature layers — transparent shell, glass media frames */}
          <section>
            <div className="landing-hit landing-shell space-y-16 py-16 sm:py-20">
              <div className="max-w-2xl space-y-3">
                <SectionLabel>Các lớp trên bản đồ</SectionLabel>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Thiết kế quanh báo cáo điểm rác — không phải radar tàu bay
                </h2>
                <p className="text-slate-600">
                  Cấu trúc trang giống một product map hiện đại: giới thiệu từng lớp, rồi một nút
                  đưa thẳng vào bản đồ.
                </p>
              </div>

              {LAYERS.map((layer, index) => {
                const Icon = layer.icon;
                const reverse = index % 2 === 1;
                return (
                  <article
                    key={layer.id}
                    className={`grid gap-8 lg:grid-cols-2 lg:items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}
                  >
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-emerald-700">
                        [{layer.id}] {layer.eyebrow}
                      </p>
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {layer.title}
                      </h3>
                      <p className="text-slate-600">{layer.body}</p>
                      <ul className="space-y-2 text-sm text-slate-800">
                        {layer.points.map(point => (
                          <li key={point} className="flex gap-2">
                            <CheckCircle2
                              className="mt-0.5 size-4 shrink-0 text-emerald-600"
                              aria-hidden
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                      <Button asChild variant="link" className="h-auto px-0 text-emerald-800">
                        <Link href={layer.href}>
                          {layer.cta}
                          <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      </Button>
                    </div>
                    <div className="landing-glass flex min-h-52 items-center justify-center rounded-2xl p-8">
                      <div className="text-center">
                        <Icon className="mx-auto size-10 text-emerald-700" aria-hidden />
                        <p className="mt-3 text-sm font-medium text-emerald-900">{layer.eyebrow}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Audiences */}
          <section>
            <div className="landing-hit landing-shell py-16 sm:py-20">
              <div className="max-w-2xl space-y-3">
                <SectionLabel>Dành cho ai</SectionLabel>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Một nền tảng, nhiều góc nhìn
                </h2>
              </div>
              <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {AUDIENCES.map(item => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="landing-glass rounded-2xl p-5">
                      <Icon className="size-5 text-emerald-700" aria-hidden />
                      <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Trust + APK — glass panels, keep atmosphere visible */}
          <section>
            <div className="landing-hit landing-shell grid gap-6 py-16 sm:py-20 lg:grid-cols-2">
              <div className="landing-glass space-y-4 rounded-2xl p-6 sm:p-8">
                <SectionLabel>Minh bạch</SectionLabel>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Dữ liệu mở trên bản đồ, quyền riêng tư được giữ
                </h2>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                    Public map không hiện tên, SĐT hay email người báo cáo
                  </li>
                  <li className="flex gap-2">
                    <Eye className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                    Xem bản đồ không bắt buộc đăng nhập
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                    Chỉ status đã qua xác minh mới lên lớp công khai
                  </li>
                </ul>
              </div>
              <div className="landing-glass rounded-2xl p-6 sm:p-8">
                <Smartphone className="size-8 text-emerald-700" aria-hidden />
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  Ứng dụng Android (APK)
                </h3>
                <p className="mt-2 text-sm text-slate-600">
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
                <p className="mt-3 text-xs text-slate-500">
                  Đặt file tại{' '}
                  <code className="text-slate-600">public/downloads/greenlens.apk</code> hoặc cấu
                  hình <code className="text-slate-600">NEXT_PUBLIC_ANDROID_APK_URL</code>.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <div className="landing-hit landing-shell max-w-3xl py-16 sm:py-20">
              <div className="space-y-3 text-center">
                <SectionLabel>Câu hỏi thường gặp</SectionLabel>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Trước khi mở bản đồ
                </h2>
              </div>
              <dl className="mt-10 space-y-4">
                {FAQS.map(item => (
                  <div key={item.q} className="landing-glass rounded-xl p-5">
                    <dt className="font-semibold text-slate-900">{item.q}</dt>
                    <dd className="mt-2 text-sm text-slate-600">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* Final CTA — full-bleed band, Argos-style centered stack */}
          <section className="landing-hit landing-cta-band py-16 sm:py-20 lg:py-24">
            <div className="landing-shell relative z-10 flex flex-col items-center px-4 text-center sm:px-6">
              <h2 className="whitespace-nowrap text-lg font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl lg:text-4xl">
                Sẵn sàng xem câu chuyện trên bản đồ?
              </h2>
              <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
                Mở bản đồ miễn phí, không cần tài khoản để khám phá.
              </p>
              <Link
                href={PUBLIC_SITE_CTA.openMap.href}
                className="landing-cta-chamfer mt-8 inline-flex items-center gap-2 bg-emerald-600 px-8 py-3.5 font-mono text-sm font-semibold tracking-wide text-white transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:outline-none sm:text-base"
              >
                {PUBLIC_SITE_CTA.openMap.label}
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </section>
        </main>

        <div className="landing-hit">
          <PublicSiteFooter />
        </div>
      </div>
    </div>
  );
}
