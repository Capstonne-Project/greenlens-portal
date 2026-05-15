import { AdminUsersView } from '@/components/admin/users/AdminUsersView';
import { Suspense } from 'react';

export default function AdminUsersOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-w-0 animate-pulse space-y-6">
          <div className="h-10 w-64 rounded-lg bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-card bg-muted" />
            ))}
          </div>
          <div className="h-12 rounded-card bg-muted" />
          <div className="h-[420px] rounded-card bg-muted" />
        </div>
      }
    >
      <AdminUsersView />
    </Suspense>
  );
}
