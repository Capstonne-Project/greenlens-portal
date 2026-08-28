'use client';

import { ValidatedNumberInput } from '@/components/common/ValidatedField';
import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import type { AdminBadge } from '@/lib/api/models/adminBadge';
import { BADGE_THRESHOLD_MAX, BADGE_THRESHOLD_MIN } from '@/lib/constants/adminSystemSettings';
import { getBadgeThresholdInfo } from '@/utils/adminBadgeUi';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  threshold: z
    .number({ error: 'Vui lòng nhập ngưỡng' })
    .int('Ngưỡng phải là số nguyên')
    .min(BADGE_THRESHOLD_MIN, `Ngưỡng tối thiểu ${BADGE_THRESHOLD_MIN}`)
    .max(BADGE_THRESHOLD_MAX, `Ngưỡng tối đa ${BADGE_THRESHOLD_MAX.toLocaleString('vi-VN')}`),
});

export type BadgeThresholdFormValues = z.infer<typeof formSchema>;

interface BadgeThresholdDialogProps {
  open: boolean;
  badge: AdminBadge | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: BadgeThresholdFormValues) => void;
}

export function BadgeThresholdDialog({
  open,
  badge,
  busy,
  onClose,
  onSubmit,
}: BadgeThresholdDialogProps) {
  const thresholdInfo = badge ? getBadgeThresholdInfo(badge) : null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BadgeThresholdFormValues>({
    resolver: zodResolver(formSchema),
    ...REALTIME_FORM_OPTIONS,
    defaultValues: {
      threshold: BADGE_THRESHOLD_MIN,
    },
  });

  useEffect(() => {
    if (!open || !badge) return;
    const info = getBadgeThresholdInfo(badge);
    reset({
      threshold: info.current ?? BADGE_THRESHOLD_MIN,
    });
  }, [open, badge, reset]);

  return (
    <OfficeDialogShell
      open={open && badge != null}
      title="Sửa ngưỡng"
      titleId="admin-badge-threshold-title"
      onClose={onClose}
    >
      {badge && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cập nhật ngưỡng eligibility cho{' '}
            <span className="font-semibold text-foreground">{badge.nameVi}</span> (
            <span className="font-mono text-xs">{badge.code}</span>).
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="badge-threshold">
              {thresholdInfo?.label ?? 'Ngưỡng'} <span className="text-destructive">*</span>
            </label>
            <ValidatedNumberInput
              id="badge-threshold"
              step={1}
              {...register('threshold', { valueAsNumber: true })}
              value={watch('threshold')}
              min={BADGE_THRESHOLD_MIN}
              max={BADGE_THRESHOLD_MAX}
              error={errors.threshold?.message}
              disabled={busy}
              hint={`Từ ${BADGE_THRESHOLD_MIN.toLocaleString('vi-VN')} đến ${BADGE_THRESHOLD_MAX.toLocaleString('vi-VN')}.`}
            />
          </div>
          <AdminDialogFooter
            onCancel={onClose}
            confirmType="submit"
            confirmLabel="Lưu ngưỡng"
            confirmLoading={busy}
            cancelDisabled={busy}
            confirmDisabled={busy}
            className="border-t border-border pt-4"
          />
        </form>
      )}
    </OfficeDialogShell>
  );
}
