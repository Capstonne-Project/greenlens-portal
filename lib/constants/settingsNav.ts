import type { SettingsNavItem } from '@/components/settings';

function buildSettingsNav(rolePrefix: string): SettingsNavItem[] {
  return [
    {
      id: 'account',
      label: 'Cài đặt tài khoản',
      href: `${rolePrefix}/settings/account`,
      icon: 'user-round',
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      href: `${rolePrefix}/settings/notifications`,
      icon: 'bell',
    },
  ];
}

export const OFFICER_SETTINGS_NAV = buildSettingsNav('/officer');
export const ADMIN_SETTINGS_NAV = buildSettingsNav('/admin');
export const COMPANY_SETTINGS_NAV = buildSettingsNav('/company');
