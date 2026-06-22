'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, CircleHelp, Clock3, Columns3, Filter, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import {
  COMPANIES_MOCK,
  COMPANIES_MOCK_TOTAL,
  countryFlag,
  type CompanyRecord,
  type CompanyStatus,
} from '@/lib/constants/companiesMock';
import { canAccessCompanies } from '@/lib/constants/officerRoles';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { mapDataPanelClass } from '@/lib/map/mapShellStyles';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

type ColumnKey =
  | 'country'
  | 'name'
  | 'logo'
  | 'area'
  | 'businessType'
  | 'licenseCode'
  | 'foundedYear'
  | 'status'
  | 'actions';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'country', label: 'Quốc gia', className: 'w-[72px]' },
  { key: 'name', label: 'Tên doanh nghiệp', className: 'min-w-[220px]' },
  { key: 'logo', label: 'Logo', className: 'w-[88px]' },
  { key: 'area', label: 'Khu vực', className: 'min-w-[160px]' },
  { key: 'businessType', label: 'Loại hình', className: 'min-w-[140px]' },
  { key: 'licenseCode', label: 'Giấy phép', className: 'min-w-[130px]' },
  { key: 'foundedYear', label: 'Thành lập', className: 'w-[96px]' },
  { key: 'status', label: 'Trạng thái', className: 'w-[96px]' },
  { key: 'actions', label: '', className: 'w-[48px]' },
];

const DEFAULT_VISIBLE: Record<ColumnKey, boolean> = {
  country: true,
  name: true,
  logo: true,
  area: true,
  businessType: true,
  licenseCode: true,
  foundedYear: true,
  status: true,
  actions: true,
};

export function CompaniesPageClient() {
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE);
  const [timeDisplay, setTimeDisplay] = useState<'local' | 'utc'>('local');

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COMPANIES_MOCK;
    return COMPANIES_MOCK.filter(row => row.name.toLowerCase().includes(q));
  }, [search]);

  if (!canAccessCompanies(user?.systemRole)) {
    return <CompaniesAccessDenied homeHref={getDefaultOfficerHomePath(user?.systemRole)} />;
  }

  const visibleDefs = COLUMN_DEFS.filter(col => visibleColumns[col.key]);

  return (
    <div className={mapDataPanelClass()}>
      <header className="mb-3 shrink-0">
        <div className="mb-3 flex items-center gap-[0.35rem]">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Doanh nghiệp</h1>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.15rem] text-slate-500 hover:bg-slate-400/15 hover:text-slate-700"
            aria-label="Thông tin danh sách doanh nghiệp"
          >
            <CircleHelp className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-sky-700"
            >
              <Filter className="size-3.5 text-sky-600" aria-hidden />
              Thêm bộ lọc
              <ChevronDown className="size-3.5 opacity-60" aria-hidden />
            </Button>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm nhanh theo tên"
              className="h-8 max-w-xs border-slate-200 bg-white text-sm shadow-none"
              aria-label="Tìm nhanh theo tên doanh nghiệp"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent px-[0.35rem] py-1 text-[0.8125rem] font-medium text-sky-700 hover:underline"
              onClick={() => setSearch('')}
            >
              Xóa lọc
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Columns3 className="size-3.5" aria-hidden />
                  Cột
                  <ChevronDown className="size-3 opacity-60" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {COLUMN_DEFS.filter(c => c.key !== 'actions').map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={visibleColumns[col.key]}
                    onCheckedChange={checked =>
                      setVisibleColumns(prev => ({ ...prev, [col.key]: checked === true }))
                    }
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Clock3 className="size-3.5" aria-hidden />
                  {timeDisplay === 'local' ? 'Giờ địa phương' : 'UTC'}
                  <ChevronDown className="size-3 opacity-60" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTimeDisplay('local')}>
                  Giờ địa phương
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeDisplay('utc')}>UTC</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/4%)] [&_table]:border-collapse">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {visibleDefs.map(col => (
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
            {filteredRows.map(row => (
              <TableRow key={row.id} className="border-slate-100 hover:bg-sky-50/40">
                {visibleDefs.map(col => (
                  <TableCell key={col.key} className="px-3 py-2">
                    {renderCompanyCell(col.key, row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <footer className="mt-[0.65rem] flex shrink-0 flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>Tổng bản ghi đã lọc: {filteredRows.length.toLocaleString('vi-VN')}</span>
        <span>Tổng dòng hiển thị: {COMPANIES_MOCK.length.toLocaleString('vi-VN')}</span>
        <span className="text-slate-400">
          Tổng trên hệ thống: {COMPANIES_MOCK_TOTAL.toLocaleString('vi-VN')}
        </span>
      </footer>
    </div>
  );
}

function renderCompanyCell(key: ColumnKey, row: CompanyRecord) {
  switch (key) {
    case 'country':
      return (
        <span className="text-lg leading-none" title={row.countryCode}>
          {countryFlag(row.countryCode)}
        </span>
      );
    case 'name':
      return (
        <button
          type="button"
          className="text-left text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline"
        >
          {row.name}
        </button>
      );
    case 'logo':
      return <CompanyLogoBadge initials={row.logoInitials} />;
    case 'area':
      return <span className="text-sm text-slate-700">{row.area}</span>;
    case 'businessType':
      return <span className="text-sm text-slate-700">{row.businessType}</span>;
    case 'licenseCode':
      return <span className="font-mono text-xs text-slate-600">{row.licenseCode}</span>;
    case 'foundedYear':
      return <span className="text-sm text-slate-700">{row.foundedYear}</span>;
    case 'status':
      return <CompanyStatusIcon status={row.status} />;
    case 'actions':
      return (
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label={`Thao tác ${row.name}`}
        >
          <MoreVertical className="size-4" aria-hidden />
        </button>
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

function CompanyLogoBadge({ initials }: { initials: string }) {
  return (
    <span className="inline-flex size-10 items-center justify-center rounded border border-slate-200 bg-slate-100 text-[10px] font-bold tracking-wide text-slate-600">
      {initials}
    </span>
  );
}

function CompanyStatusIcon({ status }: { status: CompanyStatus }) {
  const styles: Record<CompanyStatus, string> = {
    active: 'bg-emerald-500',
    inactive: 'bg-slate-300',
    pending: 'bg-amber-400',
  };
  const labels: Record<CompanyStatus, string> = {
    active: 'Đang hoạt động',
    inactive: 'Ngừng hoạt động',
    pending: 'Chờ duyệt',
  };

  return (
    <span
      className={cn('inline-block size-3.5 rounded-full', styles[status])}
      title={labels[status]}
      aria-label={labels[status]}
    />
  );
}
