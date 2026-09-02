import Image from 'next/image';
import {
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
import { LandingFinalCtaSection } from '@/components/landing/LandingFinalCtaSection';
import { APP_NAME } from '@/lib/constants/brand';

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

const ABOUT_SECTION_INTRO =
  'mx-auto flex max-w-none flex-col items-center gap-5 pb-10 text-center sm:gap-6 sm:pb-12';

function StoryNodeCard({ node }: { node: StoryNode }) {
  const Icon = node.icon;
  return (
    <div className="landing-glass flex max-w-[15.5rem] items-start gap-2.5 rounded-xl px-3 py-2.5 shadow-sm">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-lime-400/10 text-lime-200">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold tracking-[0.12em] text-white uppercase">
          {node.label}
        </span>
        <span className="mt-0.5 block text-sm font-medium text-pretty text-white">
          {node.value}
        </span>
      </span>
    </div>
  );
}

function ReportStoryVisual() {
  return (
    <>
      {/* Mobile / tablet */}
      <div className="mx-auto flex w-full max-w-lg flex-col items-center lg:hidden">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-stone-900/40 shadow-xl shadow-black/20">
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
          <p className="border-t border-white/5 px-3 py-2 text-center text-[11px] text-stone-400">
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
        <div className="absolute top-1/2 left-1/2 z-[1] w-80 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-stone-900/40 shadow-xl shadow-black/25">
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
          <p className="border-t border-white/5 px-3 py-2 text-center text-[11px] text-stone-400">
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
    <>
      <div className="landing-hit landing-shell flex-1 py-14 sm:py-20">
        <section className={ABOUT_SECTION_INTRO}>
          <h1 className="landing-audiences__title text-pretty sm:leading-[1.15]">
            Mỗi điểm ô nhiễm kể một câu chuyện.
          </h1>
          <p className="landing-audiences__subtitle mx-auto">
            Mỗi ảnh báo cáo mang theo vị trí, thời gian, loại ô nhiễm, mức độ — và khi được dọn, kèm
            ảnh after. {APP_NAME} đưa những câu chuyện đó lên bản đồ công khai Việt Nam.
          </p>
        </section>

        <section className="py-10 sm:py-14">
          <ReportStoryVisual />
        </section>

        <section className="py-10 sm:py-14">
          <div className={ABOUT_SECTION_INTRO}>
            <p className="landing-section-eyebrow whitespace-nowrap">Vì sao cần bản đồ</p>
            <h2 className="landing-how-title">Ô nhiễm không biến mất chỉ vì ta không nhìn thấy</h2>
            <p className="landing-audiences__subtitle">
              Khi cộng đồng ghi nhận điểm rác và ô nhiễm bằng ảnh có GPS, cán bộ có bằng chứng để
              xác minh, đội dọn có việc rõ ràng, và mọi người theo dõi kết quả trên cùng một bản đồ.
            </p>
          </div>
          <ul className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-5">
            {IMPACT.map(item => (
              <li key={item.title} className="landing-glass min-w-0 rounded-2xl p-5">
                <CheckCircle2 className="size-5 text-lime-200" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold text-pretty text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-pretty text-white">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="py-10 sm:py-14">
          <div className={ABOUT_SECTION_INTRO}>
            <p className="landing-section-eyebrow whitespace-nowrap">Cách hoạt động</p>
            <h2 className="landing-how-title">Từ điện thoại đến bản đồ toàn quốc</h2>
          </div>
          <ol className="mt-12 grid gap-4 sm:mt-14 md:grid-cols-3 sm:gap-5">
            {HOW_STEPS.map(step => {
              const Icon = step.icon;
              return (
                <li key={step.step} className="landing-glass relative min-w-0 rounded-2xl p-5 pt-8">
                  <span className="absolute top-4 left-5 text-xs font-bold text-white/80">
                    {step.step}
                  </span>
                  <Icon className="mt-2 size-6 text-lime-200" aria-hidden />
                  <h3 className="mt-3 text-base font-semibold text-pretty text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-pretty text-white">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <LandingFinalCtaSection />
    </>
  );
}
