import type { Metadata } from 'next';

/** Logo mark — sidebar + UI (PNG nguồn). */
export const APP_LOGO_MARK_SRC = '/images/logo_Greenlens.png';

/** Raster favicon — tab browser; file `public/favicon-32.png` đồng bộ artwork. */
export const APP_FAVICON_SRC = '/favicon-32.png';

/** Tên thương hiệu cố định — metadata + sidebar (không lấy từ env). */
export const APP_NAME = 'GreenLens';

export const APP_TAGLINE = 'Báo cáo ô nhiễm môi trường';

export const APP_DESCRIPTION = 'Nền tảng crowdsourcing báo cáo ô nhiễm môi trường cộng đồng';

/** Favicon tab — PNG. File `app/favicon.ico` + `app/icon.png` cùng artwork. */
export const APP_ICONS = {
  icon: [
    { url: APP_FAVICON_SRC, type: 'image/png', sizes: '32x32' },
    { url: APP_LOGO_MARK_SRC, type: 'image/png' },
  ],
  shortcut: APP_FAVICON_SRC,
  apple: APP_FAVICON_SRC,
} satisfies Metadata['icons'];
