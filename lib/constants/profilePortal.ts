/**
 * Single source of truth — profile routes & portal copy per persona.
 * Import from here whenever linking to or rendering profile/account screens.
 */

export type ProfilePortalVariant = 'admin' | 'company' | 'officer';

export const PROFILE_ROUTES: Record<ProfilePortalVariant, string> = {
  admin: '/admin/profile',
  company: '/company/account',
  officer: '/officer/settings/account',
} as const;

export type ProfilePortalConfig = {
  badgeLabel: string;
  title: string;
  subtitle: string;
  infoHintTitle: string;
  infoHintBody: string;
  /** Optional link below account status (e.g. company notification prefs). */
  notificationPreferencesHref?: string;
  showAccountTimestamps?: boolean;
};

export const PROFILE_PORTAL_CONFIG: Record<ProfilePortalVariant, ProfilePortalConfig> = {
  admin: {
    badgeLabel: 'Tài khoản quản trị',
    title: 'Hồ sơ cá nhân',
    subtitle:
      'Quản lý thông tin cá nhân, ảnh đại diện và quyền truy cập trong hệ thống báo cáo ô nhiễm môi trường.',
    infoHintTitle: 'Thông tin này dùng cho tài khoản quản trị',
    infoHintBody:
      'Họ tên và ảnh đại diện sẽ được hiển thị trong dashboard, lịch sử thao tác và các hoạt động quản trị.',
  },
  company: {
    badgeLabel: 'Tài khoản công ty',
    title: 'Tài khoản của tôi',
    subtitle: 'Quản lý thông tin cá nhân và ảnh đại diện dùng trong cổng công ty.',
    infoHintTitle: 'Thông tin dùng cho cổng công ty',
    infoHintBody:
      'Họ tên và ảnh đại diện hiển thị khi điều phối báo cáo, phân công và thông báo nội bộ.',
    notificationPreferencesHref: '/company/notifications/preferences',
    showAccountTimestamps: true,
  },
  officer: {
    badgeLabel: 'Tài khoản cán bộ',
    title: 'Tài khoản của tôi',
    subtitle: 'Quản lý thông tin cá nhân và ảnh đại diện trong cổng cán bộ môi trường.',
    infoHintTitle: 'Thông tin dùng cho cổng cán bộ',
    infoHintBody:
      'Họ tên và ảnh đại diện hiển thị khi xác minh báo cáo, phân công và theo dõi tiến độ xử lý.',
  },
};

export function getProfileRoute(variant: ProfilePortalVariant): string {
  return PROFILE_ROUTES[variant];
}

/** Header title for profile routes — use in shell page title helpers. */
export function getProfilePageTitleByPath(pathname: string): string | null {
  if (pathname === PROFILE_ROUTES.admin) return PROFILE_PORTAL_CONFIG.admin.title;
  if (pathname === PROFILE_ROUTES.company) return PROFILE_PORTAL_CONFIG.company.title;
  if (pathname === PROFILE_ROUTES.officer) return PROFILE_PORTAL_CONFIG.officer.title;
  return null;
}
