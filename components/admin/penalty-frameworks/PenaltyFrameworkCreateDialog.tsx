'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import {
  PENALTY_VIOLATION_LEVEL_LABEL_VI,
  PENALTY_VIOLATION_LEVELS,
} from '@/lib/constants/penaltyFrameworks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import type { FocusEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z
  .object({
    categoryId: z.string().min(1, 'Vui lòng chọn loại ô nhiễm'),
    violationLevel: z.string().min(1, 'Vui lòng chọn cấp vi phạm'),
    minAmount: z.number({ error: 'Vui lòng nhập mức tối thiểu' }).min(0, 'Mức tối thiểu phải ≥ 0'),
    maxAmount: z.number({ error: 'Vui lòng nhập mức tối đa' }).min(0, 'Mức tối đa phải ≥ 0'),
    effectiveFrom: z.string().min(1, 'Vui lòng chọn ngày hiệu lực'),
    effectiveTo: z.string().optional(),
  })
  .refine(data => data.maxAmount >= data.minAmount, {
    message: 'Mức tối đa phải ≥ mức tối thiểu',
    path: ['maxAmount'],
  })
  .refine(data => !data.effectiveTo || data.effectiveTo >= data.effectiveFrom, {
    message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
    path: ['effectiveTo'],
  });

export type PenaltyFrameworkFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  busy?: boolean;
  categories: { id: string; nameVi: string }[];
  categoriesLoading?: boolean;
  onClose: () => void;
  onSubmit: (values: PenaltyFrameworkFormValues) => void;
}

const fieldClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

const defaultValues = {
  categoryId: '',
  violationLevel: '',
  minAmount: undefined,
  maxAmount: undefined,
  effectiveFrom: '',
  effectiveTo: '',
};

function parseAmountInput(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function PenaltyFrameworkCreateDialog({
  open,
  busy,
  categories,
  categoriesLoading,
  onClose,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PenaltyFrameworkFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as unknown as PenaltyFrameworkFormValues,
  });

  const minAmountField = register('minAmount', { setValueAs: parseAmountInput });
  const maxAmountField = register('maxAmount', { setValueAs: parseAmountInput });

  const clearZeroOnFocus =
    (field: 'minAmount' | 'maxAmount') => (event: FocusEvent<HTMLInputElement>) => {
      if (event.currentTarget.value === '0') {
        event.currentTarget.value = '';
        setValue(field, undefined as unknown as number, {
          shouldValidate: false,
          shouldDirty: true,
        });
      }
    };

  return (
    <OfficeDialogShell
      open={open}
      title="Tạo khung xử phạt"
      titleId="penalty-framework-create-title"
      onClose={onClose}
      size="wide"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <p className="text-sm font-semibold text-emerald-950">Thiết lập mức phạt hiệu lực</p>
          <p className="mt-1 text-sm text-emerald-900/70">
            Mỗi loại ô nhiễm và cấp vi phạm chỉ nên có một khung hiệu lực trong cùng thời điểm.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="penalty-category" className="text-sm font-medium">
              Loại ô nhiễm
            </label>
            <select
              id="penalty-category"
              {...register('categoryId')}
              disabled={busy || categoriesLoading}
              className={`${fieldClass} disabled:opacity-60`}
            >
              <option value="">
                {categoriesLoading ? 'Đang tải loại ô nhiễm…' : 'Chọn danh mục'}
              </option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.nameVi}
                </option>
              ))}
            </select>
            {errors.categoryId ? (
              <p className="text-xs text-destructive">{errors.categoryId.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="penalty-level" className="text-sm font-medium">
              Cấp vi phạm
            </label>
            <select
              id="penalty-level"
              {...register('violationLevel')}
              disabled={busy}
              className={`${fieldClass} disabled:opacity-60`}
            >
              <option value="">Chọn cấp</option>
              {PENALTY_VIOLATION_LEVELS.map(level => (
                <option key={level} value={level}>
                  {PENALTY_VIOLATION_LEVEL_LABEL_VI[level]}
                </option>
              ))}
            </select>
            {errors.violationLevel ? (
              <p className="text-xs text-destructive">{errors.violationLevel.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="penalty-min" className="text-sm font-medium">
              Mức tối thiểu
            </label>
            <input
              id="penalty-min"
              type="number"
              min={0}
              step={1000}
              {...minAmountField}
              onFocus={clearZeroOnFocus('minAmount')}
              disabled={busy}
              placeholder="500000"
              className={`${fieldClass} disabled:opacity-60`}
            />
            {errors.minAmount ? (
              <p className="text-xs text-destructive">{errors.minAmount.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="penalty-max" className="text-sm font-medium">
              Mức tối đa
            </label>
            <input
              id="penalty-max"
              type="number"
              min={0}
              step={1000}
              {...maxAmountField}
              onFocus={clearZeroOnFocus('maxAmount')}
              disabled={busy}
              placeholder="1000000"
              className={`${fieldClass} disabled:opacity-60`}
            />
            {errors.maxAmount ? (
              <p className="text-xs text-destructive">{errors.maxAmount.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="penalty-from" className="text-sm font-medium">
              Hiệu lực từ
            </label>
            <input
              id="penalty-from"
              type="date"
              {...register('effectiveFrom')}
              disabled={busy}
              className={`${fieldClass} disabled:opacity-60`}
            />
            {errors.effectiveFrom ? (
              <p className="text-xs text-destructive">{errors.effectiveFrom.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="penalty-to" className="text-sm font-medium">
              Hiệu lực đến (tuỳ chọn)
            </label>
            <input
              id="penalty-to"
              type="date"
              {...register('effectiveTo')}
              disabled={busy}
              className={`${fieldClass} disabled:opacity-60`}
            />
            {errors.effectiveTo ? (
              <p className="text-xs text-destructive">{errors.effectiveTo.message}</p>
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
            Huỷ
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Tạo khung
          </button>
        </div>
      </form>
    </OfficeDialogShell>
  );
}
