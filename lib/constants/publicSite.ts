import { APP_NAME } from '@/lib/constants/brand';

export type PublicSiteNavItem = {
  id: string;
  label: string;
  href: string;
};

/** Nav marketing — Bản đồ / Giới thiệu / Bảng xếp hạng / Blog (logo về `/`). */
export const PUBLIC_SITE_NAV: PublicSiteNavItem[] = [
  { id: 'map', label: 'Bản đồ', href: '/map' },
  { id: 'about', label: 'Giới thiệu', href: '/about' },
  { id: 'leaderboard', label: 'Bảng xếp hạng', href: '/leaderboard' },
  { id: 'blog', label: 'Blog', href: '/blog' },
];

export const PUBLIC_SITE_CTA = {
  openMap: { label: 'Mở bản đồ', href: '/map' },
  login: { label: 'Đăng nhập', href: '/login' },
  register: { label: 'Đăng báo cáo', href: '/register' },
} as const;

/**
 * APK mobile — Google Drive folder (capstone build).
 * Ghi đè bằng `NEXT_PUBLIC_ANDROID_APK_URL` hoặc file local `/downloads/greenlens.apk`.
 */
export const ANDROID_APK_DEFAULT_URL =
  'https://drive.google.com/drive/folders/1Alt5q2827i4GkXSlGnlHx0jmR4MKD2VF';

export const ANDROID_APK_HREF =
  process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim() || ANDROID_APK_DEFAULT_URL;

export const ANDROID_APK_LABEL = 'Tải ứng dụng';

/** Anchor props for the capstone APK — local download vs absolute URL. */
export function getAndroidApkLinkProps(href: string = ANDROID_APK_HREF) {
  const external = /^https?:\/\//i.test(href);
  return {
    href,
    ...(external
      ? { target: '_blank' as const, rel: 'noopener noreferrer' }
      : { download: true as const }),
  };
}

export type PublicSiteFooterLink = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
};

/** Nhóm link chân trang — layout 4 cột (product / resources / company). */
export const PUBLIC_SITE_FOOTER_PRODUCT_LINKS: PublicSiteFooterLink[] = [
  { id: 'map', label: 'Bản đồ công khai', href: '/map' },
  { id: 'leaderboard', label: 'Bảng xếp hạng', href: '/leaderboard' },
  { id: 'register', label: 'Đăng báo cáo', href: '/register' },
  { id: 'login', label: 'Đăng nhập', href: '/login' },
  { id: 'apk', label: 'Tải ứng dụng (APK)', href: ANDROID_APK_HREF },
];

export const PUBLIC_SITE_FOOTER_RESOURCE_LINKS: PublicSiteFooterLink[] = [
  { id: 'blog', label: 'Blog & hướng dẫn', href: '/blog' },
  { id: 'about', label: 'Giới thiệu dự án', href: '/about' },
  { id: 'map-guide', label: 'Cách đọc bản đồ', href: '/blog' },
  { id: 'report-guide', label: 'Gửi báo cáo đúng cách', href: '/blog' },
];

export const PUBLIC_SITE_FOOTER_COMPANY_LINKS: PublicSiteFooterLink[] = [
  { id: 'about', label: 'Về GreenLens', href: '/about' },
  { id: 'privacy', label: 'Quyền riêng tư', href: '/privacy' },
  { id: 'contact', label: 'Liên hệ đồ án', href: '/about' },
  { id: 'login', label: 'Cổng đăng nhập', href: '/login' },
];

export const PUBLIC_SITE_SOCIAL_LINKS = [
  {
    id: 'facebook',
    label: 'Facebook GreenLens',
    href: 'https://www.facebook.com/profile.php?id=61577681312569',
  },
] as const;

export const PUBLIC_SITE_FOOTER = {
  copyright: `© ${new Date().getFullYear()} ${APP_NAME} · Đồ án capstone SU26SE049`,
  tagline: 'Crowdsourcing báo cáo ô nhiễm — minh bạch trên bản đồ Việt Nam.',
} as const;
