'use client';

import { AssignReportsTab } from './AssignReportsTab';
import { DeoAssignDialog } from './DeoAssignDialog';

export function DeoAssignPageClient() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý phân công</h1>
      </div>
      <AssignReportsTab status="Verified" Dialog={DeoAssignDialog} actionLabel="Phân công đơn vị" />
    </div>
  );
}
