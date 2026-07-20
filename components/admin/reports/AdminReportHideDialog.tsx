'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useHideAdminReport } from '@/hooks/useAdminReports';
import { getAdminReportMutationError } from '@/utils/adminReportErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const hideSchema = z.object({
  reason: z.string().trim().min(10, 'Lý do tối thiểu 10 ký tự').max(500, 'Lý do tối đa 500 ký tự'),
});

type HideFormValues = z.infer<typeof hideSchema>;

interface AdminReportHideDialogProps {
  reportId: string | null;
  reportCode?: string;
  open: boolean;
  onClose: () => void;
  onHidden?: () => void;
}

export function AdminReportHideDialog({
  reportId,
  reportCode,
  open,
  onClose,
  onHidden,
}: AdminReportHideDialogProps) {
  const hideReport = useHideAdminReport();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HideFormValues>({
    resolver: zodResolver(hideSchema),
    defaultValues: { reason: '' },
  });

  const close = () => {
    reset({ reason: '' });
    onClose();
  };

  const onSubmit = (values: HideFormValues) => {
    if (!reportId) return;
    hideReport.mutate(
      { id: reportId, body: { reason: values.reason } },
      {
        onSuccess: env => {
          toast.success(env.message || 'Đã ẩn báo cáo.');
          close();
          onHidden?.();
        },
        onError: err => toast.error(getAdminReportMutationError(err, 'Không thể ẩn báo cáo.')),
      }
    );
  };

  return (
    <OfficeDialogShell
      open={open && Boolean(reportId)}
      title="Ẩn báo cáo"
      titleId="admin-report-hide-title"
      onClose={close}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
          <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Báo cáo{reportCode ? ` ${reportCode}` : ''} sẽ được làm xám trên danh sách admin và ẩn
            khỏi công chúng. Bấm <span className="font-medium text-foreground">Hiện lại</span> trên
            hàng xám để khôi phục.
          </p>
        </div>

        <div>
          <label htmlFor="hide-reason" className="mb-1.5 block text-sm font-medium">
            Lý do ẩn <span className="text-destructive">*</span>
          </label>
          <textarea
            id="hide-reason"
            rows={4}
            placeholder="Ví dụ: Nội dung vi phạm quy định cộng đồng."
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
            disabled={hideReport.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            {hideReport.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Xác nhận ẩn
          </button>
        </div>
      </form>
    </OfficeDialogShell>
  );
}
