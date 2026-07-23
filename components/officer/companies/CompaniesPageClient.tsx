'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CircleHelp, Loader2, MoreVertical, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { CompanyAssignAreaDialog } from '@/components/officer/companies/CompanyCreatePageClient';
import { CompanyRenewContractDialog } from '@/components/officer/companies/CompanyRenewContractDialog';
import { CompanySuspendDialog } from '@/components/officer/companies/CompanySuspendDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GooeyInput } from '@/components/ui/gooey-input';
import HotelIcon from '@/components/ui/hotel-icon';
import { MovingBorderButton } from '@/components/ui/moving-border';
import { PaginationSimple } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';
import { useCompaniesList, useDeleteCompany, useReactivateCompany } from '@/hooks/useCompany';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { CompanyContractType, CompanyListItem, CompanyStatus } from '@/lib/api/models/company';
import { COMPANIES_PAGE_SIZE } from '@/lib/api/models/company';
import { canAccessCompanies } from '@/lib/constants/officerRoles';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import { getCompanyMutationError } from '@/utils/companyErrors';

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

const FIRST_COL: ColumnKey = 'contractNumber';
const LAST_COL: ColumnKey = 'actions';

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y = layer === 'head' ? 'py-3.5' : 'py-4';
  if (colKey === FIRST_COL) return cn('px-0', y, 'ps-12 pe-3');
  if (colKey === LAST_COL) return cn('px-0', y, 'ps-3 pe-6');
  return cn(y, 'px-3 sm:px-4');
}

const ROW_BORDER = 'border-b border-slate-200';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'contractNumber', label: 'No.', className: 'w-[8%]' },
  { key: 'name', label: 'Company', className: 'w-[22%]' },
  { key: 'contractType', label: 'Type', className: 'w-[9%]' },
  { key: 'taxCode', label: 'Tax Code', className: 'w-[9%]' },
  { key: 'email', label: 'Email', className: 'w-[11%]' },
  { key: 'phone', label: 'Phone', className: 'w-[10%]' },
  { key: 'serviceAreaCount', label: 'Areas', className: 'w-[7%]' },
  { key: 'staffCount', label: 'Staff', className: 'w-[5%]' },
  { key: 'status', label: 'Status', className: 'w-[12%]' },
  { key: 'actions', label: '', className: 'w-[7%]' },
];

/** Toolbar filter — literal union (tránh const array chỉ dùng trong typeof → ESLint unused). */
type StatusFilter = 'all' | 'PendingActivation' | 'Active' | 'Suspended' | 'Expired';

/** Toolbar pills — cùng chrome DeoReports StatusToolbarFilter; map → query `status`. */
const STATUS_TOOLBAR: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'PendingActivation', label: 'Chờ kích hoạt' },
  { key: 'Active', label: 'Đang hoạt động' },
  { key: 'Suspended', label: 'Tạm ngưng' },
  { key: 'Expired', label: 'Hết hạn' },
];

const CONTRACT_TYPE_LABEL: Record<CompanyContractType, string> = {
  Subsidiary: 'Công ty trực thuộc',
  Bidding: 'Công ty đấu thầu',
};

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

function CompanyRowActions({
  row,
  onAssignArea,
  onReactivate,
  onRenew,
  onSuspend,
  onDelete,
}: {
  row: CompanyListItem;
  onAssignArea: (row: CompanyListItem) => void;
  onReactivate: (row: CompanyListItem) => void;
  onRenew: (row: CompanyListItem) => void;
  onSuspend: (row: CompanyListItem) => void;
  onDelete: (row: CompanyListItem) => void;
}) {
  const hasServiceAreas = row.serviceAreaCount > 0;
  const isSuspended = row.status === 'Suspended';
  const canSuspend = row.status === 'Active';
  // BE: chỉ Bidding được renew; Subsidiary (vô thời hạn) → 422
  const canRenew = row.status === 'Expired' && row.contractType === 'Bidding';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label={`Thao tác ${row.name}`}
          onClick={e => e.stopPropagation()}
        >
          <MoreVertical className="size-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/officer/companies/${row.id}`}>Chi tiết</Link>
        </DropdownMenuItem>
        {hasServiceAreas ? (
          <DropdownMenuItem onSelect={() => onAssignArea(row)}>Gán địa bàn</DropdownMenuItem>
        ) : null}
        {isSuspended ? (
          <DropdownMenuItem onSelect={() => onReactivate(row)}>Kích hoạt</DropdownMenuItem>
        ) : null}
        {canRenew ? (
          <DropdownMenuItem onSelect={() => onRenew(row)}>Gia hạn</DropdownMenuItem>
        ) : null}
        {canSuspend ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => onSuspend(row)}
          >
            Vô hiệu hóa
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => onDelete(row)}
        >
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

