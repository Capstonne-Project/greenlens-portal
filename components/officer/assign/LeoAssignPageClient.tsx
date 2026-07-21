'use client';

import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';
import { useAuthStore } from '@/lib/store/authStore';
import { CircleHelp } from 'lucide-react';
import { AssignReportsTab } from './AssignReportsTab';
import { LeoAssignDialog } from './LeoAssignDialog';

export function LeoAssignPageClient() {
  const user = useAuthStore(s => s.user);
  const fullName = user?.name?.trim() || 'Người dùng';

  return (
    <>
      <header className="mb-3 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-[0.35rem]">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Phân công</h1>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.15rem] text-slate-500 hover:bg-slate-400/15 hover:text-slate-700"
                aria-label="Thông tin quản lý phân công"
              >
                <CircleHelp className="size-4" aria-hidden />
              </button>
            </div>
          </div>
          <TypewriterEffectSmooth
            words={[
              { text: 'Welcome', className: 'font-normal text-slate-500' },
              { text: 'back,', className: 'font-normal text-slate-500' },
              {
                text: fullName,
                className: 'font-medium text-slate-800 dark:text-slate-100',
              },
            ]}
            className="mt-1 my-0"
            textClassName="text-sm font-normal sm:text-sm md:text-sm lg:text-sm xl:text-sm"
            cursorClassName="h-3.5 w-0.5 bg-slate-400 sm:h-3.5 xl:h-3.5"
            hideCursorOnComplete
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <AssignReportsTab Dialog={LeoAssignDialog} actionLabel="Phân công đội" />
      </div>
    </>
  );
}
