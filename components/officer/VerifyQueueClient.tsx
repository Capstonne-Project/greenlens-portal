'use client';

import { useReportQueue } from '@/hooks/useOfficer';
import type { ReportQueueItem, ReportSeverity, ReportStatus } from '@/lib/api/services/fetchReport';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Grid2x2, List, Search, SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const QUEUE_TYPE_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Mới nhận', value: 'new' },
  { label: 'Sắp quá SLA', value: 'near-sla' },
  { label: 'Đã quá SLA', value: 'over-sla' },
  { label: 'Nghi ngờ trùng', value: 'duplicate' },
  { label: 'Khả nghi', value: 'suspicious' },
  { label: 'Ẩn danh', value: 'anonymous' },
];

const TIME_TABS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hôm nay', value: 'today' },
  { label: 'Tuần này', value: 'week' },
  { label: 'Tháng này', value: 'month' },
];

const TABLE_COLS = ['LOẠI', 'VỊ TRÍ', 'MỨC ĐỘ', 'HẠN XỬ LÝ', 'TRẠNG THÁI'];

const SEVERITY_OPTIONS: Array<{ label: string; value: ReportSeverity | 'all' }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Nghiêm trọng', value: 'Critical' },
  { label: 'Cao', value: 'High' },
  { label: 'Trung bình', value: 'Medium' },
  { label: 'Thấp', value: 'Low' },
];

const SEVERITY_LABEL: Record<ReportSeverity, string> = {
  Critical: 'Nghiêm trọng',
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp',
};

const SEVERITY_VARIANT: Record<ReportSeverity, 'destructive' | 'secondary' | 'outline'> = {
  Critical: 'destructive',
  High: 'destructive',
  Medium: 'secondary',
  Low: 'outline',
};

const SEVERITY_CLASS: Record<ReportSeverity, string> = {
  Critical: 'bg-red-50 text-red-600 ring-1 ring-red-200',
  High: 'bg-orange-50 text-orange-600 ring-1 ring-orange-200',
  Medium: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
  Low: 'bg-gray-100 text-gray-500',
};

const STATUS_CLASS: Record<ReportStatus, string> = {
  Submitted: 'bg-blue-50 text-blue-600',
  Verified: 'bg-emerald-50 text-emerald-600',
  Dispatched: 'bg-teal-50 text-teal-600',
  Assigned: 'bg-sky-50 text-sky-600',
  InProgress: 'bg-purple-50 text-purple-600',
  Resolved: 'bg-green-50 text-green-600',
  Rejected: 'bg-red-50 text-red-600',
  Duplicate: 'bg-gray-100 text-gray-500',
  Closed: 'bg-gray-100 text-gray-500',
  PenaltyIssued: 'bg-orange-50 text-orange-600',
  ClosedNoViolation: 'bg-slate-100 text-slate-500',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSla(isoString: string): { text: string; overdue: boolean } {
  const due = new Date(isoString);
  const now = new Date();
  if (due < now) {
    const diffH = Math.floor((now.getTime() - due.getTime()) / 3600000);
    return { text: `Quá hạn ${diffH}h`, overdue: true };
  }
  const diffH = Math.floor((due.getTime() - now.getTime()) / 3600000);
  const diffM = Math.floor(((due.getTime() - now.getTime()) % 3600000) / 60000);
  return {
    text: `${String(diffH).padStart(2, '0')}:${String(diffM).padStart(2, '0')}`,
    overdue: false,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: ReportSeverity }) {
  return (
    <Badge
      variant={SEVERITY_VARIANT[severity]}
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEVERITY_CLASS[severity]}`}
    >
      {SEVERITY_LABEL[severity]}
    </Badge>
  );
}

function StatusPill({ status }: { status: ReportStatus }) {
  return (
    <Badge
      variant="secondary"
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CLASS[status]}`}
    >
      {status}
    </Badge>
  );
}

