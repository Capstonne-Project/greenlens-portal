import { SettingsShell } from '@/components/settings';
import { OFFICER_SETTINGS_NAV } from '@/lib/constants/settingsNav';

export default function OfficerSettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell navItems={OFFICER_SETTINGS_NAV}>{children}</SettingsShell>;
}
