import { ANDROID_APK_HREF, ANDROID_APK_LABEL } from '@/lib/constants/publicSite';

export type LandingAudienceItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

/**
 * Landing "Dành cho ai" — 6 vai trò GreenLens (BR actors + vòng đời BR-REP-020).
 */
export const LANDING_AUDIENCES = {
  eyebrow: 'Dành cho ai',
  title: 'Các vai trò trên GreenLens',
  subtitle:
    'Crowdsourcing báo cáo ô nhiễm tại Việt Nam: mọi vai trò theo dõi trên cùng một bản đồ công khai.',
  items: [
    {
      id: 'citizen',
      title: 'Công dân',
      description:
        'Gửi báo cáo có ảnh và vị trí GPS. Lưu bản nháp và theo dõi tiến độ xử lý trên app hoặc web.',
      href: ANDROID_APK_HREF,
      ctaLabel: ANDROID_APK_LABEL,
    },
    {
      id: 'guest',
      title: 'Khách xem bản đồ',
      description:
        'Xem bản đồ miễn phí, không cần đăng nhập. Chỉ hiện điểm đã xác minh, không lộ thông tin người gửi.',
      href: '/map',
      ctaLabel: 'Mở bản đồ',
    },
    {
      id: 'officer',
      title: 'Cán bộ môi trường',
      description: 'Xác minh báo cáo, gán đội dọn và theo dõi SLA trên cổng officer riêng.',
      href: ANDROID_APK_HREF,
      ctaLabel: ANDROID_APK_LABEL,
    },
    {
      id: 'cleanup',
      title: 'Đội dọn / DVMT',
      description:
        'Nhận task, check in hiện trường, chụp ảnh sau khi dọn và cập nhật đã xử lý lên bản đồ.',
      href: ANDROID_APK_HREF,
      ctaLabel: ANDROID_APK_LABEL,
    },
    {
      id: 'ai',
      title: 'AI hỗ trợ phân loại',
      description:
        'Gợi ý loại ô nhiễm từ ảnh. Cán bộ quyết định cuối trước khi hiển thị công khai.',
      href: ANDROID_APK_HREF,
      ctaLabel: ANDROID_APK_LABEL,
    },
    {
      id: 'community',
      title: 'Cộng đồng & báo chí',
      description: 'Theo dõi hotspot, so sánh điểm còn bẩn và đã sạch trên bản đồ mở.',
      href: '/leaderboard',
      ctaLabel: 'Bảng xếp hạng',
    },
  ],
} as const satisfies {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: readonly LandingAudienceItem[];
};
