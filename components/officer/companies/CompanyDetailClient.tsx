'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCompanyDetail, useDeleteCompany } from '@/hooks/useCompany';
import type { CompanyDetail, CompanyStatus } from '@/lib/api/models/company';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { canAccessCompanies } from '@/lib/constants/officerRoles';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import { getCompanyMutationError } from '@/utils/companyErrors';

const HCM_MAP_QUERY = '10.8231,106.6297';

const STATUS_CONFIG: Record<string, { dot: string; label: string; badge: string }> = {
  PendingActivation: {
    dot: 'bg-amber-400',
    label: 'Chờ kích hoạt',
    badge: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  Active: {
    dot: 'bg-emerald-500',
    label: 'Đang hoạt động',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  Suspended: {
    dot: 'bg-orange-400',
    label: 'Tạm ngưng',
    badge: 'border-orange-200 bg-orange-50 text-orange-800',
  },
  Expired: {
    dot: 'bg-slate-300',
    label: 'Hết hạn',
    badge: 'border-slate-200 bg-slate-50 text-slate-600',
  },
};

const CONTRACT_TYPE_LABEL: Record<string, string> = {
  Subsidiary: 'Công ty con (Subsidiary)',
  Bidding: 'Đấu thầu (Bidding)',
};

function formatViDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatViDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} - ${time}`;
}

function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    dot: 'bg-slate-300',
    label: status,
    badge: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', config.badge)}>
      <span className={cn('inline-block size-2 shrink-0 rounded-full', config.dot)} aria-hidden />
      {config.label}
    </Badge>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-2.5 last:border-b-0">
      <dt className="text-xs font-semibold text-slate-800">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-600">{children}</dd>
    </div>
  );
}

function ContactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-sm text-slate-600">{value}</p>
    </div>
  );
}

/** Card kiểu directory — header xanh, nội dung trắng (theo layout ảnh mẫu). */
function DirectoryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="bg-emerald-600 px-4 py-2.5">
        <h2 className="text-xs font-bold tracking-[0.12em] text-white uppercase">{title}</h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function CompanyMapBanner({ company }: { company: CompanyDetail }) {
  const mapQuery = company.address.trim()
    ? encodeURIComponent(company.address.trim())
    : HCM_MAP_QUERY;
  const mapsHref = company.address.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${mapQuery}`
    : `https://www.google.com/maps?q=${HCM_MAP_QUERY}`;

  return (
    <div className="relative overflow-hidden rounded-sm border border-slate-200 bg-slate-100 shadow-sm">
      <iframe
        title={`Bản đồ — ${company.name}`}
        width="100%"
        height="280"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://maps.google.com/maps?q=${mapQuery}&z=13&t=m&output=embed`}
        className="block w-full"
      />
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-medium text-emerald-800 shadow-sm ring-1 ring-slate-200 hover:bg-white"
      >
        <MapPin className="size-3.5" aria-hidden />
        Mở Google Maps
      </a>
    </div>
  );
}

