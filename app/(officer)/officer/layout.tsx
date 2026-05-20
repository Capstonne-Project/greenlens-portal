import { OfficerNavbar } from '@/components/officer/OfficerNavbar';
import { NavigationProgressProvider } from '@/lib/providers/navigationProgressProvider';

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationProgressProvider>
        <OfficerNavbar />
        <main className="mx-auto max-w-screen-2xl px-6 py-5">{children}</main>
      </NavigationProgressProvider>
    </div>
  );
}
