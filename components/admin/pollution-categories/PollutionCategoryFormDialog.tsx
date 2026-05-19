'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
    .refine(v => !v?.trim() || /^https?:\/\//i.test(v.trim()), {
      message: 'Icon URL phải bắt đầu bằng http:// hoặc https://',
    }),
});

export type PollutionCategoryFormValues = z.infer<typeof formSchema>;

const fieldClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

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
    formState: { errors },
  } = useForm<PollutionCategoryFormValues>({
    resolver: zodResolver(formSchema),
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
            <input
              id="pc-code"
              {...register('code')}
              disabled={mode === 'edit' || busy}
              placeholder="SMOKE"
              className={`${fieldClass} uppercase disabled:opacity-60`}
            />
            {errors.code ? <p className="text-xs text-destructive">{errors.code.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="pc-icon">
              Icon URL (tuỳ chọn)
            </label>
            <input
              id="pc-icon"
              {...register('iconUrl')}
              disabled={busy}
              placeholder="https://cdn.example.com/icons/smoke.png"
              className={fieldClass}
            />
            {errors.iconUrl ? (
              <p className="text-xs text-destructive">{errors.iconUrl.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="pc-name-vi">
              Tên tiếng Việt
            </label>
            <input
              id="pc-name-vi"
              {...register('nameVi')}
              disabled={busy}
              placeholder="Ô nhiễm không khí"
              className={fieldClass}
            />
            {errors.nameVi ? (
              <p className="text-xs text-destructive">{errors.nameVi.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="pc-name-en">
              Tên tiếng Anh
            </label>
            <input
              id="pc-name-en"
              {...register('nameEn')}
              disabled={busy}
              placeholder="Air pollution"
              className={fieldClass}
            />
            {errors.nameEn ? (
              <p className="text-xs text-destructive">{errors.nameEn.message}</p>
            ) : null}
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
            {mode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </OfficeDialogShell>
  );
}