function renderCompanyCell(
  key: ColumnKey,
  row: CompanyListItem,
  onAssignArea: (row: CompanyListItem) => void,
  onReactivate: (row: CompanyListItem) => void,
  onRenew: (row: CompanyListItem) => void,
  onSuspend: (row: CompanyListItem) => void,
  onDelete: (row: CompanyListItem) => void
) {
  switch (key) {
    case 'name':
      return (
        <div className="min-w-0">
          <Link
            href={`/officer/companies/${row.id}`}
            className="block min-w-0 truncate text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline"
            title={row.name}
          >
            {row.name}
          </Link>
          {row.status === 'Expired' ? (
            <span className="mt-0.5 inline-flex items-center rounded bg-rose-100 px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide text-rose-800 uppercase">
              Cần gia hạn
            </span>
          ) : null}
        </div>
      );
    case 'contractNumber':
      return <span className="text-xs font-medium text-slate-700">{row.contractNumber}</span>;
    case 'contractType':
      return (
        <span className="text-sm text-slate-700">
          {CONTRACT_TYPE_LABEL[row.contractType] ?? row.contractType}
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
    case 'status':
      return <CompanyStatusBadge status={row.status} />;
    case 'actions':
      return (
        <CompanyRowActions
          row={row}
          onAssignArea={onAssignArea}
          onReactivate={onReactivate}
          onRenew={onRenew}
          onSuspend={onSuspend}
          onDelete={onDelete}
        />
      );
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

export function CompaniesPageClient() {
  const user = useAuthStore(s => s.user);
  const fullName = user?.name?.trim() || 'Người dùng';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toolbarStatus, setToolbarStatus] = useState<StatusFilter>('all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignCompany, setAssignCompany] = useState<CompanyListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyListItem | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<CompanyListItem | null>(null);
  const [renewTarget, setRenewTarget] = useState<CompanyListItem | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<CompanyListItem | null>(null);

  const deleteMutation = useDeleteCompany();
  const reactivateMutation = useReactivateCompany();

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, () => {
    setPage(1);
  });

  const handleAssignArea = (row: CompanyListItem) => {
    setAssignCompany(row);
    // Defer open so DropdownMenu can release body scroll/pointer lock first
    // (Radix: opening Dialog synchronously from DropdownMenuItem freezes the page).
    window.setTimeout(() => setAssignDialogOpen(true), 0);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    window.setTimeout(() => {
      setAssignCompany(null);
      // Safety: clear leftover RemoveScroll lock if Dialog/Dropdown raced
      if (document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
      }
    }, 0);
  };

  const handleDeleteRequest = (row: CompanyListItem) => {
    window.setTimeout(() => setDeleteTarget(row), 0);
  };

  const handleReactivateRequest = (row: CompanyListItem) => {
    window.setTimeout(() => setReactivateTarget(row), 0);
  };

  const handleRenewRequest = (row: CompanyListItem) => {
    window.setTimeout(() => setRenewTarget(row), 0);
  };

  const handleSuspendRequest = (row: CompanyListItem) => {
    window.setTimeout(() => setSuspendTarget(row), 0);
  };

  const handleCloseRenewDialog = () => {
    setRenewTarget(null);
    window.setTimeout(() => {
      if (document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
      }
    }, 0);
  };

  const handleCloseSuspendDialog = () => {
    setSuspendTarget(null);
    window.setTimeout(() => {
      if (document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
      }
    }, 0);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Đã xóa doanh nghiệp.');
        setDeleteTarget(null);
      },
      onError: err => {
        toast.error(getCompanyMutationError(err, 'Không thể xóa doanh nghiệp.'));
      },
    });
  };

  const handleConfirmReactivate = () => {
    if (!reactivateTarget) return;
    reactivateMutation.mutate(reactivateTarget.id, {
      onSuccess: () => {
        toast.success('Đã kích hoạt lại doanh nghiệp.');
        setReactivateTarget(null);
      },
      onError: err => {
        toast.error(getCompanyMutationError(err, 'Không thể kích hoạt doanh nghiệp.'));
      },
    });
  };

  const handleToolbarStatusChange = (status: StatusFilter) => {
    setToolbarStatus(status);
    setPage(1);
  };

  const listParams = useMemo(
    () => ({
      page,
      pageSize: COMPANIES_PAGE_SIZE,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(toolbarStatus !== 'all' ? { status: toolbarStatus } : {}),
    }),
    [page, debouncedSearch, toolbarStatus]
  );

  const { data, isPending, isFetching, isError, error, refetch } = useCompaniesList(listParams);

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  if (!canAccessCompanies(user?.systemRole)) {
    return <CompaniesAccessDenied homeHref={getDefaultOfficerHomePath(user?.systemRole)} />;
  }

  return (
    <>
      <header className="mb-6 shrink-0">
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
          <TypewriterEffectSmooth
            words={[
              { text: 'Welcome', className: 'font-normal text-slate-500' },
              { text: 'back,', className: 'font-normal text-slate-500' },
              {
                text: fullName,
                className: 'font-medium text-slate-800 dark:text-slate-100',
              },
            ]}
            className="mt-1 my-0"
            textClassName="text-sm font-normal sm:text-sm md:text-sm lg:text-sm xl:text-sm"
            cursorClassName="h-3.5 w-0.5 bg-slate-400 sm:h-3.5 xl:h-3.5"
            hideCursorOnComplete
          />
        </div>

        {/* Layout: status pills trái; search (Gooey) | Create phải */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <StatusToolbarFilter value={toolbarStatus} onChange={handleToolbarStatusChange} />

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
            <Separator orientation="vertical" className="mx-0.5 h-6 shrink-0 bg-slate-400" />
            <MovingBorderButton
              as={Link}
              href="/officer/companies/new"
              borderRadius="0.5rem"
              duration={2500}
              containerClassName="h-8 w-auto shrink-0"
              borderClassName="bg-[radial-gradient(var(--color-brand)_40%,transparent_60%)]"
              className="gap-1.5 border-neutral-200 bg-white px-3 text-[0.8125rem] font-medium text-brand hover:bg-slate-50"
            >
              <Plus className="size-3.5" aria-hidden />
              Thêm
            </MovingBorderButton>
          </div>
        </div>
      </header>

      <CompanyAssignAreaDialog
        open={assignDialogOpen}
        assignCompany={assignCompany}
        onClose={handleCloseAssignDialog}
        onAssigned={() => void refetch()}
      />

      <CompanyRenewContractDialog
        open={renewTarget != null}
        company={renewTarget}
        onClose={handleCloseRenewDialog}
        onRenewed={() => void refetch()}
      />

      <CompanySuspendDialog
        open={suspendTarget != null}
        company={suspendTarget}
        onClose={handleCloseSuspendDialog}
        onSuspended={() => void refetch()}
      />

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={open => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-xl">
          <AlertDialogHeader className="space-y-3 p-6 pb-4 text-left">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100"
                aria-hidden
              >
                <Trash2 className="size-5" />
              </div>
              <AlertDialogTitle className="text-left text-lg leading-snug">
                Xóa doanh nghiệp?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left text-sm leading-relaxed">
              Doanh nghiệp sẽ bị ẩn khỏi danh sách đang hoạt động. Thao tác này không xóa vĩnh viễn
              dữ liệu hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 px-6 pb-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
              <p
                className="truncate text-sm font-semibold text-slate-900"
                title={deleteTarget?.name}
              >
                {deleteTarget?.name}
              </p>
              <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                {deleteTarget?.contractNumber ? (
                  <div className="flex min-w-0 gap-1">
                    <dt className="shrink-0">Số HĐ</dt>
                    <dd className="truncate font-medium text-slate-700">
                      {deleteTarget.contractNumber}
                    </dd>
                  </div>
                ) : null}
                {deleteTarget?.taxCode ? (
                  <div className="flex min-w-0 gap-1">
                    <dt className="shrink-0">MST</dt>
                    <dd className="truncate font-medium text-slate-700">{deleteTarget.taxCode}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <p className="text-xs leading-relaxed text-slate-500">
              Liên kết lịch sử với báo cáo và hợp đồng vẫn được giữ lại.
            </p>
          </div>

          <AlertDialogFooter className="border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:justify-end">
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="mt-0 border-slate-200 bg-white"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: 'destructive' }), 'gap-1.5')}
              disabled={deleteMutation.isPending}
              onClick={e => {
                e.preventDefault();
                handleConfirmDelete();
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Đang xóa…
                </>
              ) : (
                'Xóa doanh nghiệp'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={reactivateTarget != null}
        onOpenChange={open => {
          if (!open && !reactivateMutation.isPending) setReactivateTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-xl">
          <AlertDialogHeader className="space-y-3 p-6 pb-4 text-left">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                aria-hidden
              >
                <RotateCcw className="size-5" />
              </div>
              <AlertDialogTitle className="text-left text-lg leading-snug">
                Kích hoạt lại doanh nghiệp?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left text-sm leading-relaxed">
              Trạng thái sẽ chuyển từ Tạm ngưng sang Đang hoạt động. Doanh nghiệp có thể nhận task
              mới.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 px-6 pb-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
              <p
                className="truncate text-sm font-semibold text-slate-900"
                title={reactivateTarget?.name}
              >
                {reactivateTarget?.name}
              </p>
              <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                {reactivateTarget?.contractNumber ? (
                  <div className="flex min-w-0 gap-1">
                    <dt className="shrink-0">Số HĐ</dt>
                    <dd className="truncate font-medium text-slate-700">
                      {reactivateTarget.contractNumber}
                    </dd>
                  </div>
                ) : null}
                {reactivateTarget?.taxCode ? (
                  <div className="flex min-w-0 gap-1">
                    <dt className="shrink-0">MST</dt>
                    <dd className="truncate font-medium text-slate-700">
                      {reactivateTarget.taxCode}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>

          <AlertDialogFooter className="border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:justify-end">
            <AlertDialogCancel
              disabled={reactivateMutation.isPending}
              className="mt-0 border-slate-200 bg-white"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                buttonVariants({ variant: 'default' }),
                'gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500'
              )}
              disabled={reactivateMutation.isPending}
              onClick={e => {
                e.preventDefault();
                handleConfirmReactivate();
              }}
            >
              {reactivateMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Đang kích hoạt…
                </>
              ) : (
                'Xác nhận kích hoạt'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="-mx-6 flex flex-1 flex-col overflow-hidden bg-white">
        {/* API loading chỉ gắn table: pending = spinner body; refetch + cache = overlay */}
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
                    <Loader2
                      className="mx-auto size-6 animate-spin text-slate-400"
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
                          {renderCompanyCell(
                            col.key,
                            row,
                            handleAssignArea,
                            handleReactivateRequest,
                            handleRenewRequest,
                            handleSuspendRequest,
                            handleDeleteRequest
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {isFetching && !isPending && !isError ? (
            <div
              className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-white/55 pt-28"
              aria-busy
              aria-live="polite"
            >
              <Loader2 className="size-6 animate-spin text-slate-400" aria-label="Đang cập nhật" />
            </div>
          ) : null}
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
              {pagination.totalItems.toLocaleString('vi-VN')} rows
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
