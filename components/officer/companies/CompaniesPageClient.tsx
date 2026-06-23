'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Filter,
  Loader2,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

import { CompanyCreateDialog } from '@/components/officer/companies/CompanyCreateDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCompaniesList } from '@/hooks/useCompany';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { CompanyListItem, CompanyStatus } from '@/lib/api/models/company';
import { COMPANIES_PAGE_SIZE } from '@/lib/api/models/company';
import { canAccessCompanies } from '@/lib/constants/officerRoles';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { mapDataPanelClass } from '@/lib/map/mapShellStyles';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

type ColumnKey =
  | 'name'
  | 'contractNumber'
  | 'contractType'
  | 'taxCode'
  | 'email'
  | 'phone'
  | 'serviceAreaCount'
  | 'staffCount'
  | 'status'
  | 'actions';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'name', label: 'Tên doanh nghiệp', className: 'min-w-[200px]' },
  { key: 'contractNumber', label: 'Số HĐ', className: 'min-w-[120px]' },
  { key: 'contractType', label: 'Loại HĐ', className: 'min-w-[110px]' },
  { key: 'taxCode', label: 'MST', className: 'min-w-[110px]' },
  { key: 'email', label: 'Email', className: 'min-w-[160px]' },
  { key: 'phone', label: 'Điện thoại', className: 'min-w-[110px]' },
  { key: 'serviceAreaCount', label: 'Địa bàn', className: 'w-[80px] text-center' },
  { key: 'staffCount', label: 'Nhân sự', className: 'w-[80px] text-center' },
  { key: 'status', label: 'Trạng thái', className: 'w-[120px]' },
  { key: 'actions', label: '', className: 'w-[48px]' },
];

