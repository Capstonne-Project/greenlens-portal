'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Eye,
  Filter,
  FileText,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useInspectionOfficerQueue } from '@/hooks/useOfficer';
import { useTeamsList } from '@/hooks/useTeams';
import type { InspectionOfficerQueueItem } from '@/lib/api/models/inspectionReport';
import type { TeamListItem } from '@/lib/api/models/team';
import {
  INSPECTION_STATUSES,
  INSPECTION_STATUS_LABEL_VI,
  type InspectionStatus,
  inspectionShowsPenaltyFields,
  inspectionStatusBadgeClass,
  inspectionStatusLabelVi,
  resolveInspectionSubjectName,
} from '@/lib/constants/inspectionStatus';
import { cn } from '@/lib/utils';

const INSPECTIONS_PAGE_SIZE = 8;

/** Highlight hàng sau khi quay lại list — giữ ngắn rồi fade (khớp duration-700). */
const HIGHLIGHT_HOLD_MS = 1600;
const HIGHLIGHT_CLEAR_MS = 2300;

const INSPECTION_TEAM_FILTER_PARAMS = {
  page: 1,
  pageSize: 50,
  teamType: 'Inspection',
  isActive: true,
} as const;

const EMPTY_TEAMS: TeamListItem[] = [];

type ColumnKey = 'code' | 'address' | 'status' | 'team' | 'penalty' | 'sla' | 'created' | 'actions';

const FIRST_COL: ColumnKey = 'code';
const LAST_COL: ColumnKey = 'actions';

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y =
    layer === 'head' ? 'py-2.5 @[44rem]/insp-table:py-3.5' : 'py-2.5 @[44rem]/insp-table:py-4';
  if (colKey === FIRST_COL) {
    return cn('px-0', y, FIRST_COL_PAD_X);
  }
  if (colKey === LAST_COL) {
    return cn('px-0', y, 'ps-1.5 pe-4 @[44rem]/insp-table:ps-3 @[44rem]/insp-table:pe-6');
  }
  return cn(y, 'px-1.5 @[44rem]/insp-table:px-3 @[56rem]/insp-table:px-4');
}

/** Padding cột Hồ sơ — thumb thẳng hàng label header. */
const FIRST_COL_PAD_X = 'ps-4 pe-1.5 @[44rem]/insp-table:ps-6 @[44rem]/insp-table:pe-2';

const THUMB_SIZE = 'size-9 @[44rem]/insp-table:size-10';

const ROW_BORDER = 'border-b border-slate-200';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  {
    key: 'code',
    label: 'Hồ sơ / Báo cáo',
    className: 'w-[22%] min-w-0 @[44rem]/insp-table:w-[24%]',
  },
  {
    key: 'address',
    label: 'Địa chỉ / Đối tượng',
    className: 'w-[18%] min-w-0 max-w-0',
  },
  { key: 'team', label: 'Đội thanh tra', className: 'w-[12%] min-w-0 max-w-0' },
  { key: 'penalty', label: 'Tiền phạt', className: 'w-[11%] min-w-0' },
  { key: 'sla', label: 'Hạn xử lý', className: 'w-[10%] min-w-0' },
  { key: 'created', label: 'Ngày tạo', className: 'w-[10%] min-w-0' },
  { key: 'status', label: 'Trạng thái', className: 'w-[11%] min-w-0' },
  {
    key: 'actions',
    label: '',
    className: 'w-10 @[44rem]/insp-table:w-12',
  },
];

const BADGE_BASE =
  'inline-flex max-w-full min-w-0 items-center truncate rounded-full font-medium leading-none';
const BADGE_SIZE =
  'px-1.5 py-0.5 text-[10px] tracking-tight @[44rem]/insp-table:px-2 @[44rem]/insp-table:py-0.5 @[44rem]/insp-table:text-xs';

const CELL_META =
  'block min-w-0 truncate text-[10px] tabular-nums leading-snug @[44rem]/insp-table:text-xs';
const HEAD_LABEL =
  'block min-w-0 truncate text-[0.625rem] font-semibold uppercase tracking-wide text-slate-500 @[44rem]/insp-table:text-[0.6875rem]';

type DatePreset = 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisYear';
type StatusFilter = 'all' | InspectionStatus;

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'thisWeek', label: 'Tuần này' },
  { key: 'thisMonth', label: 'Tháng này' },
  { key: 'lastMonth', label: 'Tháng trước' },
  { key: 'thisYear', label: 'Năm nay' },
];