function CompanyDetailBody({ company }: { company: CompanyDetail }) {
  const contractLabel = CONTRACT_TYPE_LABEL[company.contractType] ?? company.contractType;

  return (
    <div className="space-y-5">
      <CompanyMapBanner company={company} />

      <div className="grid gap-5 lg:grid-cols-[minmax(220px,28%)_1fr]">
        {/* ── Sidebar trái ── */}
        <aside className="space-y-6">
          <div>
            <h3 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-emerald-800 uppercase">
              Thông tin chung
            </h3>
            <dl className="rounded-sm border border-slate-200 bg-white px-3 shadow-sm">
              <InfoRow label="Mã doanh nghiệp">
                <span className="text-xs break-all text-slate-700">{company.id}</span>
              </InfoRow>
              <InfoRow label="Mã số thuế">
                <span>{company.taxCode}</span>
              </InfoRow>
              <InfoRow label="Trạng thái">
                <CompanyStatusBadge status={company.status} />
              </InfoRow>
              <InfoRow label="Số nhân sự">{company.staffCount}</InfoRow>
              <InfoRow label="Sở TNMT">{company.departmentName}</InfoRow>
              <InfoRow label="Mã Sở TNMT">
                <span className="text-xs break-all">{company.departmentId}</span>
              </InfoRow>
              <InfoRow label="Ngày tạo">{formatViDateTime(company.createdAt)}</InfoRow>
              <InfoRow label="Ngày kích hoạt">{formatViDate(company.activatedAt)}</InfoRow>
            </dl>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-emerald-800 uppercase">
              Địa bàn phụ trách
            </h3>
            {company.serviceAreas.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa gán phường/xã.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {company.serviceAreas.map(area => (
                  <li key={area.id}>
                    <Badge
                      variant="secondary"
                      className="rounded-sm border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
                    >
                      {area.wardName}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Nội dung chính phải ── */}
        <div className="min-w-0 space-y-5">
          <DirectoryCard title="Thông tin liên hệ">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <ContactRow
                  label="Điện thoại"
                  value={
                    <a
                      href={`tel:${company.phone}`}
                      className="text-emerald-700 hover:text-emerald-900 hover:underline"
                    >
                      {company.phone}
                    </a>
                  }
                />
                <ContactRow
                  label="Email"
                  value={
                    <a
                      href={`mailto:${company.email}`}
                      className="break-all text-emerald-700 hover:text-emerald-900 hover:underline"
                      rel="noopener noreferrer"
                    >
                      {company.email}
                    </a>
                  }
                />
                <ContactRow label="Tên doanh nghiệp" value={company.name} />
              </div>
              <div className="space-y-4">
                <ContactRow label="Địa chỉ" value={company.address || '—'} />
                <ContactRow label="Sở TNMT quản lý" value={company.departmentName} />
                <ContactRow label="Số địa bàn" value={`${company.serviceAreas.length} phường/xã`} />
              </div>
            </div>
          </DirectoryCard>

          <DirectoryCard title="Hợp đồng & vận hành">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <ContactRow label="Số hợp đồng" value={<span>{company.contractNumber}</span>} />
                <ContactRow label="Loại hợp đồng" value={contractLabel} />
                <ContactRow
                  label="Trạng thái hợp đồng"
                  value={<CompanyStatusBadge status={company.status} />}
                />
              </div>
              <div className="space-y-4">
                <ContactRow label="Ngày bắt đầu" value={formatViDate(company.contractStartDate)} />
                <ContactRow label="Ngày kết thúc" value={formatViDate(company.contractEndDate)} />
                <ContactRow label="Nhân sự hiện tại" value={`${company.staffCount} người`} />
              </div>
            </div>
            <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
              Doanh nghiệp DVMT{' '}
              <strong className="font-semibold text-slate-800">{company.name}</strong> thuộc{' '}
              {company.departmentName},
              {company.contractEndDate
                ? `, hiệu lực đến ${formatViDate(company.contractEndDate)}.`
                : ', không giới hạn ngày kết thúc.'}{' '}
              {company.serviceAreas.length > 0
                ? `Đang phụ trách ${company.serviceAreas.length} địa bàn cấp phường/xã.`
                : 'Chưa được gán địa bàn vận hành.'}
            </p>
          </DirectoryCard>

          <DirectoryCard title="Chi tiết địa bàn vận hành">
            {company.serviceAreas.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu địa bàn.</p>
            ) : (
              <div className="overflow-x-auto rounded-sm border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 bg-slate-50 px-3 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                        Phường / Xã
                      </TableHead>
                      <TableHead className="h-9 bg-slate-50 px-3 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                        Mã phường/xã
                      </TableHead>
                      <TableHead className="h-9 bg-slate-50 px-3 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                        Mã tỉnh
                      </TableHead>
                      <TableHead className="hidden h-9 bg-slate-50 px-3 text-[11px] font-semibold tracking-wide text-slate-500 uppercase md:table-cell">
                        ID
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.serviceAreas.map(area => (
                      <TableRow key={area.id} className="border-slate-100">
                        <TableCell className="px-3 py-2.5 text-sm font-medium text-slate-800">
                          {area.wardName}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-xs text-slate-600">
                          {area.wardCode}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-xs text-slate-600">
                          {area.provinceCode}
                        </TableCell>
                        <TableCell className="hidden px-3 py-2.5 text-[10px] text-slate-400 md:table-cell">
                          {area.id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DirectoryCard>
        </div>
      </div>

      <p className="text-right text-xs text-slate-400">
        Cập nhật lần cuối: {formatViDateTime(company.createdAt)}
      </p>
    </div>
  );
}

export function CompanyDetailClient({ companyId }: { companyId: string }) {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { data, isPending, isError, error, refetch } = useCompanyDetail(
    companyId,
    canAccessCompanies(user?.systemRole)
  );
  const deleteMutation = useDeleteCompany();

  const handleDeactivate = () => {
    if (!data) return;
    if (!window.confirm(`Vô hiệu hóa doanh nghiệp "${data.name}"?`)) return;
    deleteMutation.mutate(companyId, {
      onSuccess: () => {
        toast.success('Đã vô hiệu hóa doanh nghiệp.');
        router.push('/officer/companies');
      },
      onError: err => {
        toast.error(getCompanyMutationError(err, 'Không thể vô hiệu hóa doanh nghiệp.'));
      },
    });
  };

  if (!canAccessCompanies(user?.systemRole)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Không có quyền truy cập</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Chi tiết doanh nghiệp chỉ dành cho cán bộ Sở TNMT (DEO).
        </p>
        <Button asChild className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500">
          <Link href={getDefaultOfficerHomePath(user?.systemRole)}>Về trang chính</Link>
        </Button>
      </div>
    );
  }

  const contractSubtitle = data
    ? (CONTRACT_TYPE_LABEL[data.contractType] ?? data.contractType)
    : '';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header kiểu business directory */}
      <header className="mb-5 shrink-0 border-b border-slate-200 pb-4">
        <div className="mb-3 flex items-center justify-end gap-2">
          {data && data.status !== 'Suspended' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-destructive/40 text-destructive hover:bg-destructive/5"
              disabled={deleteMutation.isPending}
              onClick={handleDeactivate}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : null}
              Vô hiệu hóa
            </Button>
          ) : null}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-emerald-800 hover:text-emerald-950"
          >
            <Link href="/officer/companies">
              <ArrowLeft className="size-3.5" aria-hidden />
              Về danh sách
            </Link>
          </Button>
        </div>

        {isPending ? (
          <div className="space-y-2">
            <div className="h-9 w-2/3 max-w-lg animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 max-w-md animate-pulse rounded bg-slate-50" />
          </div>
        ) : data ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {data.name}
              </h1>
              <CompanyStatusBadge status={data.status} />
            </div>
            <p className="text-sm text-slate-500">
              {contractSubtitle}
              {data.departmentName ? ` · ${data.departmentName}` : null}
            </p>
          </div>
        ) : (
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Chi tiết doanh nghiệp
          </h1>
        )}
      </header>

      {isPending ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-slate-400" aria-label="Đang tải" />
        </div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
          <p className="text-sm text-destructive">
            {(error as Error)?.message ?? 'Không tải được chi tiết doanh nghiệp.'}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      ) : data ? (
        <CompanyDetailBody company={data} />
      ) : null}
    </div>
  );
}
