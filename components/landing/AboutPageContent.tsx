import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Leaf,
  MapPin,
  Recycle,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants/brand';
import { ANDROID_APK_HREF, ANDROID_APK_LABEL, PUBLIC_SITE_CTA } from '@/lib/constants/publicSite';

const apkExternal = /^https?:\/\//i.test(ANDROID_APK_HREF);

type StoryNode = {
  id: string;
  label: string;
  value: string;
  icon: typeof MapPin;
};

/** Sample story nodes — OpenLitterMap-style “photo tells a story”, GreenLens fields. */
const STORY_NODES: StoryNode[] = [
  {
    id: 'community',
    label: 'Cộng đồng',
    value: '3 người báo cáo cùng điểm',
    icon: Users,
  },
  {
    id: 'category',
    label: 'Loại ô nhiễm',
    value: 'Rác thải rắn',
    icon: Tag,
  },
  {
    id: 'severity',
    label: 'Mức độ',
    value: 'Trung bình',
    icon: Leaf,
  },
  {
    id: 'location',
    label: 'Tọa độ',
    value: '10.8231° N, 106.6297° E',
    icon: MapPin,
  },
  {
    id: 'address',
    label: 'Địa chỉ',
    value: 'Quận 1, TP. Hồ Chí Minh',
    icon: MapPin,
  },
  {
    id: 'status',
    label: 'Trạng thái',
    value: 'Đã xác minh',
    icon: ShieldCheck,
  },
  {
    id: 'after',
    label: 'Sau xử lý',
    value: 'Ảnh after khi đã dọn',
    icon: Recycle,
  },
  {
    id: 'time',
    label: 'Thời gian',
    value: '15/01/2026 · 14:32',
    icon: Clock3,
  },
];

/** Desktop constellation slots around the center photo (order matches STORY_NODES). */
const DESKTOP_SLOTS = [
  'left-1/2 top-2 -translate-x-1/2',
  'left-2 top-[18%]',
  'right-2 top-[18%]',
  'left-0 top-1/2 -translate-y-1/2',
  'right-0 top-1/2 -translate-y-1/2',
  'left-2 bottom-[18%]',
  'right-2 bottom-[18%]',
  'left-1/2 bottom-2 -translate-x-1/2',
] as const;

const HOW_STEPS = [
  {
    step: '1',
    title: 'Chụp & gửi báo cáo',
    body: 'Ảnh hiện trường + GPS trong Việt Nam. Thời gian và vị trí gắn vào câu chuyện của điểm ô nhiễm.',
    icon: Camera,
  },
  {
    step: '2',
    title: 'Xác minh & xử lý',
    body: 'Cán bộ môi trường xác minh; đội dọn nhận việc, check-in và nộp ảnh after khi hoàn tất.',
    icon: ShieldCheck,
  },
  {
    step: '3',
    title: 'Hiện trên bản đồ công khai',
    body: 'Guest xem lớp còn ô nhiễm / đã dọn — không cần đăng nhập. PII người gửi được ẩn.',
    icon: MapPin,
  },
] as const;

const IMPACT = [
  {
    title: 'Minh bạch trên bản đồ',
    body: 'Cộng đồng thấy điểm nào còn bẩn, điểm nào đã sạch — không chỉ tin lời hứa trên giấy.',
  },
  {
    title: 'Dữ liệu có vòng đời',
    body: 'Verified → đang xử lý → Resolved / Closed. Mỗi bước gắn ảnh và vị trí thật.',
  },
  {
    title: 'Crowdsourcing có kiểm duyệt',
    body: 'Bản nháp, từ chối, trùng lặp không lên lớp công khai. Officer quyết định cuối.',
  },
] as const;

function StoryNodeCard({ node }: { node: StoryNode }) {
  const Icon = node.icon;
  return (
    <div className="landing-glass flex max-w-[15.5rem] items-start gap-2.5 rounded-xl px-3 py-2.5 shadow-sm">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
          {node.label}
        </span>
        <span className="mt-0.5 block text-sm font-medium text-slate-900">{node.value}</span>
      </span>
    </div>
  );
}

