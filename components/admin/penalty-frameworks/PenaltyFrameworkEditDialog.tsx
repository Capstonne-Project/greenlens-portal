'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { ValidatedNumberInput } from '@/components/common/ValidatedField';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import type { PenaltyFramework } from '@/lib/api/models/penaltyFramework';
import {
  PENALTY_VIOLATION_LEVEL_LABEL_VI,
  type PenaltyViolationLevel,
  PENALTY_VIOLATION_LEVELS,
} from '@/lib/constants/penaltyFrameworks';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FocusEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z
  .object({
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

export type PenaltyFrameworkEditFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  framework: PenaltyFramework | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: PenaltyFrameworkEditFormValues) => void;
}

const dateClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function getViolationLabel(level: string): string {
  if ((PENALTY_VIOLATION_LEVELS as readonly string[]).includes(level)) {
    return PENALTY_VIOLATION_LEVEL_LABEL_VI[level as PenaltyViolationLevel];
  }
  return level || 'Không rõ';
}

function parseAmountInput(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function PenaltyFrameworkEditDialog({ open, framework, busy, onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PenaltyFrameworkEditFormValues>({
    resolver: zodResolver(formSchema),
    ...REALTIME_FORM_OPTIONS,
    defaultValues: framework
      ? {
          minAmount: framework.minAmount,
          maxAmount: framework.maxAmount,
          effectiveFrom: toDateInputValue(framework.effectiveFrom),
          effectiveTo: toDateInputValue(framework.effectiveTo),
        }
      : {
          minAmount: undefined as unknown as number,
          maxAmount: undefined as unknown as number,
          effectiveFrom: '',
          effectiveTo: '',
        },
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

  if (!open || !framework) return null;

  return (
    <OfficeDialogShell
      open={open}
      title="Cập nhật khung xử phạt"
      titleId="penalty-framework-edit-title"
      onClose={onClose}
      size="wide"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <p className="text-sm font-semibold text-emerald-950">{framework.categoryNameVi}</p>
          <p className="mt-1 text-sm text-emerald-900/70">
            Cấp vi phạm: {getViolationLabel(framework.violationLevel)}. Chỉ cập nhật mức tiền và
            thời gian hiệu lực — không ảnh hưởng quyết định đã ban hành.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="penalty-edit-min" className="text-sm font-medium">
              Mức tối thiểu
            </label>
            <ValidatedNumberInput
              id="penalty-edit-min"
              step={1000}
              ref={minAmountField.ref}
              name={minAmountField.name}
              onChange={minAmountField.onChange}
              onBlur={minAmountField.onBlur}
              value={watch('minAmount')}
              min={0}
              onFocus={clearZeroOnFocus('minAmount')}
              disabled={busy}
              placeholder="500000"
              error={errors.minAmount?.message}
              className="disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="penalty-edit-max" className="text-sm font-medium">
              Mức tối đa
            </label>
            <ValidatedNumberInput
              id="penalty-edit-max"
              step={1000}
              ref={maxAmountField.ref}
              name={maxAmountField.name}
              onChange={maxAmountField.onChange}
              onBlur={maxAmountField.onBlur}
              value={watch('maxAmount')}
              min={0}
              onFocus={clearZeroOnFocus('maxAmount')}
              disabled={busy}
              placeholder="1000000"
              error={errors.maxAmount?.message}
              className="disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="penalty-edit-from" className="text-sm font-medium">
              Hiệu lực từ
            </label>
            <input
              id="penalty-edit-from"
              type="date"
              {...register('effectiveFrom')}
              disabled={busy}
              className={`${dateClass} disabled:opacity-60`}
            />
            {errors.effectiveFrom ? (
              <p className="text-xs text-destructive">{errors.effectiveFrom.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="penalty-edit-to" className="text-sm font-medium">
              Hiệu lực đến (tuỳ chọn)
            </label>
            <input
              id="penalty-edit-to"
              type="date"
              {...register('effectiveTo')}
              disabled={busy}
              className={`${dateClass} disabled:opacity-60`}
            />
            {errors.effectiveTo ? (
              <p className="text-xs text-destructive">{errors.effectiveTo.message}</p>
            ) : null}
          </div>
        </div>

        <AdminDialogFooter
          onCancel={onClose}
          confirmType="submit"
          confirmLabel="Lưu thay đổi"
          confirmLoading={busy}
          cancelDisabled={busy}
          confirmDisabled={busy}
          className="border-t border-border pt-4"
        />
      </form>
    </OfficeDialogShell>
  );
}
