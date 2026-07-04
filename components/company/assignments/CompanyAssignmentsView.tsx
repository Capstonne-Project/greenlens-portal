'use client';

import { CompanyAssignmentDetailTab } from '@/components/company/assignments/CompanyAssignmentDetailTab';
import { CompanyAssignmentsTrackingTab } from '@/components/company/assignments/CompanyAssignmentsTrackingTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, FileSearch } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

type TabValue = 'tracking' | 'detail';

export function CompanyAssignmentsView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get('tab') as TabValue) || 'tracking';
  const reportId = searchParams.get('reportId');

  const setTab = useCallback(
    (tab: TabValue, nextReportId?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      if (nextReportId) {
        params.set('reportId', nextReportId);
      } else if (tab === 'tracking') {
        params.delete('reportId');
      }
      router.replace(`/company/assignments?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleSelectReport = useCallback((id: string) => setTab('detail', id), [setTab]);

  const tabValue = useMemo(() => {
    if (activeTab === 'detail' && reportId) return 'detail';
    return 'tracking';
  }, [activeTab, reportId]);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700/70">
          Vận hành
        </p>
        <h1 className="text-xl font-bold tracking-tight text-emerald-950 dark:text-foreground">
          Theo dõi phân công
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Giám sát tiến độ task đã phân công cho các đội dọn dẹp của công ty.
        </p>
      </header>

      <Tabs
        value={tabValue}
        onValueChange={value => {
          if (value === 'tracking') setTab('tracking');
          else if (value === 'detail' && reportId) setTab('detail', reportId);
        }}
      >
        <TabsList className="h-auto gap-1 rounded-lg border border-emerald-100 bg-white p-1 shadow-sm dark:border-border dark:bg-card">
          <TabsTrigger
            value="tracking"
            className="gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <BarChart3 className="size-4" aria-hidden />
            Theo dõi
          </TabsTrigger>
          <TabsTrigger
            value="detail"
            disabled={!reportId}
            className="gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white disabled:opacity-40"
          >
            <FileSearch className="size-4" aria-hidden />
            Chi tiết
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="mt-5">
          <CompanyAssignmentsTrackingTab onSelectReport={handleSelectReport} />
        </TabsContent>

        <TabsContent value="detail" className="mt-5">
          {reportId ? (
            <CompanyAssignmentDetailTab reportId={reportId} onBack={() => setTab('tracking')} />
          ) : (
            <p className="rounded-lg border border-dashed border-emerald-200 bg-white/80 px-6 py-12 text-center text-sm text-muted-foreground">
              Chọn một báo cáo từ tab Theo dõi để xem chi tiết.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
