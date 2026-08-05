'use client';

import { ClipboardList } from 'lucide-react';
import { AssignReportsTab } from './AssignReportsTab';
import { LeoAssignDialog } from './LeoAssignDialog';

export function LeoAssignPageClient() {
  return (
    <>
      <header className="mb-3 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-emerald-700">
              <ClipboardList className="size-7" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Phân công</h1>
              <p className="text-xs font-normal text-slate-500">
                Phân công đội xử lý cho báo cáo đã xác minh — chọn đội phù hợp để triển khai hiện
                trường
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <AssignReportsTab Dialog={LeoAssignDialog} actionLabel="Phân công đội" />
      </div>
    </>
  );
}