function SkeletonRows() {
  return (
    <>
      {['s1', 's2', 's3', 's4', 's5'].map(key => (
        <tr key={key} className="animate-pulse">
          {['c1', 'c2', 'c3', 'c4', 'c5'].map(ck => (
            <td key={ck} className="px-5 py-4">
              <div className="h-3 w-20 rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Queue row ─────────────────────────────────────────────────────────────────

function QueueRow({
  item,
  isSelected,
  onClick,
}: {
  item: ReportQueueItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const sla = formatSla(item.slaVerifyDueAt);

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors ${
        isSelected ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-200' : 'hover:bg-muted/40'
      }`}
    >
      <td className="px-5 py-4 text-xs text-foreground">{item.categoryName}</td>
      <td className="max-w-50 truncate px-5 py-4 text-xs text-muted-foreground">{item.address}</td>
      <td className="px-5 py-4">
        <SeverityBadge severity={item.severity} />
      </td>
      <td
        className={`px-5 py-4 font-mono text-xs font-medium ${sla.overdue ? 'text-red-500' : 'text-foreground'}`}
      >
        {sla.text}
      </td>
      <td className="px-5 py-4">
        <StatusPill status={item.status} />
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function VerifyQueueClient() {
  const router = useRouter();
  const [activePage] = useState(1);
  const pageSize = 20;
  const [severityFilter, setSeverityFilter] = useState<ReportSeverity | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [queueTypeFilter, setQueueTypeFilter] = useState('all');

  const { data: queueData, isLoading, isError } = useReportQueue({ page: activePage, pageSize });

  const categoryOptions = useMemo(() => {
    const names = [...new Set((queueData?.items ?? []).map(i => i.categoryName))];
    return [{ label: 'Tất cả loại', value: 'all' }, ...names.map(n => ({ label: n, value: n }))];
  }, [queueData?.items]);

  const filteredItems = useMemo(() => {
    return (queueData?.items ?? []).filter(item => {
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && item.categoryName !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!item.code.toLowerCase().includes(q) && !item.address.toLowerCase().includes(q))
          return false;
      }
      if (timeFilter !== 'all') {
        const created = new Date(item.createdAt);
        const now = new Date();
        if (timeFilter === 'today' && created.toDateString() !== now.toDateString()) return false;
        if (timeFilter === 'week' && created < new Date(now.getTime() - 7 * 86400000)) return false;
        if (
          timeFilter === 'month' &&
          (created.getMonth() !== now.getMonth() || created.getFullYear() !== now.getFullYear())
        )
          return false;
      }
      return true;
    });
  }, [queueData?.items, severityFilter, categoryFilter, searchQuery, timeFilter]);

  return (
    <div className="space-y-4">
      {/* Toolbar card */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {/* Row 1: type filter + search */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Queue type dropdown */}
          <Select value={queueTypeFilter} onValueChange={setQueueTypeFilter}>
            <SelectTrigger className="w-44 text-xs">
              <SelectValue placeholder="Loại hàng đợi" />
            </SelectTrigger>
            <SelectContent>
              {QUEUE_TYPE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bộ lọc toggle */}
          <Button
            variant={filterPanelOpen ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setFilterPanelOpen(v => !v)}
            className={filterPanelOpen ? 'border-primary/30 text-primary' : ''}
          >
            <SlidersHorizontal className="mr-1.5 size-4" />
            Bộ lọc
          </Button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative flex w-72 items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mã báo cáo, địa chỉ..."
              className="pl-9 text-sm"
            />
          </div>

          {/* View toggle */}
          <div className="flex overflow-hidden rounded-lg border border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={`rounded-none ${viewMode === 'grid' ? 'bg-foreground text-background hover:bg-foreground/90' : 'hover:bg-muted'}`}
              aria-label="Dạng lưới"
            >
              <Grid2x2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')}
              className={`rounded-none border-l border-border ${viewMode === 'list' ? 'bg-foreground text-background hover:bg-foreground/90' : 'hover:bg-muted'}`}
              aria-label="Dạng danh sách"
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>

        {/* Collapsible filter panel */}
        {filterPanelOpen && (
          <div className="border-t border-border px-4 py-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Category filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Loại ô nhiễm
                </span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Tất cả loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Severity filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Mức độ nghiêm trọng
                </span>
                <Select
                  value={severityFilter}
                  onValueChange={v => setSeverityFilter(v as ReportSeverity | 'all')}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Tất cả mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Row 2: time filter — visible only in list mode */}
        <AnimatePresence initial={false}>
          {viewMode === 'list' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
                <span className="shrink-0 text-sm text-muted-foreground">Lọc theo thời gian:</span>
                {TIME_TABS.map(tab => (
                  <Button
                    key={tab.value}
                    variant={timeFilter === tab.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeFilter(tab.value)}
                    className="rounded-full px-3.5"
                  >
                    {tab.label}
                  </Button>
                ))}
                <div className="ml-2 flex items-center gap-2">
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-2.5 size-3.5 text-muted-foreground" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="rounded-lg border border-border bg-background py-1.5 pl-8 pr-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <span className="text-muted-foreground">-</span>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-2.5 size-3.5 text-muted-foreground" />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="rounded-lg border border-border bg-background py-1.5 pl-8 pr-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (dateFrom || dateTo) setTimeFilter('custom');
                    }}
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">Danh sách cần xác minh</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-border">
                {TABLE_COLS.map(h => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left font-medium tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && <SkeletonRows />}
              {isError && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-destructive">
                    Không thể tải dữ liệu. Vui lòng thử lại.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Không có báo cáo nào phù hợp.
                  </td>
                </tr>
              )}
              {!isLoading &&
                !isError &&
                filteredItems.map(item => (
                  <QueueRow
                    key={item.id}
                    item={item}
                    isSelected={false}
                    onClick={() => router.push(`/officer/verify/${item.id}`)}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
