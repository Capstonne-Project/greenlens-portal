'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAssignReport, useReportQueue } from '@/hooks/useOfficer';
import type { ReportSeverity, ReportStatus } from '@/lib/api/services/fetchReport';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { MoreHorizontal, UserPlus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { AssignTeamDialog } from './AssignTeamDialog';
import { TabToolbar } from './TabToolbar';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLOWED_STATUSES = new Set<ReportStatus>([
  'Verified',
  'Dispatched',
  'Assigned',
  'InProgress',
  'PenaltyIssued',
]);

const SEVERITY_CLASS: Record<ReportSeverity, string> = {
  Critical: 'bg-red-50 text-red-600 ring-1 ring-red-200',
  High: 'bg-orange-50 text-orange-600 ring-1 ring-orange-200',
  Medium: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
  Low: 'bg-gray-100 text-gray-500',
};

const SEVERITY_LABEL: Record<ReportSeverity, string> = {
  Critical: 'Nghiêm trọng',
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {['s1', 's2', 's3', 's4', 's5'].map(key => (
        <TableRow key={key} className="animate-pulse">
          <TableCell className="px-5">
            <div className="size-4 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-28 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-24 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-5 w-20 rounded-full bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-40 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-5 w-20 rounded-full bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-20 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5" />
        </TableRow>
      ))}
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReportTab() {
  const [page] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const searchParams = useSearchParams();
  const highlightReportId = searchParams.get('highlightReportId');
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const [highlightFading, setHighlightFading] = useState(false);
  const consumedHighlightRef = useRef<string | null>(null);

  const { data, isLoading, isError, refetch } = useReportQueue({ page, pageSize: 50 });

  const triggerHighlight = (el: HTMLTableRowElement, reportId: string) => {
    if (consumedHighlightRef.current === reportId) return;
    consumedHighlightRef.current = reportId;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightFading(true), 3000);
  };

  // ── Assign dialog ─────────────────────────────────────────────────────────
  const [assignOpen, setAssignOpen] = useState(false);
  const assignMutation = useAssignReport();

  const handleAssignSubmit = async (teamIds: string[], note: string) => {
    const body = {
      teams: teamIds.map(teamId => ({ teamId, ...(note ? { note } : {}) })),
    };
    const reportIds = [...selected];
    await Promise.all(reportIds.map(reportId => assignMutation.mutateAsync({ reportId, body })));
    setAssignOpen(false);
    setSelected(new Set());
  };

  const filtered = useMemo(() => {
    return (data?.items ?? [])
      .filter(r => ALLOWED_STATUSES.has(r.status))
      .filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return r.code.toLowerCase().includes(q) || r.address.toLowerCase().includes(q);
      });
  }, [data?.items, search]);

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const indeterminate = selected.size > 0 && selected.size < filtered.length;

  const toggleAll = () => {
    if (allChecked || indeterminate) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().finally(() => setIsRefreshing(false));
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <TabToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm mã báo cáo, địa chỉ..."
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        filterOpen={filterOpen}
        onFilterToggle={() => setFilterOpen(v => !v)}
        actionSlot={
          <Button size="sm" disabled={selected.size === 0} onClick={() => setAssignOpen(true)}>
            <UserPlus className="mr-1.5 size-4" />
            Phân công đội
            {selected.size > 0 && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs font-semibold">
                {selected.size}
              </span>
            )}
          </Button>
        }
      />

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12 px-5">
              <Checkbox
                checked={indeterminate ? 'indeterminate' : allChecked}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Mã báo cáo
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Loại ô nhiễm
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Mức độ
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Địa chỉ
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Trạng thái
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Thời gian tạo
            </TableHead>
            <TableHead className="w-12 px-5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <SkeletonRows />}
          {isError && (
            <TableRow>
              <TableCell colSpan={8} className="px-5 py-10 text-center text-destructive">
                Không thể tải dữ liệu. Vui lòng thử lại.
              </TableCell>
            </TableRow>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                Không có báo cáo nào phù hợp.
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            !isError &&
            filtered.map(report => {
              const isHighlighted = report.id === highlightReportId && !highlightFading;
              let rowTone = '';
              if (isHighlighted) {
                rowTone = 'bg-emerald-50 hover:bg-emerald-50';
              } else if (selected.has(report.id)) {
                rowTone = 'bg-primary/5 hover:bg-primary/5';
              }
              return (
                <TableRow
                  key={report.id}
                  ref={el => {
                    if (el) {
                      rowRefs.current.set(report.id, el);
                      if (report.id === highlightReportId) triggerHighlight(el, report.id);
                    } else {
                      rowRefs.current.delete(report.id);
                    }
                  }}
                  onClick={() => toggleOne(report.id)}
                  className={`cursor-pointer transition-colors duration-700 ${rowTone}`}
                >
                  <TableCell className="px-5" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(report.id)}
                      onCheckedChange={() => toggleOne(report.id)}
                    />
                  </TableCell>
                  <TableCell className="px-5 font-medium">{report.code}</TableCell>
                  <TableCell className="px-5 text-muted-foreground">
                    {report.categoryName}
                  </TableCell>
                  <TableCell className="px-5">
                    <Badge
                      variant="secondary"
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEVERITY_CLASS[report.severity]}`}
                    >
                      {SEVERITY_LABEL[report.severity]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-55 truncate px-5 text-muted-foreground">
                    {report.address}
                  </TableCell>
                  <TableCell className="px-5">
                    <Badge
                      variant="secondary"
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${REPORT_STATUS_BADGE_CLASSES[report.status] ?? 'bg-gray-100 text-gray-500'}`}
                    >
                      {reportStatusLabelVi(report.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 text-muted-foreground">
                    {formatDate(report.createdAt)}
                  </TableCell>
                  <TableCell className="px-5" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                        <DropdownMenuItem>Phân công đội</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>

      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        {isLoading ? 'Đang tải...' : `${filtered.length} báo cáo`}
      </div>

      <AssignTeamDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        reportCount={selected.size}
        onSubmit={handleAssignSubmit}
        submitting={assignMutation.isPending}
      />
    </div>
  );
}
