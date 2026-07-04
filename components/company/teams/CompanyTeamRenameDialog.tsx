'use client';

import { useRenameCompanyTeam } from '@/hooks/useCompany';
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

interface CompanyTeamRenameDialogProps {
  open: boolean;
  team: { id: string; name: string } | null;
  onClose: () => void;
}

export function CompanyTeamRenameDialog({ open, team, onClose }: CompanyTeamRenameDialogProps) {
  const renameTeam = useRenameCompanyTeam();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!open || !team) return;
    reset({ name: team.name });
  }, [open, team, reset]);

  if (!open || !team) return null;

  const fieldClass =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

  const onSubmit = handleSubmit(values => {
    renameTeam.mutate(
      { id: team.id, body: { name: values.name.trim() } },
      {
        onSuccess: env => {
          toast.success(env.message ?? 'Đã cập nhật tên đội');
          onClose();
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể đổi tên đội')),
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
        aria-labelledby="company-team-rename-title"
        className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 id="company-team-rename-title" className="text-lg font-semibold">
            Đổi tên đội
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
            <label htmlFor="team-rename" className="mb-1.5 block text-sm font-medium">
              Tên mới
            </label>
            <input id="team-rename" type="text" className={fieldClass} {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
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
              disabled={renameTeam.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {renameTeam.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