const DRAWER_TIME_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'thisWeek', label: 'Tuần này' },
  { key: 'thisMonth', label: 'Tháng này' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  ...INSPECTION_STATUSES.map(status => ({
    key: status as StatusFilter,
    label: INSPECTION_STATUS_LABEL_VI[status],
  })),
];

const VN_TZ_OFFSET = '+07:00';
const pad2 = (n: number) => String(n).padStart(2, '0');

function vnStartIso(y: number, m: number, d: number): string {
  return new Date(`${y}-${pad2(m)}-${pad2(d)}T00:00:00.000${VN_TZ_OFFSET}`).toISOString();
}

function vnEndIso(y: number, m: number, d: number): string {
  return new Date(`${y}-${pad2(m)}-${pad2(d)}T23:59:59.999${VN_TZ_OFFSET}`).toISOString();
}

function dateInputToVnStartIso(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return vnStartIso(y, m, d);
}

function dateInputToVnEndIso(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return vnEndIso(y, m, d);
}

function isCompleteDateInput(dateStr: string): boolean {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  return Boolean(y && m && d);
}

function getDateRange(
  preset: DatePreset,
  customFrom: string,
  customTo: string
): { fromDate?: string; toDate?: string } {
  const fromComplete = isCompleteDateInput(customFrom);
  const toComplete = isCompleteDateInput(customTo);

  if (fromComplete || toComplete) {
    return {
      ...(fromComplete ? { fromDate: dateInputToVnStartIso(customFrom) } : {}),
      ...(toComplete ? { toDate: dateInputToVnEndIso(customTo) } : {}),
    };
  }

  if (preset === 'all') return {};

  const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const y = vnNow.getUTCFullYear();
  const m = vnNow.getUTCMonth() + 1;
  const d = vnNow.getUTCDate();

  switch (preset) {
    case 'today':
      return { fromDate: vnStartIso(y, m, d), toDate: vnEndIso(y, m, d) };
    case 'thisWeek': {
      const mondayOffset = (vnNow.getUTCDay() + 6) % 7;
      const weekStart = new Date(Date.UTC(y, m - 1, d - mondayOffset));
      return {
        fromDate: vnStartIso(
          weekStart.getUTCFullYear(),
          weekStart.getUTCMonth() + 1,
          weekStart.getUTCDate()
        ),
        toDate: vnEndIso(y, m, d),
      };
    }
    case 'thisMonth':
      return { fromDate: vnStartIso(y, m, 1), toDate: vnEndIso(y, m, d) };
    case 'lastMonth': {
      const prev = new Date(Date.UTC(y, m - 2, 1));
      const py = prev.getUTCFullYear();
      const pm = prev.getUTCMonth() + 1;
      const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
      return { fromDate: vnStartIso(py, pm, 1), toDate: vnEndIso(py, pm, lastDay) };
    }
    case 'thisYear':
      return { fromDate: vnStartIso(y, 1, 1), toDate: vnEndIso(y, m, d) };
    default:
      return {};
  }
}

