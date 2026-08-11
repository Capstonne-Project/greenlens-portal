'use client';

import { ReportsListClient } from './ReportsListClient';

/** Tra cứu báo cáo kết thúc — list queue Resolved / Closed / Rejected. */
export function ReportsPageClient() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ReportsListClient />
    </div>
  );
}
