import { APP_NAME } from '@/lib/constants/brand';

export type LandingFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const LANDING_FAQ = {
  eyebrow: 'Câu hỏi thường gặp',
  title: 'Trước khi mở bản đồ',
  items: [
    {
      id: 'what-is-greenlens',
      question: `${APP_NAME} là gì? Có mất phí không?`,
      answer:
        'Nền tảng crowdsourcing báo cáo ô nhiễm môi trường tại Việt Nam. Bản đồ công khai miễn phí, không bắt buộc đăng ký để xem. Gửi báo cáo cần tài khoản công dân hoặc ứng dụng Android.',
    },
    {
      id: 'public-map-visibility',
      question: 'Ai được thấy trên bản đồ công khai?',
      answer:
        'Chỉ báo cáo đã xác minh trở đi (còn ô nhiễm hoặc đã dọn). Bản nháp, từ chối, trùng lặp không hiện. Thông tin cá nhân người gửi được ẩn.',
    },
    {
      id: 'guest-vs-login',
      question: '“Mở bản đồ” khác gì đăng nhập?',
      answer:
        'Mở bản đồ vào chế độ guest: pan/zoom, lọc còn ô nhiễm / đã dọn. Đăng nhập để gửi báo cáo, quản lý hồ sơ hoặc vào cổng officer / cleanup.',
    },
    {
      id: 'android-apk',
      question: 'Tải ứng dụng ở đâu?',
      answer:
        'Đồ án cung cấp file APK đã build (không lên CH Play). Dùng nút “Tải ứng dụng” trên trang này. Cài đặt có thể cần cho phép nguồn không xác định trên Android.',
    },
  ],
} as const satisfies {
  eyebrow: string;
  title: string;
  items: readonly LandingFaqItem[];
};

export const LANDING_FAQ_ITEMS: readonly LandingFaqItem[] = LANDING_FAQ.items;
