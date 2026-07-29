import { SettingsShell } from '@/components/settings';
import { ADMIN_SETTINGS_NAV } from '@/lib/constants/settingsNav';

export default function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell navItems={ADMIN_SETTINGS_NAV}>{children}</SettingsShell>;
}
