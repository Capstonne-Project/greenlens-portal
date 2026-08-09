'use client';

import { ValidatedInput } from '@/components/common/ValidatedField';
import { AdminUserDialogShell } from '@/components/admin/users/AdminUserDialogShell';
import { useCreateAdminUser } from '@/hooks/useAdminUsers';
import {
  ADMIN_USER_ASSIGNABLE_ROLES,
  type AdminUserAssignableRole,
} from '@/lib/constants/adminUsersNav';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const roleValues = ADMIN_USER_ASSIGNABLE_ROLES.map(r => r.value) as [
  AdminUserAssignableRole,
  ...AdminUserAssignableRole[],
];

const createSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu cần ít nhất một chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu cần ít nhất một chữ thường')
    .regex(/\d/, 'Mật khẩu cần ít nhất một chữ số')
    .regex(/[^A-Za-z0-9]/, 'Mật khẩu cần ít nhất một ký tự đặc biệt'),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên').max(160, 'Tối đa 160 ký tự'),
  role: z.enum(roleValues, { message: 'Vui lòng chọn vai trò' }),
});

type CreateFormValues = z.infer<typeof createSchema>;

interface AdminUserCreateDialogProps {
  open: boolean;
  defaultRole?: string;
  onClose: () => void;
}

export function AdminUserCreateDialog({ open, defaultRole, onClose }: AdminUserCreateDialogProps) {
  const createUser = useCreateAdminUser();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    ...REALTIME_FORM_OPTIONS,
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      role: 'Citizen',
    },
  });

  useEffect(() => {
    if (!open) return;
    const role = ADMIN_USER_ASSIGNABLE_ROLES.some(r => r.value === defaultRole)
      ? (defaultRole as AdminUserAssignableRole)
      : 'Citizen';
    reset({
      email: '',
      password: '',
      fullName: '',
      role,
    });
  }, [open, defaultRole, reset]);

  const onSubmit = handleSubmit(values => {
    createUser.mutate(
      {
        email: values.email.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
        role: values.role,
      },
      {
        onSuccess: env => {
          toast.success(env.data?.message ?? env.message ?? 'Tạo tài khoản thành công');
          onClose();
        },
        onError: err => toast.error(getAdminUserMutationError(err, 'Không thể tạo tài khoản')),
      }
    );
  });

  const selectClass =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

  return (
    <AdminUserDialogShell
      open={open}
      title="Tạo tài khoản"
      titleId="admin-user-create-title"
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <ValidatedInput
            type="email"
            autoComplete="off"
            {...register('email')}
            value={watch('email') ?? ''}
            minLength={1}
            maxLength={254}
            error={errors.email?.message}
          />
        </Field>
        <Field label="Mật khẩu">
          <ValidatedInput
            type="password"
            autoComplete="new-password"
            {...register('password')}
            value={watch('password') ?? ''}
            minLength={8}
            maxLength={128}
            error={errors.password?.message}
          />
        </Field>
        <Field label="Họ tên">
          <ValidatedInput
            type="text"
            {...register('fullName')}
            value={watch('fullName') ?? ''}
            minLength={1}
            maxLength={160}
            error={errors.fullName?.message}
          />
        </Field>
        <Field label="Vai trò">
          <select className={selectClass} {...register('role')}>
            {ADMIN_USER_ASSIGNABLE_ROLES.map(r => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {errors.role ? (
            <p className="text-xs font-medium text-destructive">{errors.role.message}</p>
          ) : null}
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={createUser.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {createUser.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Tạo tài khoản
          </button>
        </div>
      </form>
    </AdminUserDialogShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
