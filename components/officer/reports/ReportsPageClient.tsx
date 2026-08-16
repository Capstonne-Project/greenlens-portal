'use client';

import { ReportsListClient } from './ReportsListClient';

/** Tra cứu báo cáo — DEO: GET /v1/departments/my/reports · LEO: GET /v1/offices/my/reports. */
export function ReportsPageClient() {
  return (
    <div className="-mx-2 flex h-full min-h-0 flex-1 flex-col overflow-hidden md:-mx-6">
      <ReportsListClient />
    </div>
  );
}
