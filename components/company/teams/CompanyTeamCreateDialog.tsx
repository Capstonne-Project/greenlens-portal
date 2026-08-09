'use client';

import { ValidatedInput } from '@/components/common/ValidatedField';
import { useCreateCompanyTeam } from '@/hooks/useCompany';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import { getCompanyMutationError } from '@/utils/companyUi';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên đội').max(120, 'Tối đa 120 ký tự').trim(),
});

type FormValues = z.infer<typeof schema>;

interface CompanyTeamCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CompanyTeamCreateDialog({ open, onClose }: CompanyTeamCreateDialogProps) {
  const createTeam = useCreateCompanyTeam();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    ...REALTIME_FORM_OPTIONS,
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset({ name: '' });
  }, [open, reset]);

  if (!open) return null;

  const onSubmit = handleSubmit(values => {
    createTeam.mutate(
      { name: values.name.trim() },
      {
        onSuccess: env => {
          toast.success(env.message ?? 'Đã tạo đội');
          onClose();
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể tạo đội')),
      }
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-team-create-title"
        className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 id="company-team-create-title" className="text-lg font-semibold">
            Tạo đội dọn dẹp
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="team-name" className="mb-1.5 block text-sm font-medium">
              Tên đội
            </label>
            <ValidatedInput
              id="team-name"
              type="text"
              placeholder="VD: Green Warriors Team"
              {...register('name')}
              value={watch('name')}
              minLength={1}
              maxLength={120}
              error={errors.name?.message}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={createTeam.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {createTeam.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Tạo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
