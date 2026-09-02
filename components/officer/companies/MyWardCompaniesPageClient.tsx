'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2 } from 'lucide-react';

import { GreenLensLookupSpinner } from '@/components/ui/greenlens-lookup-spinner';
import { GooeyInput } from '@/components/ui/gooey-input';
import HotelIcon from '@/components/ui/hotel-icon';
import { PaginationSimple } from '@/components/ui/pagination';
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
import { useMyWardCompaniesList } from '@/hooks/useCompany';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import type {
  CompanyContractType,
  CompanyStatus,
  MyWardCompanyItem,
} from '@/lib/api/models/company';
import { COMPANY_CONTRACT_TYPES, MY_WARD_COMPANIES_PAGE_SIZE } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import { contractTypeLabel } from '@/utils/companyUi';

type ColumnKey =
  | 'name'
  | 'contractNumber'
  | 'contractType'
  | 'taxCode'
  | 'email'
  | 'phone'
  | 'serviceAreaCount'
  | 'staffCount'
  | 'activeReportCount'
  | 'status';

const FIRST_COL: ColumnKey = 'contractNumber';
const LAST_COL: ColumnKey = 'status';

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y = layer === 'head' ? 'py-3.5' : 'py-4';
  if (colKey === FIRST_COL) return cn('px-0', y, 'ps-12 pe-3');
  if (colKey === LAST_COL) return cn('px-0', y, 'ps-3 pe-6');
  return cn(y, 'px-3 sm:px-4');
}

const ROW_BORDER = 'border-b border-slate-200';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'contractNumber', label: 'Số HĐ', className: 'w-[8%]' },
  { key: 'name', label: 'Doanh nghiệp', className: 'w-[20%]' },
  { key: 'contractType', label: 'Loại HĐ', className: 'w-[9%]' },
  { key: 'taxCode', label: 'MST', className: 'w-[9%]' },
  { key: 'email', label: 'Email', className: 'w-[11%]' },
  { key: 'phone', label: 'Điện thoại', className: 'w-[10%]' },
  { key: 'serviceAreaCount', label: 'Địa bàn', className: 'w-[7%]' },
  { key: 'staffCount', label: 'Nhân sự', className: 'w-[5%]' },
  { key: 'activeReportCount', label: 'BC xử lý', className: 'w-[6%]' },
  { key: 'status', label: 'Trạng thái', className: 'w-[12%]' },
];

type StatusFilter = 'all' | 'PendingActivation' | 'Active' | 'Suspended' | 'Expired';

const STATUS_TOOLBAR: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'PendingActivation', label: 'Chờ kích hoạt' },
  { key: 'Active', label: 'Đang hoạt động' },
  { key: 'Suspended', label: 'Tạm ngưng' },
  { key: 'Expired', label: 'Hết hạn' },
];

