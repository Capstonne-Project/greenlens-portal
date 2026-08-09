'use client';

import {
  ValidatedInput,
  ValidatedNumberInput,
  ValidatedTextarea,
} from '@/components/common/ValidatedField';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import type { WasteTag } from '@/lib/api/models/wasteTag';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const codeSchema = z
  .string()
  .min(2, 'Mã tối thiểu 2 ký tự')
  .max(64, 'Mã tối đa 64 ký tự')
  .regex(/^[A-Z][A-Z0-9_]*$/, 'Mã phải viết HOA, dạng UPPER_SNAKE_CASE (vd: ILLEGAL_DUMPING)');

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
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
  displayOrder: z
    .number({ error: 'Thứ tự phải là số' })
    .int('Thứ tự phải là số nguyên')
    .min(1, 'Thứ tự tối thiểu là 1')
    .max(9999, 'Thứ tự tối đa là 9999'),
});

export type WasteTagFormValues = z.infer<typeof formSchema>;

interface WasteTagFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  tag?: WasteTag | null;
  busy?: boolean;
  defaultDisplayOrder?: number;
  onClose: () => void;
  onSubmit: (values: WasteTagFormValues) => void;
}

export function WasteTagFormDialog({
  open,
  mode,
  tag,
  busy,
  defaultDisplayOrder = 1,
  onClose,
  onSubmit,
}: WasteTagFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<WasteTagFormValues>({
    resolver: zodResolver(formSchema),
    ...REALTIME_FORM_OPTIONS,
    defaultValues: {
      code: '',
      nameVi: '',
      nameEn: '',
      iconUrl: '',
      description: '',
      displayOrder: defaultDisplayOrder,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && tag) {
      reset({
        code: tag.code,
        nameVi: tag.nameVi,
        nameEn: tag.nameEn,
        iconUrl: tag.iconUrl ?? '',
        description: tag.description ?? '',
        displayOrder: tag.displayOrder,
      });
    } else {
      reset({
        code: '',
        nameVi: '',
        nameEn: '',
        iconUrl: '',
        description: '',
        displayOrder: defaultDisplayOrder,
      });
    }
  }, [open, mode, tag, reset, defaultDisplayOrder]);

  const title = mode === 'create' ? 'Thêm thẻ rác thải' : 'Sửa thẻ rác thải';

  return (
    <OfficeDialogShell
      open={open}
      title={title}
      titleId="waste-tag-form-title"
      onClose={onClose}
      size="wide"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="wt-code">
              Mã (code)
            </label>
            <ValidatedInput
              id="wt-code"
              {...register('code', {
                onChange: e => {
                  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                },
              })}
              value={watch('code') ?? ''}
              minLength={2}
              maxLength={64}
              error={errors.code?.message}
              disabled={mode === 'edit' || busy}
              placeholder="ILLEGAL_DUMPING"
              className="font-mono uppercase disabled:opacity-60"
            />
            <p className="text-xs text-muted-foreground">
              UPPER_SNAKE_CASE, duy nhất, không đổi sau khi tạo.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="wt-order">
              Thứ tự hiển thị
            </label>
            <ValidatedNumberInput
              id="wt-order"
              {...register('displayOrder', { valueAsNumber: true })}
              value={watch('displayOrder')}
              min={1}
              max={9999}
              error={errors.displayOrder?.message}
              disabled={busy}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="wt-icon">
              Icon URL (tuỳ chọn)
            </label>
            <ValidatedInput
              id="wt-icon"
              {...register('iconUrl')}
              value={watch('iconUrl') ?? ''}
              minLength={0}
              maxLength={500}
              error={errors.iconUrl?.message}
              disabled={busy}
              placeholder="https://cdn.greenlens.com/icons/illegal-dumping.png"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="wt-name-vi">
              Tên tiếng Việt
            </label>
            <ValidatedInput
              id="wt-name-vi"
              {...register('nameVi')}
              value={watch('nameVi') ?? ''}
              minLength={1}
              maxLength={120}
              error={errors.nameVi?.message}
              disabled={busy}
              placeholder="Đổ rác trái phép"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="wt-name-en">
              Tên tiếng Anh
            </label>
            <ValidatedInput
              id="wt-name-en"
              {...register('nameEn')}
              value={watch('nameEn') ?? ''}
              minLength={1}
              maxLength={120}
              error={errors.nameEn?.message}
              disabled={busy}
              placeholder="Illegal Dumping"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="wt-description">
              Mô tả
            </label>
            <ValidatedTextarea
              id="wt-description"
              {...register('description')}
              value={watch('description') ?? ''}
              minLength={0}
              maxLength={500}
              showWordCount
              error={errors.description?.message}
              disabled={busy}
              rows={3}
              placeholder="Mô tả ngắn về loại rác thải này…"
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
            {mode === 'create' ? 'Tạo thẻ' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </OfficeDialogShell>
  );
}
