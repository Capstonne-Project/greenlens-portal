import { SettingsShell } from '@/components/settings';
import { COMPANY_SETTINGS_NAV } from '@/lib/constants/settingsNav';

export default function CompanySettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell navItems={COMPANY_SETTINGS_NAV}>{children}</SettingsShell>;
}
