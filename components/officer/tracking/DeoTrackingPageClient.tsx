'use client';

// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { PaginationSimple } from '@/components/ui/pagination';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
// import { useDeoMyReports } from '@/hooks/useDeoOffices';
// import type { DeoMyReportItem } from '@/lib/api/models/department';
// import type { ReportSeverity } from '@/lib/api/models/report';
import { cn } from '@/lib/utils';
// import { ArrowUpDown, LayoutGrid, List, Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// const DEO_PAGE_SIZE = 12;

// const SEVERITY_LABEL: Record<ReportSeverity, string> = {
//   Critical: 'Nghiêm trọng',
//   High: 'Cao',
//   Medium: 'Trung bình',
//   Low: 'Thấp',
// };

// const SEVERITY_CLASS: Record<ReportSeverity, string> = {
//   Critical: 'text-red-600 font-semibold',
//   High: 'text-orange-600 font-semibold',
//   Medium: 'text-amber-600 font-medium',
//   Low: 'text-muted-foreground',
// };

/** Trạng thái hiển thị màn DEO theo dõi: Dispatched + report.ts (9–16). */
export const DEO_TRACKING_STATUSES = [
  'Dispatched',
  'Assigned',
  'InProgress',
  'Resolved',
  'Closed',
  'Rejected',
  'Duplicate',
  'PenaltyIssued',
  'ClosedNoViolation',
] as const;

// const DEO_TRACKING_STATUS_SET = new Set<string>(DEO_TRACKING_STATUSES);

export type DeoTrackingStatus = (typeof DEO_TRACKING_STATUSES)[number];
type DeoStatusTab = 'All' | DeoTrackingStatus;
type DeoViewMode = 'list' | 'board';
type DeoSortBy = 'createdAt' | 'dispatchedAt' | 'severity' | 'slaResolveDueAt';

export const DEO_STATUS_LABEL: Record<DeoTrackingStatus, string> = {
  Dispatched: 'Đã điều phối',
  Assigned: 'Đã phân công',
  InProgress: 'Đang xử lý',
  Resolved: 'Đã giải quyết',
  Closed: 'Đã đóng',
  Rejected: 'Từ chối',
  Duplicate: 'Trùng lặp',
  PenaltyIssued: 'Đã xử phạt',
  ClosedNoViolation: 'Đóng không vi phạm',
};

export const DEO_SORT_BY_OPTIONS: Array<{ value: DeoSortBy; label: string }> = [
  { value: 'dispatchedAt', label: 'Điều phối' },
  { value: 'createdAt', label: 'Ngày tạo' },
  { value: 'severity', label: 'Mức độ' },
  { value: 'slaResolveDueAt', label: 'Hạn hoàn thành' },
];

export const DEO_VIEW_TOGGLE_CLASS = (active: boolean) =>
  cn(
    'flex size-8 items-center justify-center rounded-lg transition-all',
    active ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
  );

// const EMPTY_DEO_ITEMS: DeoMyReportItem[] = [];

// const DEO_REPORT_ITEM_FOCUS =
//   'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2';

// function filterDeoTrackingItems(items: DeoMyReportItem[]): DeoMyReportItem[] {
//   return items.filter(item => DEO_TRACKING_STATUS_SET.has(item.status));
// }

// function formatReportDateTime(iso: string | undefined): string {
//   if (!iso) return '—';
//   return new Date(iso).toLocaleString('vi-VN', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//   });
// }

// function getReporterInitials(name: string): string {
//   const parts = name.trim().split(/\s+/).filter(Boolean);
//   if (parts.length === 0) return '?';
//   if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
//   return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
// }

// function formatSlaResolve(iso: string | undefined): {
//   text: string;
//   tone: 'safe' | 'warn' | 'danger' | 'idle';
// } {
//   if (!iso) return { text: 'Chưa đặt SLA', tone: 'idle' };
//   const due = new Date(iso).getTime();
//   const now = Date.now();
//   const diffMs = due - now;
//   const DAY = 24 * 3_600_000;

//   if (diffMs < 0) {
//     const overdueDays = Math.floor(-diffMs / DAY);
//     if (overdueDays >= 1) return { text: `Quá hạn ${overdueDays} ngày`, tone: 'danger' };
//     const overdueHours = Math.max(1, Math.floor(-diffMs / 3_600_000));
//     return { text: `Quá hạn ${overdueHours}h`, tone: 'danger' };
//   }