function CompanyRowActions({
  row,
  onAssignArea,
}: {
  row: CompanyListItem;
  onAssignArea: (row: CompanyListItem) => void;
}) {
  const handleDetail = () => {
    toast.info(`Chi tiết "${row.name}" — tính năng đang phát triển.`);
  };

  const handleRemove = () => {
    toast.info(`Xóa "${row.name}" — tính năng đang phát triển.`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label={`Thao tác ${row.name}`}
        >
          <MoreVertical className="size-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onAssignArea(row)}>Gán địa bàn</DropdownMenuItem>
        <DropdownMenuItem onSelect={handleDetail}>Chi tiết</DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={handleRemove}
        >
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CompaniesPageClient() {
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'assign'>('create');
  const [assignCompany, setAssignCompany] = useState<CompanyListItem | null>(null);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, () => {
    setPage(1);
  });

  const handleAssignArea = (row: CompanyListItem) => {
    setDialogMode('assign');
    setAssignCompany(row);
    setDialogOpen(true);
  };

  const listParams = useMemo(
    () => ({
      page,
      pageSize: COMPANIES_PAGE_SIZE,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }),
    [page, debouncedSearch]
  );

  const { data, isPending, isFetching, isError, error, refetch } = useCompaniesList(listParams);

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  if (!canAccessCompanies(user?.systemRole)) {
    return <CompaniesAccessDenied homeHref={getDefaultOfficerHomePath(user?.systemRole)} />;
  }

  return (
    <div className={mapDataPanelClass()}>
      <header className="mb-3 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-[0.35rem]">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Doanh nghiệp</h1>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.15rem] text-slate-500 hover:bg-slate-400/15 hover:text-slate-700"
              aria-label="Thông tin danh sách doanh nghiệp"
            >
              <CircleHelp className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-sky-700"
              disabled
              title="Sắp có"
            >
              <Filter className="size-3.5 text-sky-600" aria-hidden />
              Thêm bộ lọc
              <ChevronDown className="size-3.5 opacity-60" aria-hidden />
            </Button>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, số HĐ hoặc MST"
              className="h-8 max-w-xs border-slate-200 bg-white text-sm shadow-none"
              aria-label="Tìm doanh nghiệp theo tên, số hợp đồng hoặc mã số thuế"
            />
            {isFetching && !isPending ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-slate-400" aria-hidden />
            ) : null}
          </div>

          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 gap-1.5 bg-sky-600 text-[0.8125rem] font-medium text-white hover:bg-sky-700"
            onClick={() => {
              setDialogMode('create');
              setAssignCompany(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            Thêm
          </Button>
        </div>
      </header>

      <CompanyCreateDialog
        open={dialogOpen}
        mode={dialogMode}
        assignCompany={assignCompany}
        onClose={() => {
          setDialogOpen(false);
          setAssignCompany(null);
        }}
        onCreated={() => void refetch()}
        onAssigned={() => void refetch()}
      />

      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/4%)]">
        <div className="flex-1 overflow-auto [&_table]:border-collapse">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMN_DEFS.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      'h-9 border-b border-slate-200 bg-slate-50/80 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
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
                <TableRow>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 text-center">
                    <p className="text-sm text-destructive">
                      {(error as Error)?.message ?? 'Không tải được danh sách doanh nghiệp.'}
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
                <TableRow>
                  <TableCell
                    colSpan={COLUMN_DEFS.length}
                    className="h-32 text-center text-sm text-slate-500"
                  >
                    Không có doanh nghiệp phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                items.map(row => (
                  <TableRow key={row.id} className="border-slate-100 hover:bg-sky-50/40">
                    {COLUMN_DEFS.map(col => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          'px-3 py-2',
                          (col.key === 'serviceAreaCount' || col.key === 'staffCount') &&
                            'text-center'
                        )}
                      >
                        {renderCompanyCell(col.key, row, handleAssignArea)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-500">
              Trang {pagination.page}/{pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrev}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
                Trước
              </button>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setPage(p => p + 1)}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Sau
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function renderCompanyCell(
  key: ColumnKey,
  row: CompanyListItem,
  onAssignArea: (row: CompanyListItem) => void
) {
  switch (key) {
    case 'name':
      return (
        <button
          type="button"
          className="text-left text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline"
        >
          {row.name}
        </button>
      );
    case 'contractNumber':
      return <span className="font-mono text-xs text-slate-700">{row.contractNumber}</span>;
    case 'contractType':
      return <span className="text-sm text-slate-700">{row.contractType}</span>;
    case 'taxCode':
      return <span className="font-mono text-xs text-slate-600">{row.taxCode}</span>;
    case 'email':
      return <span className="text-sm text-slate-700">{row.email}</span>;
    case 'phone':
      return <span className="text-sm text-slate-700">{row.phone}</span>;
    case 'serviceAreaCount':
      return <span className="text-sm font-medium text-slate-700">{row.serviceAreaCount}</span>;
    case 'staffCount':
      return <span className="text-sm font-medium text-slate-700">{row.staffCount}</span>;
    case 'status':
      return <CompanyStatusBadge status={row.status} />;
    case 'actions':
      return <CompanyRowActions row={row} onAssignArea={onAssignArea} />;
    default:
      return null;
  }
}

function CompaniesAccessDenied({ homeHref }: { homeHref: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-900">Không có quyền truy cập</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Danh sách doanh nghiệp chỉ dành cho cán bộ Sở TNMT (DEO).
      </p>
      <Button asChild className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500">
        <Link href={homeHref}>Về trang chính</Link>
      </Button>
    </div>
  );
}

function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const config: Record<string, { dot: string; label: string }> = {
    PendingActivation: { dot: 'bg-amber-400', label: 'Chờ kích hoạt' },
    Active: { dot: 'bg-emerald-500', label: 'Đang hoạt động' },
    Suspended: { dot: 'bg-orange-400', label: 'Tạm ngưng' },
    Expired: { dot: 'bg-slate-300', label: 'Hết hạn' },
  };

  const { dot, label } = config[status] ?? {
    dot: 'bg-slate-300',
    label: status,
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
      <span className={cn('inline-block size-2.5 shrink-0 rounded-full', dot)} aria-hidden />
      {label}
    </span>
  );
}
