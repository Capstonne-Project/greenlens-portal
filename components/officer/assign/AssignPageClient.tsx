'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { MembersTab } from './MembersTab';
import { ReportTab } from './ReportTab';
import { TeamTab } from './TeamTab';

type TabValue = 'reports' | 'teams' | 'members';

const TAB_TRIGGER =
  'relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-emerald-700 data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:shadow-none';

export function AssignPageClient() {
  const [activeTab, setActiveTab] = useState<TabValue>('reports');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý phân công</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Phân công báo cáo cho đội xử lý và quản lý thành viên đội
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabValue)}>
        <TabsList className="h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">
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

        <TabsContent value="reports" className="mt-5">
          <ReportTab />
        </TabsContent>
        <TabsContent value="teams" className="mt-5">
          <TeamTab />
        </TabsContent>
        <TabsContent value="members" className="mt-5">
          <MembersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
