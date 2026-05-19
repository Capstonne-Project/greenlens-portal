'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useDepartmentDetail } from '@/hooks/useDepartments';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface DepartmentDetailDialogProps {
  open: boolean;
  departmentId: string | null;
  onClose: () => void;
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
}: DepartmentDetailDialogProps) {
  const { data, isPending, isError } = useDepartmentDetail(open ? departmentId : null);

  return (
    <OfficeDialogShell
      open={open}
      title="Chi tiết ủy ban (Sở)"
      titleId="department-detail-title"
      onClose={onClose}
      size="xl"
    >
      {isPending && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {isError && (
        <p className="py-8 text-center text-sm text-destructive">Không tải được chi tiết.</p>
      )}
      {data && (
        <div className="space-y-6">
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">{data.name}</p>
            <p className="mt-1 text-muted-foreground">
              {data.provinceName} · mã {data.provinceCode}
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
              </span>
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Văn phòng trực thuộc ({data.offices.length})
            </h3>
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
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Văn phòng</th>
                      <th className="px-4 py-2.5 font-medium">Phường/xã</th>
                      <th className="px-4 py-2.5 font-medium">LEO</th>
                      <th className="px-4 py-2.5 font-medium">Onboard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.offices.map(office => (
                      <tr key={office.id} className="border-b border-border/40 last:border-0">
                        <td className="px-4 py-2.5 font-medium">{office.name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {office.wardName}
                          <span className="ml-1 text-xs opacity-70">({office.wardCode})</span>
                        </td>
                        <td className="px-4 py-2.5">{office.officerName ?? '—'}</td>
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
          </div>
        </div>
      )}
    </OfficeDialogShell>
  );
}