//   const remainingDays = Math.ceil(diffMs / DAY);
//   if (remainingDays >= 1) {
//     return {
//       text: `Còn ${remainingDays} ngày`,
//       tone: remainingDays <= 2 ? 'warn' : 'safe',
//     };
//   }
//   const remainingHours = Math.max(1, Math.ceil(diffMs / 3_600_000));
//   return { text: `Còn ${remainingHours}h`, tone: 'warn' };
// }

// function getSlaToneClass(tone: ReturnType<typeof formatSlaResolve>['tone']): string {
//   if (tone === 'danger') return 'text-red-600';
//   if (tone === 'warn') return 'text-amber-600';
//   if (tone === 'safe') return 'text-emerald-600';
//   return 'text-muted-foreground';
// }

// function SeverityPriorityBadge({ severity }: { severity: ReportSeverity }) {
//   return (
//     <span className={cn('inline-flex items-center gap-1 text-xs', SEVERITY_CLASS[severity])}>
//       <span className="text-muted-foreground">Mức độ:</span>
//       <span className="font-semibold">{SEVERITY_LABEL[severity]}</span>
//     </span>
//   );
// }

// function DeoCardDetailRow({
//   label,
//   value,
//   valueClassName,
// }: {
//   label: string;
//   value: string;
//   valueClassName?: string;
// }) {
//   return (
//     <div className="flex items-start justify-between gap-3 text-sm">
//       <span className="shrink-0 text-muted-foreground">{label}</span>
//       <span className={cn('min-w-0 text-right font-medium text-foreground', valueClassName)}>
//         {value}
//       </span>
//     </div>
//   );
// }

//   function DeoReporterAvatar({ reporterName }: { reporterName: string }) {
//     return (
//     <span className="group/avatar relative inline-flex shrink-0">
//       <div
//         className="flex size-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700"
//         aria-label={`Báo cáo bởi người dân ${reporterName || 'chưa rõ'}`}
//       >
//         {getReporterInitials(reporterName)}
//       </div>
//       <span
//         role="tooltip"
//         className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden w-max max-w-xs rounded-md bg-foreground px-2.5 py-1.5 text-xs text-balance text-background shadow-md group-hover/avatar:block"
//       >
//         Báo cáo bởi người dân {reporterName || '—'}
//       </span>
//     </span>
//   );
// }

// function DeoReportDetails({
//   item,
//   sla,
// }: {
//   item: undefined | ReportQueueItem as ReportQueueItem;
//   sla: ReturnType<typeof formatSlaResolve>;
// }) {
//   const slaToneClass = getSlaToneClass(sla.tone);
//   return (
//     <>
//       <DeoCardDetailRow label="Đơn vị xử lý" value={item.assignedOfficeName || 'Chưa điều phối'} />
//       <DeoCardDetailRow label="Điều phối" value={formatReportDateTime(item.dispatchedAt)} />
//       <DeoCardDetailRow
//         label="Hạn hoàn thành"
//         value={sla.text}
//         valueClassName={cn('tabular-nums', slaToneClass)}
//       />
//     </>
//   );
// }

// function DeoReportCard({ item, onClick }: { item: DeoMyReportItem; onClick: () => void }) {
//   const sla = formatSlaResolve(item.slaResolveDueAt);

//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={cn(
//         'group flex h-full w-full flex-col rounded-xl border border-border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md',
//         DEO_REPORT_ITEM_FOCUS
//       )}
//     >
//       <div className="flex items-start justify-between gap-3">
//         <div className="min-w-0 flex-1">
//           <SeverityPriorityBadge severity={item.severity} />
//           <p className="line-clamp-2 text-base font-bold leading-snug text-foreground">
//             {item.address || '—'}
//           </p>
//           <p className="mt-1.5 text-sm text-muted-foreground">
//             loại <span className="font-bold text-gray-500">{item.categoryName}</span>
//           </p>
//         </div>
//         <DeoReporterAvatar reporterName={item.reporterName} />
//       </div>
//       <div className="mt-4 space-y-2.5">
//         <DeoReportDetails item={item} sla={sla} />
//       </div>
//     </button>
//   );
// }

