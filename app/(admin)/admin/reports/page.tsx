import { AdminReportsView } from '@/components/admin/reports/AdminReportsView';
import { Suspense } from 'react';

export default function AdminReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-w-0 animate-pulse space-y-6">
          <div className="h-10 w-72 rounded-lg bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-card bg-muted" />
            ))}
          </div>
          <div className="h-[480px] rounded-card bg-muted" />
        </div>
      }
    >
      <AdminReportsView />
    </Suspense>
  );
}
