import { OfficerNavbar } from '@/components/officer/OfficerNavbar';
import { NavigationProgressProvider } from '@/lib/providers/navigationProgressProvider';

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <NavigationProgressProvider>
        <OfficerNavbar />
        <main className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">{children}</main>
      </NavigationProgressProvider>
    </div>
  );
}
