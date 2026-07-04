'use client';

import { CircleHelp, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
import { AssignReportsTab } from './AssignReportsTab';
import { LeoAssignDialog } from './LeoAssignDialog';
import { MembersTab } from './MembersTab';
import { TeamTab } from './TeamTab';

export type LeoAssignSection = 'reports' | 'teams' | 'members';

type ViewMode = 'list' | 'board';

const SECTION_TITLE: Record<LeoAssignSection, string> = {
  reports: 'Phân công',
  teams: 'Đội xử lý',
  members: 'Thành viên',
};

export function LeoAssignPageClient({ section = 'reports' }: { section?: LeoAssignSection }) {
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  return (
    <>
      <header className="mb-3 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-[0.35rem]">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                {SECTION_TITLE[section]}
              </h1>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.15rem] text-slate-500 hover:bg-slate-400/15 hover:text-slate-700"
                aria-label="Thông tin quản lý phân công"
              >
                <CircleHelp className="size-4" aria-hidden />
              </button>
            </div>

            {section === 'teams' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode('board')}
                  title="Board"
                  className={`flex size-8 items-center justify-center rounded-lg transition-all ${
                    viewMode === 'board'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Danh sách"
                  className={`flex size-8 items-center justify-center rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        {section === 'reports' && (
          <AssignReportsTab Dialog={LeoAssignDialog} actionLabel="Phân công đội" />
        )}
        {section === 'teams' && <TeamTab viewMode={viewMode} />}
        {section === 'members' && <MembersTab />}
      </div>
    </>
  );
}
