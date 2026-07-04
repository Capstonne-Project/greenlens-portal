'use client';

import { useCompanyTeamOptions, useCreateCompanyStaff } from '@/hooks/useCompany';
import { COMPANY_STAFF_POSITIONS, getCompanyMutationError } from '@/utils/companyUi';
import type { CreateCompanyStaffResult } from '@/lib/api/models/company';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên').max(160, 'Tối đa 160 ký tự'),
  position: z.string().min(1, 'Vui lòng chọn chức vụ'),
  teamId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CompanyStaffCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (result: CreateCompanyStaffResult) => void;
}

export function CompanyStaffCreateDialog({
  open,
  onClose,
  onCreated,
}: CompanyStaffCreateDialogProps) {
  const createStaff = useCreateCompanyStaff();
  const { options: teams, isPending: teamsLoading } = useCompanyTeamOptions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      fullName: '',
      position: 'Staff',
      teamId: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      email: '',
      fullName: '',
      position: 'Staff',
      teamId: '',
    });
  }, [open, reset]);

  if (!open) return null;

  const fieldClass =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

  const onSubmit = handleSubmit(values => {
    createStaff.mutate(
      {
        email: values.email.trim(),
        fullName: values.fullName.trim(),
        position: values.position,
        ...(values.teamId?.trim() ? { teamId: values.teamId.trim() } : {}),
      },
      {
        onSuccess: env => {
          const data = env.data;
          if (data) {
            onCreated(data);
          } else {
            toast.success(env.message ?? 'Đã tạo nhân viên');
            onClose();
          }
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể tạo nhân viên')),
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
        aria-labelledby="company-staff-create-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id="company-staff-create-title" className="text-lg font-semibold">
              Thêm nhân viên
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tài khoản đăng nhập lần đầu sẽ bắt buộc đổi mật khẩu.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Đóng hộp thoại"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="staff-email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="staff-email"
              type="email"
              autoComplete="off"
              className={fieldClass}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="staff-fullName" className="mb-1.5 block text-sm font-medium">
              Họ và tên
            </label>
            <input
              id="staff-fullName"
              type="text"
              className={fieldClass}
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="staff-position" className="mb-1.5 block text-sm font-medium">
              Chức vụ
            </label>
            <select id="staff-position" className={fieldClass} {...register('position')}>
              {COMPANY_STAFF_POSITIONS.map(pos => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
            {errors.position && (
              <p className="mt-1 text-xs text-destructive">{errors.position.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="staff-team" className="mb-1.5 block text-sm font-medium">
              Đội dọn dẹp <span className="font-normal text-muted-foreground">(tuỳ chọn)</span>
            </label>
            <select
              id="staff-team"
              className={fieldClass}
              disabled={teamsLoading}
              {...register('teamId')}
            >
              <option value="">— Không gán —</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
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
              disabled={createStaff.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {createStaff.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Tạo tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