function StatusToolbarFilter({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (status: StatusFilter) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Lọc nhanh theo trạng thái"
      className="inline-flex max-w-full shrink-0 select-none flex-wrap items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
    >
      {STATUS_TOOLBAR.map(opt => {
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

type ContractTypeFilter = 'all' | CompanyContractType;

const CONTRACT_TYPE_OPTIONS: { key: ContractTypeFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả loại' },
  ...COMPANY_CONTRACT_TYPES.map(type => ({
    key: type as ContractTypeFilter,
    label: contractTypeLabel(type),
  })),
];

function ContractTypeSelectFilter({
  value,
  onChange,
}: {
  value: ContractTypeFilter;
  onChange: (contractType: ContractTypeFilter) => void;
}) {
  return (
    <Select value={value} onValueChange={v => onChange(v as ContractTypeFilter)}>
      <SelectTrigger
        className="h-8 w-[11.5rem] shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0 text-[0.8125rem] font-medium leading-none shadow-none focus:ring-1 focus:ring-brand/30"
        aria-label="Lọc theo loại hợp đồng"
      >
        <SelectValue placeholder="Loại HĐ" />
      </SelectTrigger>
      <SelectContent align="start" position="popper" sideOffset={4}>
        {CONTRACT_TYPE_OPTIONS.map(opt => (
          <SelectItem key={opt.key} value={opt.key} className="text-sm">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const config: Record<string, { dot: string; label: string; text?: string }> = {
    PendingActivation: { dot: 'bg-amber-400', label: 'Chờ kích hoạt' },
    Active: { dot: 'bg-emerald-500', label: 'Đang hoạt động' },
    Suspended: { dot: 'bg-orange-400', label: 'Tạm ngưng' },
    Expired: { dot: 'bg-rose-500', label: 'Hết hạn', text: 'font-medium text-rose-800' },
  };

  const { dot, label, text } = config[status] ?? {
    dot: 'bg-slate-300',
    label: status,
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-slate-700', text)}>
      <span className={cn('inline-block size-2.5 shrink-0 rounded-full', dot)} aria-hidden />
      {label}
    </span>
  );
}

function renderCompanyCell(key: ColumnKey, row: MyWardCompanyItem) {
  switch (key) {
    case 'name':
      return (
        <div className="min-w-0">
          <Link
            href={`/officer/my-companies/${row.id}`}
            className="block min-w-0 truncate text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline"
            title={row.name}
          >
            {row.name}
          </Link>
          {row.status === 'Expired' ? (
            <span className="mt-0.5 inline-flex items-center rounded bg-rose-100 px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide text-rose-800 uppercase">
              Hết hạn
            </span>
          ) : null}
        </div>
      );
    case 'contractNumber':
      return <span className="text-xs font-medium text-slate-700">{row.contractNumber}</span>;
    case 'contractType':
      return (
        <span className="text-sm text-slate-700">
          {contractTypeLabel(row.contractType as CompanyContractType)}
        </span>
      );
    case 'taxCode':
      return <span className="text-xs text-slate-600">{row.taxCode}</span>;
    case 'email':
      return (
        <span className="block min-w-0 truncate text-sm text-slate-700" title={row.email}>
          {row.email}
        </span>
      );
    case 'phone':
      return <span className="text-sm text-slate-700">{row.phone}</span>;
    case 'serviceAreaCount':
      return (
        <span className="text-xs font-medium tabular-nums text-slate-700">
          {row.serviceAreaCount}
        </span>
      );
    case 'staffCount':
      return (
        <span className="text-xs font-medium tabular-nums text-slate-700">{row.staffCount}</span>
      );
    case 'activeReportCount':
      return (
        <span className="text-xs font-medium tabular-nums text-slate-700">
          {row.activeReportCount}
        </span>
      );
    case 'status':
      return <CompanyStatusBadge status={row.status} />;
    default:
      return null;
  }
}

export function MyWardCompaniesPageClient() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toolbarStatus, setToolbarStatus] = useState<StatusFilter>('all');
  const [toolbarContractType, setToolbarContractType] = useState<ContractTypeFilter>('all');

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, () => {
    setPage(1);
  });

  const handleToolbarStatusChange = (status: StatusFilter) => {
    setToolbarStatus(status);
    setPage(1);
  };

  const handleToolbarContractTypeChange = (contractType: ContractTypeFilter) => {
    setToolbarContractType(contractType);
    setPage(1);
  };

  const listParams = useMemo(
    () => ({
      page,
      pageSize: MY_WARD_COMPANIES_PAGE_SIZE,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(toolbarStatus !== 'all' ? { status: toolbarStatus } : {}),
      ...(toolbarContractType !== 'all' ? { contractType: toolbarContractType } : {}),
    }),
    [page, debouncedSearch, toolbarStatus, toolbarContractType]
  );

  const { data, isPending, isFetching, isError, error, refetch } =
    useMyWardCompaniesList(listParams);

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <header className="mb-6 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-emerald-700">
              <Building2 className="size-7" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Doanh nghiệp</h1>
              <p className="text-xs font-normal text-slate-500">
                Công ty DVMT phục vụ phường/xã bạn phụ trách
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <StatusToolbarFilter value={toolbarStatus} onChange={handleToolbarStatusChange} />
          <Separator orientation="vertical" className="mx-0.5 h-8 shrink-0 bg-slate-300" />
          <ContractTypeSelectFilter
            value={toolbarContractType}
            onChange={handleToolbarContractTypeChange}
          />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <GooeyInput
              value={search}
              onValueChange={value => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Tìm theo tên, số HĐ hoặc MST"
              className="justify-end"
              collapsedWidth={160}
              expandedWidth={280}
              endAdornment={
                isFetching && !isPending ? (
                  <Loader2 className="size-3.5 animate-spin text-slate-400" aria-hidden />
                ) : null
              }
            />
          </div>
        </div>
      </header>

      <div className="-mx-6 flex flex-1 flex-col overflow-hidden bg-white">
        <div className="relative min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
          <Table className="w-full min-w-4xl table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className={cn(ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}>
                {COLUMN_DEFS.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      tableCellPad(col.key, 'head'),
                      'h-auto border-0 bg-slate-100 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500',
                      col.className
                    )}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <GreenLensLookupSpinner
                      className="mx-auto size-8"
                      aria-label="Đang tải danh sách"
                    />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">
                      {(error as Error)?.message ?? 'Không tải được danh sách doanh nghiệp.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="mt-2 text-sm font-medium text-brand hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className={cn(ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <HotelIcon size={32} className="opacity-30" />
                      <span>Không có doanh nghiệp phù hợp.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(row => {
                  const isExpired = row.status === 'Expired';
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        ROW_BORDER,
                        isExpired
                          ? 'border-l-2 border-l-rose-500 bg-rose-50/40 hover:bg-rose-50/70'
                          : 'hover:bg-brand/10'
                      )}
                    >
                      {COLUMN_DEFS.map(col => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            tableCellPad(col.key, 'body'),
                            'align-middle',
                            col.className,
                            (col.key === 'name' || col.key === 'email') && 'max-w-0'
                          )}
                        >
                          {renderCompanyCell(col.key, row)}
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
          <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
              {pagination.totalPages > 1 ? (
                <PaginationSimple
                  page={page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                  className="w-auto"
                />
              ) : null}
            </div>
            <p className="shrink-0 text-xs text-slate-500 tabular-nums">
              {pagination.totalItems.toLocaleString('vi-VN')} dòng
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
