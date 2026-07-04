import { CompanyAppShell } from '@/components/company/CompanyAppShell';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return <CompanyAppShell>{children}</CompanyAppShell>;
}
