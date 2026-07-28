import { OfficerSettingsShell } from '@/components/officer/settings/OfficerSettingsShell';

export default function OfficerSettingsLayout({ children }: { children: React.ReactNode }) {
  return <OfficerSettingsShell>{children}</OfficerSettingsShell>;
}