// function DeoReportListRow({ item, onClick }: { item: DeoMyReportItem; onClick: () => void }) {
//   const sla = formatSlaResolve(item.slaResolveDueAt);

//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={cn(
//         'group flex w-full flex-col gap-4 rounded-xl border border-border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-start',
//         DEO_REPORT_ITEM_FOCUS
//       )}
//     >
//       <div className="flex min-w-0 flex-1 items-start justify-between gap-3 sm:max-w-md">
//         <div className="min-w-0 flex-1">
//           <SeverityPriorityBadge severity={item.severity} />
//           <p className="line-clamp-2 text-base font-bold leading-snug text-foreground">
//             {item.address || '—'}
//           </p>
//           <p className="mt-1.5 text-xs text-muted-foreground">
//             Trong <span className="font-semibold text-gray-700">{item.categoryName}</span>
//           </p>
//         </div>
//         <DeoReporterAvatar reporterName={item.reporterName} />
//       </div>
//       <div className="min-w-0 flex-1 space-y-2.5 sm:border-l sm:border-border sm:pl-4">
//         <DeoReportDetails item={item} sla={sla} />
//       </div>
//     </button>
//   );
// }

export function SkeletonDeoCards() {
  return (
    <>
      {['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map(k => (
        <div key={k} className="h-56 animate-pulse rounded-2xl border border-border bg-muted/30" />
      ))}
    </>
  );
}

export function SkeletonDeoList() {
  return (
    <>
      {['r1', 'r2', 'r3', 'r4', 'r5'].map(k => (
        <div key={k} className="h-28 animate-pulse rounded-xl border border-border bg-muted/30" />
      ))}
    </>
  );
}

