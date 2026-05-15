import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav';
import { AdminSidebarProfile } from '@/components/admin/AdminSidebarProfile';
import { AdminTopHeader } from '@/components/admin/AdminTopHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <AdminSidebarNav />
        <AdminSidebarProfile />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopHeader />
        <main className="w-full min-w-0 flex-1 px-4 py-5 md:px-5 md:py-6">{children}</main>
      </div>
    </div>
  );
}
