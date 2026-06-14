'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
import { AssignReportsTab } from './AssignReportsTab';
import { LeoAssignDialog } from './LeoAssignDialog';
import { MembersTab } from './MembersTab';
import { TeamTab } from './TeamTab';

type TabValue = 'reports' | 'teams' | 'members';
type ViewMode = 'list' | 'board';

const TAB_TRIGGER =
  'relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-emerald-700 data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:shadow-none';

export function LeoAssignPageClient() {
  const [activeTab, setActiveTab] = useState<TabValue>('reports');
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý phân công</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Phân công báo cáo cho đội xử lý và quản lý thành viên đội
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={v => setActiveTab(v as TabValue)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex shrink-0 items-center border-b border-border">
          <TabsList className="h-auto flex-1 justify-start rounded-none bg-transparent p-0">
            <TabsTrigger value="reports" className={TAB_TRIGGER}>
              Báo cáo
            </TabsTrigger>
            <TabsTrigger value="teams" className={TAB_TRIGGER}>
              Đội xử lý
            </TabsTrigger>
            <TabsTrigger value="members" className={TAB_TRIGGER}>
              Thành viên
            </TabsTrigger>
          </TabsList>

          {activeTab === 'teams' && (
            <>
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
            </>
          )}
        </div>

        <TabsContent
          value="reports"
          className="mt-4 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden sm:mt-5"
        >
          <AssignReportsTab
            status="Dispatched"
            Dialog={LeoAssignDialog}
            actionLabel="Phân công đội"
          />
        </TabsContent>
        <TabsContent value="teams" className="mt-4 sm:mt-5">
          <TeamTab viewMode={viewMode} />
        </TabsContent>
        <TabsContent value="members" className="mt-4 sm:mt-5">
          <MembersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
