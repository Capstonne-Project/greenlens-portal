'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { ValidatedTextarea } from '@/components/common/ValidatedField';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import { useUpdateAdminReportStatus } from '@/hooks/useAdminReports';
import {
  getAllowedReportStatusTargets,
  isAllowedReportStatusTransition,
  normalizeReportStatus,
  reportStatusLabelVi,
  type ReportStatus,
} from '@/lib/constants/reportStatus';
import { getAdminReportMutationError } from '@/utils/adminReportErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCw } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

function createStatusSchema(currentStatus: string, allowedTargets: ReportStatus[]) {
  const normalizedCurrent = normalizeReportStatus(currentStatus);

  const reasonSchema = z
    .string()
    .trim()
    .min(10, 'Lý do tối thiểu 10 ký tự')
    .max(500, 'Lý do tối đa 500 ký tự');

  if (allowedTargets.length === 0) {
    return z.object({
      newStatus: z.literal(normalizedCurrent),
      reason: reasonSchema,
    });
  }

  const statusEnum = z.enum(allowedTargets as [ReportStatus, ...ReportStatus[]]);

  return z
    .object({
      newStatus: statusEnum,
      reason: reasonSchema,
    })
    .refine(data => data.newStatus !== normalizedCurrent, {
      message: 'Trạng thái mới phải khác trạng thái hiện tại',
      path: ['newStatus'],
    })
    .superRefine((data, ctx) => {
      if (!isAllowedReportStatusTransition(normalizedCurrent, data.newStatus)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Chuyển trạng thái không hợp lệ theo BR-REP-020',
          path: ['newStatus'],
        });
      }
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
  const allowedTargets = useMemo(
    () => getAllowedReportStatusTargets(normalizedCurrent),
    [normalizedCurrent]
  );
  const hasAllowedTargets = allowedTargets.length > 0;
  const defaultNewStatus = allowedTargets[0] ?? normalizedCurrent;
  const schema = useMemo(
    () => createStatusSchema(currentStatus, allowedTargets),
    [currentStatus, allowedTargets]
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<StatusFormValues>({
    resolver: zodResolver(schema),
    ...REALTIME_FORM_OPTIONS,
    defaultValues: { newStatus: defaultNewStatus, reason: '' },
  });

  useEffect(() => {
    reset({ newStatus: defaultNewStatus, reason: '' });
  }, [reportId, normalizedCurrent, defaultNewStatus, reset]);

  const close = () => {
    reset({ newStatus: defaultNewStatus, reason: '' });
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
          . Chỉ chọn trạng thái tiếp theo hợp lệ theo BR-REP-020 và ghi lý do.
        </p>
      </div>

      {!hasAllowedTargets ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Trạng thái hiện tại không có bước chuyển tiếp hợp lệ. Không thể đổi trạng thái qua hộp
          thoại này.
        </p>
      ) : null}

      <div>
        <label htmlFor="admin-report-new-status" className="mb-1.5 block text-sm font-medium">
          Trạng thái mới <span className="text-destructive">*</span>
        </label>
        <select
          id="admin-report-new-status"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          disabled={updateStatus.isPending || !hasAllowedTargets}
          {...register('newStatus')}
        >
          {allowedTargets.map(status => (
            <option key={status} value={status}>
              {reportStatusLabelVi(status)}
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
        <ValidatedTextarea
          id="admin-report-status-reason"
          rows={4}
          placeholder="Ví dụ: Sửa sai trạng thái sau khi kiểm tra hồ sơ (tối thiểu 10 ký tự)."
          {...register('reason')}
          value={watch('reason') ?? ''}
          minLength={10}
          maxLength={500}
          showWordCount
          error={errors.reason?.message}
          disabled={updateStatus.isPending || !hasAllowedTargets}
        />
      </div>

      <AdminDialogFooter
        onCancel={close}
        confirmType="submit"
        confirmLabel="Xác nhận đổi"
        confirmLoading={updateStatus.isPending}
        confirmDisabled={updateStatus.isPending || !hasAllowedTargets}
      />
    </form>
  );
}
