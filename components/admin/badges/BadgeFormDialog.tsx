'use client';

import { ValidatedInput, ValidatedTextarea } from '@/components/common/ValidatedField';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import type { AdminBadge } from '@/lib/api/models/adminBadge';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  nameVi: z.string().min(1, 'Vui lòng nhập tên tiếng Việt').max(120, 'Tối đa 120 ký tự'),
  nameEn: z.string().min(1, 'Vui lòng nhập tên tiếng Anh').max(120, 'Tối đa 120 ký tự'),
  description: z.string().max(500, 'Tối đa 500 ký tự').optional(),
  iconUrl: z.string().max(500, 'URL quá dài').optional(),
});

export type BadgeFormValues = z.infer<typeof formSchema>;

interface BadgeFormDialogProps {
  open: boolean;
  badge: AdminBadge | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: BadgeFormValues) => void;
}

export function BadgeFormDialog({ open, badge, busy, onClose, onSubmit }: BadgeFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BadgeFormValues>({
    resolver: zodResolver(formSchema),
    ...REALTIME_FORM_OPTIONS,
    defaultValues: {
      nameVi: '',
      nameEn: '',
      description: '',
      iconUrl: '',
    },
  });

  useEffect(() => {
    if (!open || !badge) return;
    reset({
      nameVi: badge.nameVi,
      nameEn: badge.nameEn,
      description: badge.description ?? '',
      iconUrl: badge.iconUrl ?? '',
    });
  }, [open, badge, reset]);

  return (
    <OfficeDialogShell
      open={open && badge != null}
      title="Sửa huy hiệu"
      titleId="admin-badge-form-title"
      onClose={onClose}
      size="wide"
    >
      {badge && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Mã <span className="font-mono font-medium text-foreground">{badge.code}</span> — sửa
            tên, mô tả và icon. Ngưỡng eligibility chỉnh qua nút &quot;Sửa ngưỡng&quot; trên thẻ.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="badge-name-vi">
                Tên tiếng Việt
              </label>
              <ValidatedInput
                id="badge-name-vi"
                {...register('nameVi')}
                value={watch('nameVi') ?? ''}
                minLength={1}
                maxLength={120}
                error={errors.nameVi?.message}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="badge-name-en">
                Tên tiếng Anh
              </label>
              <ValidatedInput
                id="badge-name-en"
                {...register('nameEn')}
                value={watch('nameEn') ?? ''}
                minLength={1}
                maxLength={120}
                error={errors.nameEn?.message}
                disabled={busy}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="badge-description">
                Mô tả
              </label>
              <ValidatedTextarea
                id="badge-description"
                {...register('description')}
                value={watch('description') ?? ''}
                maxLength={500}
                error={errors.description?.message}
                disabled={busy}
                rows={3}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="badge-icon">
                Icon URL
              </label>
              <ValidatedInput
                id="badge-icon"
                {...register('iconUrl')}
                value={watch('iconUrl') ?? ''}
                minLength={0}
                maxLength={500}
                error={errors.iconUrl?.message}
                disabled={busy}
                placeholder="badges/icons/first_report.png hoặc https://…"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Lưu thay đổi
            </button>
          </div>
        </form>
      )}
    </OfficeDialogShell>
  );
}
