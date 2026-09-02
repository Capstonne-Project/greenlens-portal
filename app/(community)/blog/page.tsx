import type { Metadata } from 'next';
import { LandingFinalCtaSection } from '@/components/landing/LandingFinalCtaSection';
import { PublicSiteFooter } from '@/components/landing/PublicSiteFooter';
import { PublicSiteHeader } from '@/components/landing/PublicSiteHeader';
import { PublicSiteShell } from '@/components/landing/PublicSiteShell';
import { APP_NAME } from '@/lib/constants/brand';

export const metadata: Metadata = {
  title: 'Blog',
  description: `Tin và hướng dẫn từ ${APP_NAME} — báo cáo ô nhiễm, bản đồ công khai, cộng đồng.`,
};

const BLOG_INTRO =
  'mx-auto flex max-w-3xl flex-col items-center gap-5 pb-10 text-center sm:gap-6 sm:pb-12';

const POSTS = [
  {
    slug: 'ban-do-cong-khai',
    title: 'Cách đọc bản đồ công khai: còn ô nhiễm và đã dọn',
    excerpt:
      'Hai lớp chính trên /map — khi nào pin đỏ, khi nào pin xanh, và ảnh after xuất hiện lúc nào.',
  },
  {
    slug: 'gui-bao-cao',
    title: 'Gửi báo cáo đúng cách: ảnh, GPS và mô tả',
    excerpt:
      'Checklist ngắn trước khi đăng: số ảnh, vị trí trong Việt Nam, tránh spam / trùng điểm.',
  },
  {
    slug: 'apk-android',
    title: 'Cài APK GreenLens trên Android (đồ án)',
    excerpt:
      'Vì sao không có trên CH Play, cách tải file APK và cấp quyền cài từ nguồn không xác định.',
  },
] as const;

export default function BlogPage() {
  return (
    <PublicSiteShell>
      <PublicSiteHeader activePath="/blog" tone="forest" />
      <main className="flex-1">
        <div className="landing-hit landing-shell py-14 sm:py-20">
          <header className={BLOG_INTRO}>
            <p className="landing-section-eyebrow">Blog</p>
            <h1 className="landing-audiences__title">Hướng dẫn & cập nhật</h1>
            <p className="landing-how-subtitle max-w-2xl text-pretty">
              Bản rút gọn cho đồ án — bài viết đầy đủ có thể bổ sung sau. Dùng làm mục nav giống cấu
              trúc product map hiện đại.
            </p>
          </header>

          <ul className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            {POSTS.map(post => (
              <li key={post.slug} className="min-w-0">
                <article className="landing-glass rounded-2xl px-6 py-5 sm:px-7 sm:py-6">
                  <h2 className="text-lg font-semibold leading-snug text-pretty text-white">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-pretty text-white">{post.excerpt}</p>
                  <p className="mt-4 text-xs text-white/75">
                    Sắp có nội dung chi tiết · {post.slug}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>

        <LandingFinalCtaSection />
      </main>
      <div className="landing-hit">
        <PublicSiteFooter tone="forest" />
      </div>
    </PublicSiteShell>
  );
}
