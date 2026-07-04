'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useDepartmentDetail } from '@/hooks/useDepartments';
import type { DepartmentListItem } from '@/lib/api/models/department';
import { Loader2, Mail, Search, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

interface DepartmentDetailDialogProps {
  open: boolean;
  departmentId: string | null;
  onClose: () => void;
  onAssignOfficer?: (dept: DepartmentListItem) => void;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function DepartmentDetailDialog({
  open,
  departmentId,
  onClose,
  onAssignOfficer,
}: DepartmentDetailDialogProps) {
  const { data, isPending, isError, refetch } = useDepartmentDetail(open ? departmentId : null);
  const [officeQ, setOfficeQ] = useState('');

  const filteredOffices = useMemo(() => {
    const offices = data?.offices ?? [];
    const q = officeQ.trim().toLowerCase();
    if (!q) return offices;
    return offices.filter(
      o =>
        o.name.toLowerCase().includes(q) ||
        o.wardName.toLowerCase().includes(q) ||
        o.wardCode.includes(q) ||
        (o.officerName?.toLowerCase().includes(q) ?? false)
    );
  }, [data?.offices, officeQ]);

  const hasDeo = Boolean(data?.officerName || data?.deo);

  return (
    <OfficeDialogShell
      open={open}
      title="Chi tiết Sở TNMT"
      titleId="department-detail-title"
      onClose={() => {
        setOfficeQ('');
        onClose();
      }}
      size="xl"
    >
      {isPending && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {isError && (
        <div className="py-8 text-center">
          <p className="text-sm text-destructive">Không tải được chi tiết.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
          >
            Thử lại
          </button>
        </div>
      )}
      {data && (
        <div className="space-y-6">
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">{data.name}</p>
            <p className="mt-1 text-muted-foreground">
              {data.provinceName} · mã tỉnh {data.provinceCode}
            </p>
            <p className="mt-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  data.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {data.isActive ? 'Đang hoạt động' : 'Đã vô hiệu'}
              </span>
              <span className="ml-3 text-xs text-muted-foreground">
                Tạo {formatDate(data.createdAt)}
                {data.updatedAt ? ` · cập nhật ${formatDate(data.updatedAt)}` : null}
              </span>
            </p>
          </div>

          <div className="rounded-lg border border-border px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold">DEO điều phối (cấp tỉnh)</h3>
                {hasDeo ? (
                  <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                    <p>
                      <UserRound className="mr-1 inline size-4 text-violet-700" aria-hidden />
                      <strong className="text-foreground">
                        {data.deo?.fullName ?? data.officerName}
                      </strong>
                    </p>
                    {data.deo?.email ? (
                      <p className="flex items-center gap-1.5 pl-5">
                        <Mail className="size-3.5 shrink-0" aria-hidden />
                        <a
                          href={`mailto:${data.deo.email}`}
                          className="text-emerald-800 hover:underline"
                        >
                          {data.deo.email}
                        </a>
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chưa gán DEO — báo cáo trong tỉnh chưa có người điều phối cấp Sở.
                  </p>
                )}
              </div>
              {onAssignOfficer ? (
                <button
                  type="button"
                  onClick={() =>
                    onAssignOfficer({
                      id: data.id,
                      name: data.name,
                      provinceCode: data.provinceCode,
                      provinceName: data.provinceName,
                      isActive: data.isActive,
                      officeCount: data.offices.length,
                      officerId: data.officerId,
                      officerName: data.officerName,
                      createdAt: data.createdAt,
                    })
                  }
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  <UserRound className="size-4" />
                  {hasDeo ? 'Đổi DEO' : 'Gán DEO'}
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold">
                Văn phòng trực thuộc ({data.offices.length})
              </h3>
              {data.offices.length > 8 ? (
                <label className="relative block w-full sm:max-w-xs">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={officeQ}
                    onChange={e => setOfficeQ(e.target.value)}
                    placeholder="Lọc văn phòng, phường/xã, LEO…"
                    className="h-9 w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600/40 focus:ring-2 focus:ring-emerald-500/15"
                  />
                </label>
              ) : null}
            </div>

            {data.offices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có văn phòng.{' '}
                <Link
                  href="/admin/offices"
                  className="font-medium text-emerald-700 hover:underline"
                >
                  Tạo tại Văn phòng địa phương
                </Link>
              </p>
            ) : filteredOffices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có văn phòng khớp từ khóa.</p>
            ) : (
              <div className="max-h-[min(52vh,420px)] overflow-auto rounded-lg border border-border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Văn phòng</th>
                      <th className="px-4 py-2.5 font-medium">Phường/xã</th>
                      <th className="px-4 py-2.5 font-medium">LEO</th>
                      <th className="px-4 py-2.5 font-medium">Đội</th>
                      <th className="px-4 py-2.5 font-medium">Onboard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOffices.map(office => (
                      <tr key={office.id} className="border-b border-border/40 last:border-0">
                        <td className="px-4 py-2.5 font-medium">{office.name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {office.wardName}
                          <span className="ml-1 text-xs opacity-70">({office.wardCode})</span>
                        </td>
                        <td className="px-4 py-2.5">{office.officerName ?? '—'}</td>
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                          {office.teamCount}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              office.isOnboarded
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {office.isOnboarded ? 'Có' : 'Chưa'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {officeQ.trim() && filteredOffices.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Hiển thị {filteredOffices.length} / {data.offices.length} văn phòng
              </p>
            ) : null}
          </div>
        </div>
      )}
    </OfficeDialogShell>
  );
}
