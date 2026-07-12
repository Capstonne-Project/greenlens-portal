'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import type { GamificationConfig } from '@/lib/api/models/gamificationConfig';
import { gamificationActionLabel } from '@/lib/constants/gamificationConfigs';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  points: z
    .number({ error: 'Vui lòng nhập số điểm' })
    .int('Điểm phải là số nguyên')
    .min(-1000, 'Điểm tối thiểu -1000')
    .max(1000, 'Điểm tối đa 1000'),
  description: z.string().trim().min(1, 'Vui lòng nhập mô tả').max(500, 'Mô tả tối đa 500 ký tự'),
  isActive: z.boolean(),
});

export type GamificationConfigEditFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  config: GamificationConfig | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: GamificationConfigEditFormValues) => void;
}

const fieldClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

export function GamificationConfigEditDialog({ open, config, busy, onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GamificationConfigEditFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      points: 0,
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open || !config) return;
    reset({
      points: config.points,
      description: config.description,
      isActive: config.isActive,
    });
  }, [config, open, reset]);

  const isActive = watch('isActive');

  return (
    <OfficeDialogShell
      open={open && Boolean(config)}
      title="Cập nhật điểm gamification"
      titleId="gamification-config-edit-title"
      onClose={onClose}
    >
      {config ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" key={config.id}>
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hành động
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {gamificationActionLabel(config.actionType)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {config.actionType}
            </p>
          </div>

          <div>
            <label htmlFor="gam-points" className="mb-1.5 block text-sm font-medium">
              Số điểm <span className="text-destructive">*</span>
            </label>
            <input
              id="gam-points"
              type="number"
              step={1}
              className={fieldClass}
              {...register('points', { valueAsNumber: true })}
            />
            {errors.points ? (
              <p className="mt-1 text-xs text-destructive">{errors.points.message}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Âm = trừ điểm (vd. từ chối, gian lận).
              </p>
            )}
          </div>

          <div>
            <label htmlFor="gam-desc" className="mb-1.5 block text-sm font-medium">
              Mô tả <span className="text-destructive">*</span>
            </label>
            <textarea
              id="gam-desc"
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              {...register('description')}
            />
            {errors.description ? (
              <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-3 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setValue('isActive', e.target.checked, { shouldDirty: true })}
              className="size-4 rounded border-input text-emerald-700 focus:ring-emerald-500/40"
            />
            <span>
              <span className="font-medium text-foreground">Đang bật</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Tắt để tạm ngưng cộng/trừ điểm cho hành động này.
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Lưu
            </button>
          </div>
        </form>
      ) : null}
    </OfficeDialogShell>
  );
}
