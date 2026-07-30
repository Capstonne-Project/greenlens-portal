import { AdminUsersView } from '@/components/admin/users/AdminUsersView';
import { Suspense } from 'react';

export default function AdminUsersOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-w-0 animate-pulse space-y-4">
          <div className="h-10 w-64 rounded-lg bg-muted" />
          <div className="h-24 rounded-card bg-muted" />
          <div className="h-12 rounded-card bg-muted" />
          <div className="h-[420px] rounded-card bg-muted" />
        </div>
      }
    >
      <AdminUsersView />
    </Suspense>
  );
}
