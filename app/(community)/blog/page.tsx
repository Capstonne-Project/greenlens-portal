import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingAtmosphere } from '@/components/landing/LandingAtmosphere';
import { PublicSiteFooter } from '@/components/landing/PublicSiteFooter';
import { PublicSiteHeader } from '@/components/landing/PublicSiteHeader';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants/brand';

export const metadata: Metadata = {
  title: 'Blog',
  description: `Tin và hướng dẫn từ ${APP_NAME} — báo cáo ô nhiễm, bản đồ công khai, cộng đồng.`,
};

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
    <div className="relative flex min-h-dvh flex-col">
      <LandingAtmosphere />
      <div className="pointer-events-none relative z-10 flex min-h-dvh flex-col">
        <PublicSiteHeader activePath="/blog" />
        <main className="landing-hit landing-shell mx-auto w-full max-w-3xl flex-1 py-14">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
              Blog
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Hướng dẫn & cập nhật
            </h1>
            <p className="text-slate-600">
              Bản rút gọn cho đồ án — bài viết đầy đủ có thể bổ sung sau. Dùng làm mục nav giống cấu
              trúc product map hiện đại.
            </p>
          </div>

          <ul className="mt-10 space-y-4">
            {POSTS.map(post => (
              <li key={post.slug}>
                <article className="landing-glass rounded-2xl p-5">
                  <h2 className="text-lg font-semibold text-slate-900">{post.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Sắp có nội dung chi tiết · {post.slug}
                  </p>
                </article>
              </li>
            ))}
          </ul>

          <Button asChild className="mt-10 bg-emerald-600 text-white hover:bg-emerald-500">
            <Link href="/map">Mở bản đồ</Link>
          </Button>
        </main>
        <div className="landing-hit">
          <PublicSiteFooter />
        </div>
      </div>
    </div>
  );
}
