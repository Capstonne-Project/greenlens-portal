'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useUpdateAdminReportStatus } from '@/hooks/useAdminReports';
import {
  REPORT_STATUSES,
  normalizeReportStatus,
  reportStatusLabelVi,
  type ReportStatus,
} from '@/lib/constants/reportStatus';
import { getAdminReportMutationError } from '@/utils/adminReportErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

function createStatusSchema(currentStatus: string) {
  const normalizedCurrent = normalizeReportStatus(currentStatus);

  return z
    .object({
      newStatus: z.enum(REPORT_STATUSES, { message: 'Vui lòng chọn trạng thái mới' }),
      reason: z
        .string()
        .trim()
        .min(10, 'Lý do tối thiểu 10 ký tự')
        .max(500, 'Lý do tối đa 500 ký tự'),
    })
    .refine(data => data.newStatus !== normalizedCurrent, {
      message: 'Trạng thái mới phải khác trạng thái hiện tại',
      path: ['newStatus'],
    });
}

type StatusFormValues = z.infer<ReturnType<typeof createStatusSchema>>;

interface AdminReportStatusDialogProps {
  reportId: string | null;
  reportCode?: string;
  currentStatus: ReportStatus | string;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function AdminReportStatusDialog({
  reportId,
  reportCode,
  currentStatus,
  open,
  onClose,
  onUpdated,
}: AdminReportStatusDialogProps) {
  const isOpen = open && Boolean(reportId);

  return (
    <OfficeDialogShell
      open={isOpen}
      title="Đổi trạng thái báo cáo"
      titleId="admin-report-status-title"
      onClose={onClose}
    >
      {isOpen && reportId ? (
        <StatusForm
          key={`${reportId}-${currentStatus}`}
          reportId={reportId}
          reportCode={reportCode}
          currentStatus={currentStatus}
          onClose={onClose}
          onUpdated={onUpdated}
        />
      ) : null}
    </OfficeDialogShell>
  );
}

function StatusForm({
  reportId,
  reportCode,
  currentStatus,
  onClose,
  onUpdated,
}: {
  reportId: string;
  reportCode?: string;
  currentStatus: ReportStatus | string;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const updateStatus = useUpdateAdminReportStatus();
  const normalizedCurrent = normalizeReportStatus(String(currentStatus));
  const schema = useMemo(() => createStatusSchema(currentStatus), [currentStatus]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StatusFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newStatus: normalizedCurrent, reason: '' },
  });

  useEffect(() => {
    reset({ newStatus: normalizedCurrent, reason: '' });
  }, [reportId, normalizedCurrent, reset]);

  const close = () => {
    reset({ newStatus: normalizedCurrent, reason: '' });
    onClose();
  };

  const onSubmit = (values: StatusFormValues) => {
    updateStatus.mutate(
      {
        id: reportId,
        body: { newStatus: values.newStatus, reason: values.reason },
      },
      {
        onSuccess: env => {
          toast.success(env.message || 'Đã cập nhật trạng thái báo cáo.');
          close();
          onUpdated?.();
        },
        onError: err =>
          toast.error(getAdminReportMutationError(err, 'Không thể cập nhật trạng thái báo cáo.')),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
        <RefreshCw className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Ghi đè trạng thái báo cáo{reportCode ? ` ${reportCode}` : ''} (admin override). Hiện tại:{' '}
          <span className="font-medium text-foreground">
            {reportStatusLabelVi(normalizedCurrent)}
          </span>
          . Cần chọn trạng thái khác và ghi lý do.
        </p>
      </div>

      <div>
        <label htmlFor="admin-report-new-status" className="mb-1.5 block text-sm font-medium">
          Trạng thái mới <span className="text-destructive">*</span>
        </label>
        <select
          id="admin-report-new-status"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          disabled={updateStatus.isPending}
          {...register('newStatus')}
        >
          {REPORT_STATUSES.map(status => (
            <option key={status} value={status}>
              {reportStatusLabelVi(status)}
              {status === normalizedCurrent ? ' (hiện tại)' : ''}
            </option>
          ))}
        </select>
        {errors.newStatus ? (
          <p className="mt-1 text-xs text-destructive">{errors.newStatus.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="admin-report-status-reason" className="mb-1.5 block text-sm font-medium">
          Lý do <span className="text-destructive">*</span>
        </label>
        <textarea
          id="admin-report-status-reason"
          rows={4}
          placeholder="Ví dụ: Sửa sai trạng thái sau khi kiểm tra hồ sơ (tối thiểu 10 ký tự)."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          {...register('reason')}
        />
        {errors.reason ? (
          <p className="mt-1 text-xs text-destructive">{errors.reason.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={close}
          className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={updateStatus.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
        >
          {updateStatus.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Xác nhận đổi
        </button>
      </div>
    </form>
  );
}