function toDateInput(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function getPresetDateInputs(preset: DatePreset): { from: string; to: string } {
  const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const y = vnNow.getUTCFullYear();
  const m = vnNow.getUTCMonth() + 1;
  const d = vnNow.getUTCDate();

  if (preset === 'all') {
    return { from: `${y}--`, to: `${y}--` };
  }

  switch (preset) {
    case 'today':
      return { from: toDateInput(y, m, d), to: toDateInput(y, m, d) };
    case 'thisWeek': {
      const mondayOffset = (vnNow.getUTCDay() + 6) % 7;
      const weekStart = new Date(Date.UTC(y, m - 1, d - mondayOffset));
      return {
        from: toDateInput(
          weekStart.getUTCFullYear(),
          weekStart.getUTCMonth() + 1,
          weekStart.getUTCDate()
        ),
        to: toDateInput(y, m, d),
      };
    }
    case 'thisMonth':
      return { from: toDateInput(y, m, 1), to: toDateInput(y, m, d) };
    case 'lastMonth': {
      const prev = new Date(Date.UTC(y, m - 2, 1));
      const py = prev.getUTCFullYear();
      const pm = prev.getUTCMonth() + 1;
      const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
      return { from: toDateInput(py, pm, 1), to: toDateInput(py, pm, lastDay) };
    }
    case 'thisYear':
      return { from: toDateInput(y, 1, 1), to: toDateInput(y, m, d) };
    default:
      return { from: `${y}--`, to: `${y}--` };
  }
}

function parseDateParts(dateStr: string): { d: string; m: string; y: string } {
  if (!dateStr) return { d: '', m: '', y: '' };
  const [y, m, d] = dateStr.split('-');
  return {
    d: d ? String(Number(d)) : '',
    m: m ? String(Number(m)) : '',
    y: y ?? '',
  };
}

function buildDateFromParts(d: string, m: string, y: string): string {
  if (!d && !m && !y) return '';
  return `${y}-${m ? pad2(Number(m)) : ''}-${d ? pad2(Number(d)) : ''}`;
}

function formatVnd(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

function formatCreatedParts(isoString: string | null | undefined): { date: string; time: string } {
  if (!isoString) return { date: '—', time: '' };
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return { date: '—', time: '' };
  return {
    date: d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

type AppliedFilters = {
  status: StatusFilter;
  datePreset: DatePreset;
  customFrom: string;
  customTo: string;
  assignedTeamId: string;
  unassignedOnly: boolean;
  slaBreached: boolean;
};

function DrawerFilterSection({
  title,
  children,
  last,
}: {
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <section className={cn('space-y-3 py-5', !last && 'border-b border-slate-100')}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function drawerOptionClass(selected: boolean, className?: string) {
  return cn(
    'flex cursor-pointer items-center justify-center rounded-lg border bg-white text-center text-sm font-medium text-slate-700',
    selected ? 'border-2 border-emerald-600 text-emerald-700' : 'border border-slate-200',
    className
  );
}

function GridOption<T extends string>({
  value,
  selected,
  children,
  onSelect,
}: {
  value: T;
  selected: boolean;
  children: ReactNode;
  onSelect: (value: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={drawerOptionClass(selected, 'h-11 px-2')}
    >
      {children}
    </button>
  );
}

function TimePresetPills({
  value,
  onChange,
}: {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Lọc nhanh theo thời gian"
      className="flex flex-wrap items-center gap-2"
    >
      {DRAWER_TIME_PRESETS.map(opt => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            aria-pressed={active}
            className={cn(
              'inline-flex h-9 w-fit shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border px-3 text-xs font-medium',
              active
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-900'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const DATE_PART_TRIGGER_CLASS =
  'h-10 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-600 shadow-none focus:ring-0 focus:ring-offset-0 [&>span]:line-clamp-none [&>svg]:ml-1.5 [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:opacity-50 data-[placeholder]:text-slate-400';

const DATE_PART_CONTENT_CLASS =
  'z-[120] max-h-56 min-w-[4.5rem] rounded-xl border-slate-200 bg-white shadow-lg';

function DatePartsRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { d, m, y } = parseDateParts(value);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const update = (nextD: string, nextM: string, nextY: string) => {
    onChange(buildDateFromParts(nextD, nextM, nextY));
  };

  return (
    <div>
      <span className="mb-2 block text-xs font-bold text-slate-400">{label}</span>
      <div className="flex w-fit max-w-full items-center gap-1.5">
        <Select value={d} onValueChange={v => update(v, m, y)}>
          <SelectTrigger
            className={cn(DATE_PART_TRIGGER_CLASS, 'w-[4.25rem]')}
            aria-label={`${label} — ngày`}
          >
            <SelectValue placeholder="DD" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} className={DATE_PART_CONTENT_CLASS}>
            {days.map(day => (
              <SelectItem
                key={day}
                value={String(day)}
                className="cursor-pointer justify-center pl-2 pr-2"
              >
                {pad2(day)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="shrink-0 text-sm text-slate-400">/</span>
        <Select value={m} onValueChange={v => update(d, v, y)}>
          <SelectTrigger
            className={cn(DATE_PART_TRIGGER_CLASS, 'w-[4.25rem]')}
            aria-label={`${label} — tháng`}
          >
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} className={DATE_PART_CONTENT_CLASS}>
            {months.map(month => (
              <SelectItem
                key={month}
                value={String(month)}
                className="cursor-pointer justify-center pl-2 pr-2"
              >
                {pad2(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="shrink-0 text-sm text-slate-400">/</span>
        <Select value={y} onValueChange={v => update(d, m, v)}>
          <SelectTrigger
            className={cn(DATE_PART_TRIGGER_CLASS, 'w-28')}
            aria-label={`${label} — năm`}
          >
            <SelectValue placeholder="YYYY" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            className={cn(DATE_PART_CONTENT_CLASS, 'min-w-28')}
          >
            {years.map(year => (
              <SelectItem
                key={year}
                value={String(year)}
                className="cursor-pointer justify-center pl-2 pr-2"
              >
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DateToolbarFilter({
  value,
  onChange,
}: {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Lọc nhanh theo thời gian tạo"
      className="inline-flex shrink-0 select-none items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
    >
      {DATE_PRESETS.map(opt => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            aria-pressed={active}
            className={cn(
              'h-7 select-none rounded-md px-2.5 text-[0.8125rem] font-medium transition-colors',
              active ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function InspectionFilterDrawer({
  open,
  onOpenChange,
  activeCount,
  draft,
  teams,
  teamsLoading,
  onReset,
  onApply,
  onDraftChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  draft: AppliedFilters;
  teams: TeamListItem[];
  teamsLoading: boolean;
  onReset: () => void;
  onApply: () => void;
  onDraftChange: (patch: Partial<AppliedFilters>) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full max-h-none flex-col bg-white">
        <DrawerHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4 text-left">
          <DrawerTitle className="text-base font-bold text-slate-900">Bộ lọc tìm kiếm</DrawerTitle>
          <DrawerClose asChild>
            <button
              type="button"
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Đóng bộ lọc"
            >
              <X className="size-4" aria-hidden />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto px-5">
          <DrawerFilterSection title="Trạng thái hồ sơ">
            <div className="grid grid-cols-3 gap-2">
              {STATUS_FILTERS.map(opt => (
                <GridOption
                  key={opt.key}
                  value={opt.key}
                  selected={draft.status === opt.key}
                  onSelect={status => onDraftChange({ status })}
                >
                  {opt.label}
                </GridOption>
              ))}
            </div>
          </DrawerFilterSection>

          <DrawerFilterSection title="Thời gian">
            <div className="space-y-4">
              <TimePresetPills
                value={draft.datePreset}
                onChange={datePreset => {
                  const { from, to } = getPresetDateInputs(datePreset);
                  onDraftChange({ datePreset, customFrom: from, customTo: to });
                }}
              />
              <div className="space-y-4">
                <DatePartsRow
                  label="Từ ngày"
                  value={draft.customFrom}
                  onChange={customFrom =>
                    onDraftChange({
                      customFrom,
                      ...(customFrom ? { datePreset: 'all' as DatePreset } : {}),
                    })
                  }
                />
                <DatePartsRow
                  label="Đến ngày"
                  value={draft.customTo}
                  onChange={customTo =>
                    onDraftChange({
                      customTo,
                      ...(customTo ? { datePreset: 'all' as DatePreset } : {}),
                    })
                  }
                />
              </div>
            </div>
          </DrawerFilterSection>

          <DrawerFilterSection title="Đội thanh tra">
            <Select
              value={draft.assignedTeamId || '__all__'}
              onValueChange={value =>
                onDraftChange({
                  assignedTeamId: value === '__all__' ? '' : value,
                  ...(value !== '__all__' ? { unassignedOnly: false } : {}),
                })
              }
            >
              <SelectTrigger className="h-11 w-full border-slate-200 bg-white">
                <SelectValue placeholder="Tất cả đội" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tất cả đội</SelectItem>
                {teamsLoading ? (
                  <SelectItem value="__loading__" disabled>
                    Đang tải…
                  </SelectItem>
                ) : (
                  teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </DrawerFilterSection>

          <DrawerFilterSection title="Điều kiện khác" last>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="unassigned-only"
                  checked={draft.unassignedOnly}
                  onCheckedChange={checked =>
                    onDraftChange({
                      unassignedOnly: checked === true,
                      ...(checked === true ? { assignedTeamId: '' } : {}),
                    })
                  }
                />
                <Label htmlFor="unassigned-only" className="cursor-pointer leading-snug">
                  Chỉ hồ sơ chưa gán đội thanh tra
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="sla-breached"
                  checked={draft.slaBreached}
                  onCheckedChange={checked => onDraftChange({ slaBreached: checked === true })}
                />
                <Label htmlFor="sla-breached" className="cursor-pointer leading-snug">
                  Quá hạn xử lý
                </Label>
              </div>
            </div>
          </DrawerFilterSection>
        </div>

        <DrawerFooter className="grid grid-cols-2 gap-3 bg-white px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={onReset}
          >
            Đặt lại
          </Button>
          <Button
            type="button"
            className="h-11 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onApply}
          >
            Xem kết quả{activeCount > 0 ? ` (${activeCount})` : ''}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function CreatedCell({ iso }: { iso: string | null | undefined }) {
  const { date, time } = formatCreatedParts(iso);
  return (
    <div className="min-w-0 space-y-0.5" title={time ? `${date} ${time}` : date}>
      <span
        className={cn(
          'block truncate text-[10px] font-medium leading-snug text-slate-800',
          '@[44rem]/insp-table:text-[11px] @[56rem]/insp-table:text-xs'
        )}
      >
        {date}
      </span>
      {time ? (
        <span
          className={cn(
            'block truncate text-[10px] tabular-nums leading-snug text-slate-500',
            '@[44rem]/insp-table:text-xs'
          )}
        >
          {time}
        </span>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = inspectionStatusLabelVi(status);
  return (
    <span className={cn(BADGE_BASE, BADGE_SIZE, inspectionStatusBadgeClass(status))} title={label}>
      {label}
    </span>
  );
}

async function copyText(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error('Không thể sao chép. Hãy chọn và copy thủ công.');
  }
}

function CopyIconButton({
  value,
  label,
  successMessage,
}: {
  value: string;
  label: string;
  successMessage: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={e => {
        e.stopPropagation();
        void (async () => {
          await copyText(value, successMessage);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        })();
      }}
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded text-slate-400',
        'opacity-0 transition-opacity group-hover/copyrow:opacity-100',
        'hover:bg-slate-100 hover:text-slate-700',
        'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
      )}
    >
      {copied ? (
        <Check className="size-3 text-emerald-600" aria-hidden />
      ) : (
        <Copy className="size-3" aria-hidden />
      )}
    </button>
  );
}

function InspectionIdentityCell({ row }: { row: InspectionOfficerQueueItem }) {
  const reportCode = row.reportCode?.trim() || '';

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg',
          THUMB_SIZE,
          'bg-white text-slate-500 ring-1 ring-slate-200/80'
        )}
        aria-hidden
      >
        <FileText className="size-4" />
      </span>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="group/copyrow flex min-w-0 items-center gap-1">
          <span
            className={cn(
              'min-w-0 truncate text-[11px] font-semibold tabular-nums text-sky-700',
              '@[44rem]/insp-table:text-xs'
            )}
            title={reportCode || undefined}
          >
            {reportCode || '—'}
          </span>
          {reportCode ? (
            <CopyIconButton
              value={reportCode}
              label={`Sao chép mã ${reportCode}`}
              successMessage="Đã sao chép mã báo cáo."
            />
          ) : null}
        </div>

        <div className="group/copyrow flex min-w-0 items-center gap-1">
          <span
            className={cn(
              'min-w-0 truncate text-[10px] tabular-nums text-slate-500',
              '@[44rem]/insp-table:text-[11px]'
            )}
            title={row.id}
          >
            {row.id}
          </span>
          <CopyIconButton
            value={row.id}
            label="Sao chép ID hồ sơ"
            successMessage="Đã sao chép ID hồ sơ."
          />
        </div>
      </div>
    </div>
  );
}

function SlaBreachedCell({ breached }: { breached: boolean }) {
  if (!breached) {
    return <span className={cn(CELL_META, 'text-slate-400')}>—</span>;
  }
  return (
    <span
      className={cn(
        'inline-flex max-w-full min-w-0 items-center gap-0.5 truncate text-[10px] font-medium text-red-600',
        '@[44rem]/insp-table:text-xs'
      )}
      title="Quá hạn xử lý"
    >
      <AlertTriangle className="size-3 shrink-0" aria-hidden />
      Quá hạn
    </span>
  );
}

function InspectionRowActions({ row }: { row: InspectionOfficerQueueItem }) {
  const detailHref = `/officer/inspections/${row.id}`;
  return (
    <div className="flex items-center justify-end" onClick={e => e.stopPropagation()}>
      <Link
        href={detailHref}
        title="Xem chi tiết"
        aria-label={`Xem chi tiết hồ sơ ${row.reportCode ?? row.id}`}
        className={cn(
          'inline-flex size-7 items-center justify-center rounded-md @[44rem]/insp-table:size-8',
          'text-slate-600 transition-colors',
          'hover:bg-slate-100 hover:text-slate-900',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
        )}
      >
        <Eye className="size-3.5 @[44rem]/insp-table:size-4" aria-hidden />
      </Link>
    </div>
  );
}

function renderInspectionCell(key: ColumnKey, row: InspectionOfficerQueueItem) {
  const subjectName = resolveInspectionSubjectName(null, row.violatorName);

  switch (key) {
    case 'code':
      return <InspectionIdentityCell row={row} />;
    case 'address':
      return (
        <div className="min-w-0 space-y-0.5">
          <span
            className={cn(
              'line-clamp-2 text-[11px] leading-snug wrap-break-word text-slate-700',
              '@[44rem]/insp-table:text-xs'
            )}
            title={row.address ?? undefined}
          >
            {row.address?.trim() || '—'}
          </span>
          <span
            className={cn(
              'block truncate text-[10px] leading-snug text-slate-500',
              '@[44rem]/insp-table:text-[11px]'
            )}
            title={subjectName ?? undefined}
          >
            {subjectName ?? 'Chưa cập nhật đối tượng'}
          </span>
        </div>
      );
    case 'status':
      return <StatusBadge status={row.status} />;
    case 'team':
      return (
        <span
          className={cn(
            'line-clamp-2 text-[11px] leading-snug text-slate-700',
            '@[44rem]/insp-table:text-xs'
          )}
          title={row.assignedTeamName ?? undefined}
        >
          {row.assignedTeamName?.trim() || 'Chưa gán'}
        </span>
      );
    case 'penalty':
      return inspectionShowsPenaltyFields(row.status) ? (
        <span
          className={cn(CELL_META, 'font-medium text-slate-800')}
          title={formatVnd(row.penaltyAmount)}
        >
          {formatVnd(row.penaltyAmount)}
        </span>
      ) : (
        <span className={cn(CELL_META, 'text-slate-400')}>—</span>
      );
    case 'sla':
      return <SlaBreachedCell breached={row.slaInspectionBreached} />;
    case 'created':
      return <CreatedCell iso={row.createdAt} />;
    case 'actions':
      return null;
    default:
      return null;
  }
}

function countActiveFilters(f: AppliedFilters): number {
  return (
    (f.status !== 'all' ? 1 : 0) +
    (f.datePreset !== 'all' || isCompleteDateInput(f.customFrom) || isCompleteDateInput(f.customTo)
      ? 1
      : 0) +
    (f.assignedTeamId ? 1 : 0) +
    (f.unassignedOnly ? 1 : 0) +
    (f.slaBreached ? 1 : 0)
  );
}

function clearedFilters(): AppliedFilters {
  const yearDefaults = getPresetDateInputs('all');
  return {
    status: 'all',
    datePreset: 'all',
    customFrom: yearDefaults.from,
    customTo: yearDefaults.to,
    assignedTeamId: '',
    unassignedOnly: false,
    slaBreached: false,
  };
}

type InspectionsPageClientProps = {
  /** Hub 「Sau xử lý」 — bỏ page title; filter/table giữ nguyên. */
  embedded?: boolean;
};

export function InspectionsPageClient({ embedded = false }: InspectionsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [toolbarDatePreset, setToolbarDatePreset] = useState<DatePreset>('all');

  const [applied, setApplied] = useState<AppliedFilters>(() => clearedFilters());
  const [draft, setDraft] = useState<AppliedFilters>(() => clearedFilters());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [highlightFading, setHighlightFading] = useState(false);
  const [latchedUrlHighlight, setLatchedUrlHighlight] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  /** Deep-link `/officer/recurrence?tab=inspections&highlight={inspectionId}` */
  const urlHighlight =
    searchParams.get('tab') === 'inspections'
      ? searchParams.get('highlight')?.trim() || null
      : null;

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, () => {
    setPage(1);
  });

  const { data: teamsData, isPending: teamsLoading } = useTeamsList(INSPECTION_TEAM_FILTER_PARAMS, {
    enabled: filterOpen || Boolean(applied.assignedTeamId),
  });
  const teams = teamsData?.items ?? EMPTY_TEAMS;

  const appliedFilterCount = countActiveFilters(applied);
  const draftFilterCount = countActiveFilters(draft);

  const hasDrawerDateFilter =
    applied.datePreset !== 'all' ||
    isCompleteDateInput(applied.customFrom) ||
    isCompleteDateInput(applied.customTo);

  const effectiveDateRange = useMemo(() => {
    if (hasDrawerDateFilter) {
      return getDateRange(applied.datePreset, applied.customFrom, applied.customTo);
    }
    return getDateRange(toolbarDatePreset, '', '');
  }, [
    hasDrawerDateFilter,
    applied.datePreset,
    applied.customFrom,
    applied.customTo,
    toolbarDatePreset,
  ]);

  const listParams = useMemo(
    () => ({
      page,
      pageSize: INSPECTIONS_PAGE_SIZE,
      sortBy: 'CreatedAt' as const,
      sortDir: 'Desc' as const,
      ...(applied.status !== 'all' ? { status: applied.status } : {}),
      ...(applied.assignedTeamId ? { assignedTeamId: applied.assignedTeamId } : {}),
      ...(applied.unassignedOnly ? { unassignedOnly: true } : {}),
      ...(applied.slaBreached ? { slaBreached: true } : {}),
      ...effectiveDateRange,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }),
    [page, applied, effectiveDateRange, debouncedSearch]
  );

  const { data, isPending, isFetching, isError, refetch } = useInspectionOfficerQueue(listParams);

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  /** Bỏ `?highlight=` khỏi URL — không setState (eslint react-hooks/set-state-in-effect). */
  useEffect(() => {
    if (!urlHighlight) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete('highlight');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [urlHighlight, searchParams, router, pathname]);

  /** Tự tắt highlight — không phụ thuộc items/URL (tránh cleanup giết timer). */
  useEffect(() => {
    if (!highlightedId) return;
    const fadeTimer = window.setTimeout(() => setHighlightFading(true), HIGHLIGHT_HOLD_MS);
    const clearTimer = window.setTimeout(() => {
      setLatchedUrlHighlight(null);
      setHighlightedId(null);
      setHighlightFading(false);
    }, HIGHLIGHT_CLEAR_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightedId]);

  useEffect(() => {
    if (!highlightedId || highlightFading) return;

    let cancelled = false;
    let attempts = 0;
    const tryScroll = () => {
      if (cancelled) return;
      const el = rowRefs.current.get(highlightedId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      attempts += 1;
      if (attempts < 24) requestAnimationFrame(tryScroll);
    };
    tryScroll();
    return () => {
      cancelled = true;
    };
  }, [highlightedId, items, highlightFading]);

  if (urlHighlight && urlHighlight !== latchedUrlHighlight) {
    setLatchedUrlHighlight(urlHighlight);
    setHighlightedId(urlHighlight);
    setHighlightFading(false);
  }

  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      const yearDefaults = getPresetDateInputs('all');
      setDraft({
        ...applied,
        customFrom:
          applied.datePreset === 'all' && !parseDateParts(applied.customFrom).y
            ? yearDefaults.from
            : applied.customFrom,
        customTo:
          applied.datePreset === 'all' && !parseDateParts(applied.customTo).y
            ? yearDefaults.to
            : applied.customTo,
      });
    }
    setFilterOpen(open);
  };

  const handleToolbarPresetChange = (preset: DatePreset) => {
    setToolbarDatePreset(preset);
    const yearDefaults = getPresetDateInputs('all');
    setApplied(prev => ({
      ...prev,
      datePreset: 'all',
      customFrom: yearDefaults.from,
      customTo: yearDefaults.to,
    }));
    setPage(1);
  };

  const handleResetDraft = () => {
    const cleared = clearedFilters();
    setDraft(cleared);
    setApplied(cleared);
    setPage(1);
    setFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    const cleared = clearedFilters();
    setApplied(cleared);
    setDraft(cleared);
    setPage(1);
  };

  const handleApplyDraft = () => {
    setApplied(draft);
    setToolbarDatePreset('all');
    setPage(1);
    setFilterOpen(false);
  };

  return (
    <>
      <header className="mb-6 shrink-0">
        {!embedded ? (
          <div className="border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-emerald-700">
                <FileText className="size-7" aria-hidden />
              </span>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">Hồ sơ xử phạt</h1>
                <p className="text-xs font-normal text-slate-500">
                  Quản lý hồ sơ xử phạt và theo dõi kết quả thanh tra
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={cn('flex flex-wrap items-center justify-between gap-3', !embedded && 'mt-6')}
        >
          <div className="flex min-w-0 items-center gap-2">
            <DateToolbarFilter
              value={hasDrawerDateFilter ? 'all' : toolbarDatePreset}
              onChange={handleToolbarPresetChange}
            />
            <Separator orientation="vertical" className="mx-0.5 h-6 shrink-0 bg-slate-400" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-brand"
              onClick={() => handleFilterOpenChange(true)}
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
            >
              <Filter className="size-3.5 text-brand" aria-hidden />
              Bộ lọc
              {appliedFilterCount > 0 ? (
                <span className="ml-0.5 rounded-full bg-brand/10 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-brand">
                  {appliedFilterCount}
                </span>
              ) : null}
              <ChevronDown className="size-3.5 opacity-60" aria-hidden />
            </Button>
            {appliedFilterCount > 0 ? (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className={cn(
                  'cursor-pointer shrink-0 text-[0.8125rem] font-medium text-slate-500',
                  'transition-[font-weight,color]',
                  'hover:font-bold hover:text-slate-800',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-1'
                )}
              >
                Xóa tất cả
              </button>
            ) : null}
          </div>
          <div className="relative w-72 max-w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm mã báo cáo, địa chỉ hoặc đối tượng"
              className={cn(
                'h-8 w-full border-slate-200 bg-white pl-9 text-sm shadow-none',
                isFetching && !isPending && 'pr-8'
              )}
              aria-label="Tìm theo mã báo cáo, địa chỉ hoặc đối tượng vi phạm"
            />
            {isFetching && !isPending ? (
              <Loader2
                className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-slate-400"
                aria-hidden
              />
            ) : null}
          </div>
        </div>
      </header>

      <InspectionFilterDrawer
        open={filterOpen}
        onOpenChange={handleFilterOpenChange}
        activeCount={draftFilterCount}
        draft={draft}
        teams={teams}
        teamsLoading={teamsLoading}
        onReset={handleResetDraft}
        onApply={handleApplyDraft}
        onDraftChange={patch => setDraft(prev => ({ ...prev, ...patch }))}
      />

      <div className="-mx-6 flex flex-1 flex-col overflow-hidden bg-white">
        <div className="@container/insp-table min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className={cn(ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}>
                {COLUMN_DEFS.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      tableCellPad(col.key, 'head'),
                      'h-auto overflow-hidden border-0 bg-slate-100 text-left',
                      col.className
                    )}
                  >
                    <span className={HEAD_LABEL} title={col.label}>
                      {col.label}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <Loader2 className="mx-auto size-8 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">
                      Không tải được danh sách hồ sơ xử phạt.
                    </p>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className={cn(ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-lg font-medium text-slate-500">
                      <SaveIcon size={44} className="opacity-30" />
                      <span>Không có hồ sơ xử phạt</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(row => {
                  const isHighlighted = row.id === highlightedId && !highlightFading;

                  return (
                    <TableRow
                      key={row.id}
                      ref={el => {
                        if (el) rowRefs.current.set(row.id, el);
                        else rowRefs.current.delete(row.id);
                      }}
                      className={cn(
                        ROW_BORDER,
                        'cursor-pointer border-b transition-colors duration-700 hover:bg-sky-50/40',
                        isHighlighted && 'bg-emerald-50'
                      )}
                      onClick={() => router.push(`/officer/inspections/${row.id}`)}
                    >
                      {COLUMN_DEFS.map(col => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            tableCellPad(col.key, 'body'),
                            'align-middle',
                            col.key !== 'actions' && 'min-w-0 overflow-hidden',
                            col.className
                          )}
                          onClick={col.key === 'actions' ? e => e.stopPropagation() : undefined}
                        >
                          {col.key === 'actions' ? (
                            <InspectionRowActions row={row} />
                          ) : (
                            renderInspectionCell(col.key, row)
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className="relative flex shrink-0 items-center justify-center px-6 py-3">
            {pagination.totalPages > 1 ? (
              <PaginationSimple
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                className="mx-auto w-auto justify-center"
              />
            ) : null}
            <p className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-slate-500 tabular-nums">
              {pagination.totalItems.toLocaleString('vi-VN')} hồ sơ
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
