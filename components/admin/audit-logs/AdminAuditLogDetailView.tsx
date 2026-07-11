'use client';

import { AuditValuesDiff } from '@/components/admin/audit-logs/AuditValuesDiff';
import { useAuditLogDetail } from '@/hooks/useAuditLogs';
import { cn } from '@/lib/utils';
import {
  formatActorLabel,
  formatAuditDateTime,
  getAuditActionBadgeClass,
} from '@/utils/auditLogUi';
import { ArrowLeft, Database, Globe2, Loader2, Monitor, ScrollText, UserRound } from 'lucide-react';
import Link from 'next/link';

interface AdminAuditLogDetailViewProps {
  logId: string;
}

function MetaCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm', className)}>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        <Icon className="size-4" aria-hidden />
        {label}
      </div>
      <p className="break-words text-sm font-medium text-emerald-950">{value || '—'}</p>
    </div>
  );
}

export function AdminAuditLogDetailView({ logId }: AdminAuditLogDetailViewProps) {
  const detailQuery = useAuditLogDetail(logId);
  const { data } = detailQuery;

  if (detailQuery.isPending) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Đang tải chi tiết nhật ký…
      </div>
    );
  }

  if (detailQuery.isError) {
    const message =
      detailQuery.error instanceof Error
        ? detailQuery.error.message
        : 'Không tải được chi tiết nhật ký.';

    return (
      <div className="w-full min-w-0 space-y-4">
        <Link
          href="/admin/audit-logs"
          className="inline-flex items-center gap-2 text-sm text-emerald-800 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại nhật ký
        </Link>

        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-6 text-sm text-destructive">
          {message}{' '}
          <button type="button" className="underline" onClick={() => void detailQuery.refetch()}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full min-w-0 space-y-4">
        <Link
          href="/admin/audit-logs"
          className="inline-flex items-center gap-2 text-sm text-emerald-800 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại nhật ký
        </Link>

        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-10 text-center">
          <ScrollText className="mx-auto mb-3 size-8 text-emerald-700" aria-hidden />
          <p className="text-sm font-medium text-emerald-950">Không tìm thấy nhật ký.</p>
          <p className="mt-1 text-sm text-emerald-900/65">
            Bản ghi có thể không tồn tại hoặc bạn không có quyền xem.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <Link
        href="/admin/audit-logs"
        className="inline-flex items-center gap-2 text-sm text-emerald-800 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại nhật ký
      </Link>

      <header className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">{data.id}</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-emerald-950">
              Chi tiết nhật ký kiểm toán
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Bản ghi bất biến, chỉ đọc để phục vụ truy vết và đối soát hệ thống.
            </p>
          </div>
          <span
            className={cn(
              'inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold',
              getAuditActionBadgeClass(data.action)
            )}
          >
            {data.action}
          </span>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MetaCard label="Người thực hiện" value={formatActorLabel(data)} icon={UserRound} />
        <MetaCard
          label="Entity"
          value={`${data.entityType}${data.entityId ? ` · ${data.entityId}` : ''}`}
          icon={Database}
        />
        <MetaCard label="Thời gian" value={formatAuditDateTime(data.createdAt)} icon={ScrollText} />
        <MetaCard label="IP" value={data.ipAddress ?? '—'} icon={Globe2} />
        <MetaCard
          label="User agent"
          value={data.userAgent ?? '—'}
          icon={Monitor}
          className="md:col-span-2"
        />
        <MetaCard label="Actor ID" value={data.actorId ?? 'Hệ thống'} icon={UserRound} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-emerald-50/50 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-emerald-950">Thay đổi dữ liệu</h2>
          <p className="mt-1 text-xs text-emerald-900/65">
            So sánh giá trị trước và sau khi hành động được ghi nhận.
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <AuditValuesDiff oldValues={data.oldValues} newValues={data.newValues} />
        </div>
      </section>
    </div>
  );
}
