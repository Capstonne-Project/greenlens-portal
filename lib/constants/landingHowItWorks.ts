/**
 * Landing "How it works" — 3-step report flow with Mapbox-style phone showcase.
 * Screenshots in `public/images/landing/`.
 */
import { ANDROID_APK_HREF } from '@/lib/constants/publicSite';
export type LandingHowItWorksStep = {
  id: string;
  step: string;
  title: string;
  body: string;
  highlights: readonly string[];
  /** Screenshot in `public/images/landing/` — Magic UI iPhone With Image. */
  imageSrc: string;
  imageAlt: string;
  /** Optional floating panel behind/right of iPhone (Mapbox-style wing). */
  sideImageSrc?: string;
  sideImageAlt?: string;
  /** Optional floating panel behind/left of iPhone (triple showcase). */
  leftImageSrc?: string;
  leftImageAlt?: string;
  cta?: { label: string; href: string };
};

export const LANDING_HOW_IT_WORKS = {
  eyebrow: 'Quy trình báo cáo',
  title: 'Cách GreenLens hoạt động',
  subtitle:
    'Xem bản đồ, chọn ảnh hiện trường, AI gợi ý phân loại. Vài phút là gửi xong báo cáo tới officer xác minh.',
  steps: [
    {
      id: 'capture',
      step: '01',
      title: 'Xem bản đồ & chọn ảnh',
      body: 'Mở GreenLens để xem các điểm báo cáo quanh bạn trên bản đồ. Chụp ảnh mới hoặc chọn từ thư viện, rồi chọn một ảnh để AI phân tích.',
      highlights: [
        'Bản đồ báo cáo trong khu vực',
        'Chụp hiện trường hoặc chọn từ thư viện',
        'Chọn 1 ảnh gửi AI phân tích',
      ],
      imageSrc: '/images/landing/mobile-step-01-capture.jpg',
      imageAlt: 'Bản đồ báo cáo và màn hình chọn ảnh trên GreenLens',
      sideImageSrc: '/images/landing/mobile-step-02-describe.jpg',
      sideImageAlt: 'Chụp ảnh hoặc chọn từ thư viện để AI phân tích trên GreenLens',
      cta: { label: 'Tải ứng dụng Android', href: ANDROID_APK_HREF },
    },
    {
      id: 'ai-analyze',
      step: '02',
      title: 'AI phân tích ảnh',
      body: 'AI nhận diện loại rác, mức độ nghiêm trọng và gợi ý mô tả. Bạn xem kết quả, chỉnh sửa nếu cần rồi áp dụng vào báo cáo.',
      highlights: [
        'Loại ô nhiễm & độ tin cậy AI',
        'Gợi ý mức độ: Thấp → Khẩn cấp',
        'Mô tả tự động, có thể chỉnh sửa',
      ],
      imageSrc: '/images/landing/mobile-step-01-ai-result.jpg',
      imageAlt: 'Kết quả phân tích AI: loại rác, mức độ và mô tả gợi ý trên GreenLens',
      leftImageSrc: '/images/landing/mobile-step-01-capture.png',
      leftImageAlt: 'Chọn ảnh để AI phân tích trên GreenLens',
      sideImageSrc: '/images/landing/mobile-step-01-ai-scan.jpg',
      sideImageAlt: 'AI đang quét và phân tích ảnh hiện trường trên GreenLens',
      cta: { label: 'Đăng nhập để gửi', href: '/login' },
    },
    {
      id: 'submit',
      step: '03',
      title: 'Gắn vị trí & gửi báo cáo',
      body: 'Xác nhận địa chỉ trên bản đồ, chọn loại rác và tag phù hợp với hiện trường. Nhấn gửi, báo cáo vào hàng đợi officer xác minh.',
      highlights: [
        'Vị trí GPS trên bản đồ',
        'Tag loại rác theo hiện trường',
        'Gửi thành công, theo dõi trạng thái',
      ],
      imageSrc: '/images/landing/mobile-step-03-complete.png',
      imageAlt: 'Màn hình hoàn tất gửi báo cáo thành công trên GreenLens',
      leftImageSrc: '/images/landing/mobile-step-03-location.jpg',
      leftImageAlt: 'Xác nhận vị trí báo cáo trên bản đồ GreenLens',
      sideImageSrc: '/images/landing/mobile-step-03-tags.png',
      sideImageAlt: 'Chọn loại rác và tag trên GreenLens',
      cta: { label: 'Tải ứng dụng Android', href: ANDROID_APK_HREF },
    },
  ],
} as const;

export const LANDING_HOW_IT_WORKS_STEPS: readonly LandingHowItWorksStep[] =
  LANDING_HOW_IT_WORKS.steps;