export function DeoStatusTabBar({
  tabs,
  activeKey,
  onChange,
  viewMode,
  onViewModeChange,
}: {
  tabs: Array<{ key: DeoStatusTab; label: string; count: number }>;
  activeKey: DeoStatusTab;
  onChange: (key: DeoStatusTab) => void;
  viewMode: DeoViewMode;
  onViewModeChange: (mode: DeoViewMode) => void;
}) {
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<DeoStatusTab, HTMLButtonElement>());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const syncIndicator = useCallback(() => {
    const scroll = tabsScrollRef.current;
    const active = tabRefs.current.get(activeKey);
    if (!scroll || !active) {
      setIndicator({ left: 0, width: 0 });
      return;
    }
    const scrollRect = scroll.getBoundingClientRect();
    const tabRect = active.getBoundingClientRect();
    setIndicator({
      left: tabRect.left - scrollRect.left + scroll.scrollLeft,
      width: tabRect.width,
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    syncIndicator();
  }, [syncIndicator, tabs]);

  useEffect(() => {
    const scroll = tabsScrollRef.current;
    if (!scroll) return undefined;

    const observer = new ResizeObserver(() => syncIndicator());
    observer.observe(scroll);
    scroll.addEventListener('scroll', syncIndicator, { passive: true });
    window.addEventListener('resize', syncIndicator);

    return () => {
      observer.disconnect();
      scroll.removeEventListener('scroll', syncIndicator);
      window.removeEventListener('resize', syncIndicator);
    };
  }, [syncIndicator]);

  return (
    <div className="relative flex shrink-0 items-end gap-2">
      <div
        ref={tabsScrollRef}
        className="relative min-w-0 flex-1 overflow-x-auto border-b border-border pb-2 scrollbar-hide"
        role="tablist"
        aria-label="Lọc báo cáo theo trạng thái"
      >
        <div className="inline-flex items-stretch">
          {tabs.map(tab => {
            const isActive = tab.key === activeKey;
            return (
              <button
                key={tab.key}
                ref={node => {
                  if (node) tabRefs.current.set(tab.key, node);
                  else tabRefs.current.delete(tab.key);
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors first:pl-0',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span className="rounded-sm bg-white px-1.5 py-0.5 text-xs font-bold tabular-nums text-muted-foreground shadow-sm">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        {indicator.width > 0 ? (
          <span
            className="pointer-events-none absolute bottom-0 z-10 h-0.5 bg-emerald-600 transition-[left,width] duration-200 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1 self-stretch border-b border-border pb-2">
        <button
          type="button"
          title="Danh sách"
          aria-pressed={viewMode === 'list'}
          onClick={() => onViewModeChange('list')}
          className={DEO_VIEW_TOGGLE_CLASS(viewMode === 'list')}
        >
          {/* <List className="size-4" /> */}
        </button>
        <button
          type="button"
          title="Board"
          aria-pressed={viewMode === 'board'}
          onClick={() => onViewModeChange('board')}
          className={DEO_VIEW_TOGGLE_CLASS(viewMode === 'board')}
        >
          {/* <LayoutGrid className="size-4" /> */}
        </button>
      </div>
    </div>
  );
}

// interface DeoTrackingPageClientProps {
//     onOpenDetail: (id: string) => void;
//   }

//  function DeoTrackingPageClient({ onOpenDetail }: DeoTrackingPageClientProps) {
//   const [page, setPage] = useState(1);
//   const [statusTab, setStatusTab] = useState<DeoStatusTab>('All');
//   const [search, setSearch] = useState('');
//   const [severityFilter, setSeverityFilter] = useState<'all' | ReportSeverity>('all');
//   const [sortBy, setSortBy] = useState<DeoSortBy>('dispatchedAt');
//   const [sortDesc, setSortDesc] = useState(true);
//   const [viewMode, setViewMode] = useState<DeoViewMode>('board');

//   const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
//   const isSearchPending = search.trim() !== debouncedSearch;

//   const handleStatusTabChange = (tab: DeoStatusTab) => {
//     setStatusTab(tab);
//     setPage(1);
//   };
//   const handleSearchChange = (value: string) => {
//     setSearch(value);
//     setPage(1);
//   };
//   const handleSeverityChange = (value: 'all' | ReportSeverity) => {
//     setSeverityFilter(value);
//     setPage(1);
//   };
//   const handleSortByChange = (value: DeoSortBy) => {
//     setSortBy(value);
//     setPage(1);
//   };
//   const handleSortDescChange = (value: boolean) => {
//     setSortDesc(value);
//     setPage(1);
//   };

//   // const { data, isLoading, isError } = useDeoMyReports({
//   //   page,
//   //   pageSize: DEO_PAGE_SIZE,
//   //   search: debouncedSearch || undefined,
//   //   status: statusTab === 'All' ? undefined : statusTab,
//   //   severity: severityFilter === 'all' ? undefined : severityFilter,
//   //   sortBy,
//   //   sortDesc,
//   // });

//   // const items = useMemo(
//   //   () => filterDeoTrackingItems(data?.items ?? EMPTY_DEO_ITEMS),
//   //   [data?.items]
//   // );

//   // const statusCounts = useMemo(() => {
//   //   const totals = data?.pagination.totalItems ?? items.length;
//   //   const counts = { All: totals } as Record<DeoStatusTab, number>;
//   //   for (const s of DEO_TRACKING_STATUSES) counts[s] = 0;

//   //   if (statusTab === 'All') {
//   //     counts.All = items.length;
//   //     for (const item of items) {
//   //       counts[item.status as DeoTrackingStatus] += 1;
//   //     }
//   //     return counts;
//   //   }

//   //   counts[statusTab] = totals;
//   //   return counts;
//   // }, [data?.pagination.totalItems, items, statusTab]);

//   // const tabConfigs: Array<{ key: DeoStatusTab; label: string; count: number }> = useMemo(
//   //   () => [
//   //     { key: 'All', label: 'Tất cả', count: statusCounts.All },
//   //     ...DEO_TRACKING_STATUSES.map(s => ({
//   //       key: s,
//   //       label: DEO_STATUS_LABEL[s],
//   //       count: statusCounts[s],
//   //     })),
//   //   ],
//   //   [statusCounts]
//   // );

//   // const totalCount = data?.pagination.totalItems ?? items.length;
//   // const totalPages = Math.max(
//   //   1,
//   //   data?.pagination.totalPages ?? Math.ceil((totalCount || 1) / DEO_PAGE_SIZE)
//   // );

//   return (
//     <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
//       <div className="shrink-0">
//         <h1 className="text-2xl font-bold tracking-tight text-foreground">Báo cáo điều phối</h1>
//         <p className="mt-1 text-sm text-muted-foreground">
//           Giám sát báo cáo đã điều phối trong phạm vi sở TNMT
//         </p>
//       </div>

//       <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
//         <DeoStatusTabBar
//           // tabs={tabConfigs}
//           activeKey={statusTab}
//           onChange={handleStatusTabChange}
//           viewMode={viewMode}
//           onViewModeChange={setViewMode}
//         />

//         <div className="flex shrink-0 flex-wrap items-center gap-2 border-b py-3 sm:gap-3">
//           <div className="relative w-full shrink-0 sm:w-1/2 lg:w-2/5 xl:w-1/3">
//             <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
//             <Input
//               value={search}
//               onChange={e => handleSearchChange(e.target.value)}
//               placeholder="Tìm mã báo cáo, địa chỉ..."
//               className={`h-8 w-full rounded-lg pl-8 text-xs ${isSearchPending ? 'pr-8' : ''}`}
//               aria-busy={isSearchPending}
//             />
//             {isSearchPending ? (
//               <Loader2
//                 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground"
//                 aria-hidden
//               />
//             ) : null}
//           </div>

//           <Select
//             value={severityFilter}
//             onValueChange={value => handleSeverityChange(value as 'all' | ReportSeverity)}
//           >
//             <SelectTrigger className="h-9 w-full min-w-0 rounded-lg text-sm sm:w-auto">
//               <SelectValue placeholder="Mức độ" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">Mức độ</SelectItem>
//               <SelectItem value="Critical">Nghiêm trọng</SelectItem>
//               <SelectItem value="High">Cao</SelectItem>
//               <SelectItem value="Medium">Trung bình</SelectItem>
//               <SelectItem value="Low">Thấp</SelectItem>
//             </SelectContent>
//           </Select>

//           <Select value={sortBy} onValueChange={value => handleSortByChange(value as DeoSortBy)}>
//             <SelectTrigger className="h-9 w-full min-w-0 rounded-lg text-sm sm:w-auto">
//               <SelectValue placeholder="Sắp xếp theo" />
//             </SelectTrigger>
//             <SelectContent>
//               {DEO_SORT_BY_OPTIONS.map(option => (
//                 <SelectItem key={option.value} value={option.value}>
//                   {option.label}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>

//           <Button
//             variant="outline"
//             size="sm"
//             className="h-9 rounded-lg text-sm"
//             onClick={() => handleSortDescChange(!sortDesc)}
//           >
//             <ArrowUpDown className="mr-1.5 size-4" />
//             {sortDesc ? 'Giảm dần' : 'Tăng dần'}
//           </Button>
//         </div>

//         {/* <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
//           {isError ? (
//             <div className="flex h-full items-center justify-center text-destructive">
//               Không thể tải dữ liệu. Vui lòng thử lại.
//             </div>
//           ) : viewMode === 'board' ? (
//             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//               {isLoading ? (
//                 <SkeletonDeoCards />
//               ) : items.length === 0 ? (
//                 <div className="col-span-full flex items-center justify-center py-12 text-sm text-muted-foreground">
//                   Không có báo cáo phù hợp.
//                 </div>
//               ) : (
//                 items.map(item => (
//                   <DeoReportCard key={item.id} item={item} onClick={() => onOpenDetail(item.id)} />
//                 ))
//               )}
//             </div>
//           ) : (
//             <div className="flex flex-col gap-3">
//               {isLoading ? (
//                 <SkeletonDeoList />
//               ) : items.length === 0 ? (
//                 <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
//                   Không có báo cáo phù hợp.
//                 </div>
//               ) : (
//                 items.map(item => (
//                   <DeoReportListRow
//                     key={item.id}
//                     item={item}
//                     onClick={() => onOpenDetail(item.id)}
//                   />
//                 ))
//               )}
//             </div>
//           )}
//         </div> */}

//         {/* <div className="mt-auto flex shrink-0 flex-wrap items-center justify-end gap-3 p-3 sm:p-4">
//           <PaginationSimple
//             page={page}
//             totalPages={totalPages}
//             onPageChange={setPage}
//             className="w-auto"
//           />
//         </div> */}
//       </div>
//     </div>
//   );
// }
