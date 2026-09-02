'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMyWardCompanyDetail } from '@/hooks/useCompany';
import type { CompanyStatus, MyWardCompanyDetail } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import { ArrowLeft, Building2, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

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
    dot: 'bg-rose-500',
    label: 'Hết hạn',
    badge: 'border-rose-200 bg-rose-50 text-rose-800',
  },
};

const CONTRACT_TYPE_LABEL: Record<string, string> = {
  Subsidiary: 'Công ty trực thuộc',
  Bidding: 'Công ty đấu thầu',
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
      <div className="text-sm text-slate-600">{value}</div>
    </div>
  );
}

function DirectoryCard({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 bg-emerald-600 px-4 py-2.5">
        <h2 className="text-xs font-bold tracking-[0.12em] text-white uppercase">{title}</h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function CompanyMapBanner({ company }: { company: MyWardCompanyDetail }) {
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

function MyWardCompanyDetailBody({ company }: { company: MyWardCompanyDetail }) {
  const contractLabel = CONTRACT_TYPE_LABEL[company.contractType] ?? company.contractType;
  const serviceAreas = company.allServiceAreas;

  return (
    <div className="space-y-5">
      <CompanyMapBanner company={company} />

      <div className="grid gap-5 lg:grid-cols-[minmax(220px,28%)_1fr]">
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
              <InfoRow label="Số đội">{company.teamCount}</InfoRow>
              <InfoRow label="Báo cáo đang xử lý">{company.activeReportCount}</InfoRow>
              <InfoRow label="Báo cáo đã hoàn thành">{company.completedReportCount}</InfoRow>
              <InfoRow label="Sở TNMT">{company.departmentName}</InfoRow>
              <InfoRow label="Mã Sở TNMT">
                <span className="text-xs break-all">{company.departmentId}</span>
              </InfoRow>
              <InfoRow label="Văn phòng địa phương">{company.localOfficeName || '—'}</InfoRow>
              <InfoRow label="Mã văn phòng">
                <span className="text-xs break-all">{company.localOfficeId}</span>
              </InfoRow>
              <InfoRow label="Phường/xã phụ trách">{company.wardName || '—'}</InfoRow>
              <InfoRow label="Mã phường/xã">{company.wardCode || '—'}</InfoRow>
              <InfoRow label="Ngày tạo">{formatViDateTime(company.createdAt)}</InfoRow>
              <InfoRow label="Ngày kích hoạt">{formatViDate(company.activatedAt)}</InfoRow>
            </dl>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-emerald-800 uppercase">
              Địa bàn phụ trách
            </h3>
            {serviceAreas.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa gán phường/xã.</p>
            ) : (
              <div className="space-y-2.5">
                <p
                  className="flex items-start gap-2 text-sm font-medium leading-snug text-slate-800"
                  title={company.name}
                >
                  <Building2
                    className="mt-0.5 size-4 shrink-0 text-emerald-700"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span className="min-w-0">{company.name}</span>
                </p>
                <ul className="flex flex-wrap gap-2">
                  {serviceAreas.map(area => {
                    const isWardScope = company.wardServiceArea?.id === area.id;
                    return (
                      <li key={area.id}>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'rounded-sm border px-2.5 py-1 text-xs font-medium',
                            isWardScope
                              ? 'border-emerald-400 bg-emerald-100 text-emerald-950 ring-1 ring-emerald-300'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                          )}
                        >
                          {area.wardName}
                          {isWardScope ? ' · Phường bạn' : null}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </aside>

        <div className="space-y-5">
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
                <ContactRow label="Văn phòng địa phương" value={company.localOfficeName || '—'} />
                <ContactRow label="Phường/xã tại phạm vi LEO" value={company.wardName || '—'} />
                <ContactRow label="Số địa bàn" value={`${serviceAreas.length} phường/xã`} />
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
                <ContactRow label="Số đội" value={`${company.teamCount} đội`} />
              </div>
            </div>
            <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
              Doanh nghiệp DVMT{' '}
              <strong className="font-semibold text-slate-800">{company.name}</strong> thuộc{' '}
              {company.departmentName}
              {company.contractEndDate
                ? `, hiệu lực đến ${formatViDate(company.contractEndDate)}.`
                : ', không giới hạn ngày kết thúc.'}{' '}
              {serviceAreas.length > 0
                ? `Đang phụ trách ${serviceAreas.length} địa bàn cấp phường/xã`
                : 'Chưa được gán địa bàn vận hành'}
              {company.wardName ? `, trong đó phục vụ ${company.wardName} thuộc phạm vi của bạn.` : '.'}{' '}
              Hiện có {company.activeReportCount} báo cáo đang xử lý và{' '}
              {company.completedReportCount} báo cáo đã hoàn thành tại phường.
            </p>
          </DirectoryCard>

          <DirectoryCard title="Chi tiết địa bàn vận hành">
            {serviceAreas.length === 0 ? (
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
                    {serviceAreas.map(area => {
                      const isWardScope = company.wardServiceArea?.id === area.id;
                      return (
                        <TableRow
                          key={area.id}
                          className={cn('border-slate-100', isWardScope && 'bg-emerald-50/50')}
                        >
                          <TableCell className="px-3 py-2.5 text-sm font-medium text-slate-800">
                            {area.wardName}
                            {isWardScope ? (
                              <Badge
                                variant="outline"
                                className="ml-2 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800"
                              >
                                Phường bạn
                              </Badge>
                            ) : null}
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
                      );
                    })}
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

export function MyWardCompanyDetailClient({ companyId }: { companyId: string }) {
  const { data, isPending, isError, error, refetch } = useMyWardCompanyDetail(companyId);

  const contractSubtitle = data
    ? (CONTRACT_TYPE_LABEL[data.contractType] ?? data.contractType)
    : '';

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-8 pt-2 sm:px-6 lg:px-8">
      <header className="mb-5 shrink-0 border-b border-slate-200 pb-4">
        <div className="mb-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 gap-1.5 text-emerald-800 hover:text-emerald-950"
          >
            <Link href="/officer/my-companies">
              <ArrowLeft className="size-3.5" aria-hidden />
              Về danh sách
            </Link>
          </Button>
        </div>

        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-2/3 max-w-lg" />
            <Skeleton className="h-4 w-1/2 max-w-md" />
          </div>
        ) : data ? (
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {data.name}
                </h1>
                <CompanyStatusBadge status={data.status} />
              </div>
              <p className="text-sm text-slate-500">
                {contractSubtitle}
                {data.departmentName ? ` · ${data.departmentName}` : null}
                {data.wardName ? ` · ${data.wardName}` : null}
              </p>
            </div>
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
        <MyWardCompanyDetailBody company={data} />
      ) : null}
    </div>
  );
}
