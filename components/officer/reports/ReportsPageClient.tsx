'use client';

import { ReportsListClient } from './ReportsListClient';

/** Tra cứu báo cáo kết thúc — list queue Closed / Rejected. */
export function ReportsPageClient() {
  return (
    <div className="-mx-2 flex h-full min-h-0 flex-1 flex-col overflow-hidden md:-mx-6">
      <ReportsListClient />
    </div>
  );
}
