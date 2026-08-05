import type { SettingsNavItem } from '@/components/settings';

function buildSettingsNav(
  rolePrefix: string,
  options?: { includeMediaLab?: boolean }
): SettingsNavItem[] {
  const items: SettingsNavItem[] = [
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

  if (options?.includeMediaLab) {
    items.push({
      id: 'media-lab',
      label: 'Media API Lab',
      href: `${rolePrefix}/settings/media-lab`,
      icon: 'upload',
    });
  }

  return items;
}

export const OFFICER_SETTINGS_NAV = buildSettingsNav('/officer');
export const ADMIN_SETTINGS_NAV = buildSettingsNav('/admin', { includeMediaLab: true });
export const COMPANY_SETTINGS_NAV = buildSettingsNav('/company', { includeMediaLab: true });
