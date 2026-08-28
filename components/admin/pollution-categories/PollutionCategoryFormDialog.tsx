'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { ValidatedInput } from '@/components/common/ValidatedField';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const codeSchema = z
  .string()
  .min(2, 'Mã tối thiểu 2 ký tự')
  .max(32, 'Mã tối đa 32 ký tự')
  .regex(/^[A-Za-z0-9_]+$/, 'Mã chỉ gồm chữ, số và gạch dưới');

const formSchema = z.object({
  code: codeSchema,
  nameVi: z.string().min(1, 'Vui lòng nhập tên tiếng Việt').max(120, 'Tối đa 120 ký tự'),
  nameEn: z.string().min(1, 'Vui lòng nhập tên tiếng Anh').max(120, 'Tối đa 120 ký tự'),
  iconUrl: z
    .string()
    .max(500, 'URL quá dài')
    .optional()
    .refine(v => !v?.trim() || /^https:\/\//i.test(v.trim()), {
      message: 'Icon URL phải bắt đầu bằng https://',
    }),
});

export type PollutionCategoryFormValues = z.infer<typeof formSchema>;

interface PollutionCategoryFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  category?: PollutionCategory | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: PollutionCategoryFormValues) => void;
}

export function PollutionCategoryFormDialog({
  open,
  mode,
  category,
  busy,
  onClose,
  onSubmit,
}: PollutionCategoryFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PollutionCategoryFormValues>({
    resolver: zodResolver(formSchema),
    ...REALTIME_FORM_OPTIONS,
    defaultValues: {
      code: '',
      nameVi: '',
      nameEn: '',
      iconUrl: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && category) {
      reset({
        code: category.code,
        nameVi: category.nameVi,
        nameEn: category.nameEn,
        iconUrl: category.iconUrl ?? '',
      });
    } else {
      reset({ code: '', nameVi: '', nameEn: '', iconUrl: '' });
    }
  }, [open, mode, category, reset]);

  const title = mode === 'create' ? 'Thêm loại ô nhiễm' : 'Sửa danh mục';

  return (
    <OfficeDialogShell
      open={open}
      title={title}
      titleId="pollution-category-form-title"
      onClose={onClose}
      size="wide"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="pc-code">
              Mã (code)
            </label>
            <ValidatedInput
              id="pc-code"
              {...register('code')}
              value={watch('code') ?? ''}
              minLength={2}
              maxLength={32}
              error={errors.code?.message}
              disabled={mode === 'edit' || busy}
              placeholder="SMOKE"
              className="uppercase disabled:opacity-60"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="pc-icon">
              Icon URL (tuỳ chọn)
            </label>
            <ValidatedInput
              id="pc-icon"
              {...register('iconUrl')}
              value={watch('iconUrl') ?? ''}
              minLength={0}
              maxLength={500}
              error={errors.iconUrl?.message}
              disabled={busy}
              placeholder="https://cdn.example.com/icons/smoke.png"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="pc-name-vi">
              Tên tiếng Việt
            </label>
            <ValidatedInput
              id="pc-name-vi"
              {...register('nameVi')}
              value={watch('nameVi') ?? ''}
              minLength={1}
              maxLength={120}
              error={errors.nameVi?.message}
              disabled={busy}
              placeholder="Ô nhiễm không khí"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="pc-name-en">
              Tên tiếng Anh
            </label>
            <ValidatedInput
              id="pc-name-en"
              {...register('nameEn')}
              value={watch('nameEn') ?? ''}
              minLength={1}
              maxLength={120}
              error={errors.nameEn?.message}
              disabled={busy}
              placeholder="Air pollution"
            />
          </div>
        </div>
        <AdminDialogFooter
          onCancel={onClose}
          confirmType="submit"
          confirmLabel={mode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi'}
          confirmLoading={busy}
          cancelDisabled={busy}
          confirmDisabled={busy}
          className="border-t border-border pt-4"
        />
      </form>
    </OfficeDialogShell>
  );
}