function ReportStoryVisual() {
  return (
    <>
      {/* Mobile / tablet */}
      <div className="mx-auto flex w-full max-w-lg flex-col items-center lg:hidden">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-emerald-800/10 bg-white shadow-lg shadow-emerald-900/5">
          <div className="relative aspect-square w-full">
            <Image
              src="/images/login-hero1.png"
              alt="Minh họa hiện trường môi trường trên GreenLens"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 384px"
              priority
            />
          </div>
          <p className="border-t border-black/5 px-3 py-2 text-center text-[11px] text-slate-500">
            Minh họa · một báo cáo = ảnh + dữ liệu gắn kèm
          </p>
        </div>
        <ul className="mt-6 grid w-full gap-3 sm:grid-cols-2">
          {STORY_NODES.map(node => (
            <li key={node.id}>
              <StoryNodeCard node={node} />
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop constellation */}
      <div className="relative mx-auto hidden min-h-[36rem] w-full max-w-5xl lg:block">
        <div className="absolute top-1/2 left-1/2 z-[1] w-80 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-emerald-800/10 bg-white shadow-xl shadow-emerald-900/10">
          <div className="relative aspect-square w-full">
            <Image
              src="/images/login-hero1.png"
              alt="Minh họa hiện trường môi trường trên GreenLens"
              fill
              className="object-cover"
              sizes="320px"
              priority
            />
          </div>
          <p className="border-t border-black/5 px-3 py-2 text-center text-[11px] text-slate-500">
            Minh họa · một báo cáo = ảnh + dữ liệu gắn kèm
          </p>
        </div>
        {STORY_NODES.map((node, index) => (
          <div key={node.id} className={`absolute z-[2] ${DESKTOP_SLOTS[index]}`}>
            <StoryNodeCard node={node} />
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * About content inspired by OpenLitterMap /about structure,
 * rewritten for GreenLens (Vietnam pollution crowdsourcing).
 * @see https://openlittermap.com/about
 */
export function AboutPageContent() {
  return (
    <div className="landing-hit landing-shell flex-1 py-12 sm:py-16">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
          Giới thiệu · {APP_NAME}
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl sm:leading-[1.15]">
          Mỗi điểm ô nhiễm kể một câu chuyện.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 text-pretty sm:text-lg">
          Mỗi ảnh báo cáo mang theo vị trí, thời gian, loại ô nhiễm, mức độ — và khi được dọn, kèm
          ảnh after. {APP_NAME} đưa những câu chuyện đó lên bản đồ công khai Việt Nam.
        </p>
      </section>

      <section className="mt-14 sm:mt-16">
        <ReportStoryVisual />
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500">
          Bố cục lấy cảm hứng từ{' '}
          <a
            href="https://openlittermap.com/about"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            OpenLitterMap
          </a>
          : mỗi quan sát môi trường là một gói dữ liệu — không chỉ một tấm ảnh.
        </p>
      </section>

      <section className="mt-20 sm:mt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
            Vì sao cần bản đồ
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Ô nhiễm không biến mất chỉ vì ta không nhìn thấy
          </h2>
          <p className="mt-4 text-slate-600">
            Khi cộng đồng ghi nhận điểm rác và ô nhiễm bằng ảnh có GPS, cán bộ có bằng chứng để xác
            minh, đội dọn có việc rõ ràng, và mọi người theo dõi kết quả trên cùng một bản đồ.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {IMPACT.map(item => (
            <li key={item.title} className="landing-glass rounded-2xl p-5">
              <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20 sm:mt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
            Cách hoạt động
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Từ điện thoại đến bản đồ toàn quốc
          </h2>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {HOW_STEPS.map(step => {
            const Icon = step.icon;
            return (
              <li key={step.step} className="landing-glass relative rounded-2xl p-5 pt-8">
                <span className="absolute top-4 left-5 text-xs font-bold text-emerald-700/80">
                  {step.step}
                </span>
                <Icon className="mt-2 size-6 text-emerald-700" aria-hidden />
                <h3 className="mt-3 text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-20 sm:mt-24">
        <div className="landing-glass grid gap-8 rounded-2xl p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
              Công cụ trong tay bạn
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Điện thoại không chỉ để lướt — nó thu thập dữ liệu môi trường
            </h2>
            <p className="mt-4 text-slate-600">
              Bật vị trí, chụp ảnh điểm ô nhiễm, gửi báo cáo. Web xem bản đồ miễn phí; Android dùng
              APK đồ án để báo cáo ngoài hiện trường.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                Hướng ống kính vào môi trường — không lộ PII trên map công khai
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                Guest mở bản đồ không cần tài khoản
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                Before / after giúp cộng đồng thấy kết quả dọn dẹp
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-dashed border-emerald-200/80 bg-emerald-50/50 p-6 text-sm text-slate-600">
            <p className="font-semibold text-emerald-900">{APP_NAME} · SU26SE049</p>
            <p className="mt-2">
              Đồ án capstone crowdsourcing báo cáo ô nhiễm: Citizen · Officer · Cleanup · bản đồ
              guest. Cùng tinh thần “mỗi quan sát là dữ liệu” với các nền tảng open litter map, phạm
              vi và quy trình theo Business Rules Việt Nam.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 mb-4 sm:mt-20">
        <div className="flex flex-col items-start gap-6 rounded-2xl border border-emerald-600/25 bg-emerald-600/90 p-8 text-white shadow-lg shadow-emerald-900/10 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-xl space-y-2">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Sẵn sàng xem câu chuyện trên bản đồ?
            </h2>
            <p className="text-emerald-50/95">
              Mở bản đồ công khai, hoặc tải APK để gửi báo cáo ngoài hiện trường.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
              <Link href={PUBLIC_SITE_CTA.openMap.href}>
                {PUBLIC_SITE_CTA.openMap.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <a
                href={ANDROID_APK_HREF}
                download={apkExternal ? undefined : true}
                {...(apkExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {ANDROID_APK_LABEL}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
