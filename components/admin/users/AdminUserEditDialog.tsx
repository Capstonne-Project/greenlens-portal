'use client';

import { AdminUserDialogShell } from '@/components/admin/users/AdminUserDialogShell';
import { useUpdateAdminUser } from '@/hooks/useAdminUsers';
import {
  ADMIN_USER_ASSIGNABLE_ROLES,
  type AdminUserAssignableRole,
} from '@/lib/constants/adminUsersNav';
import { normalizeApiRole } from '@/lib/constants/systemRoles';
import type { AdminUser } from '@/lib/api/models/adminUser';
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

const editSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên').max(160, 'Tối đa 160 ký tự'),
  phoneNumber: z.string().refine(
    val => {
      const t = val.trim();
      return t === '' || /^0\d{8,10}$/.test(t.replace(/\s/g, ''));
    },
    { message: 'Số điện thoại không hợp lệ (VD: 0955633245)' }
  ),
  role: z.enum(roleValues, { message: 'Vui lòng chọn vai trò' }),
  isEmailVerified: z.boolean(),
});

type EditFormValues = z.infer<typeof editSchema>;

interface AdminUserEditDialogProps {
  user: AdminUser | null;
  onClose: () => void;
}

function normalizeAssignableRole(role: string): AdminUserAssignableRole {
  const canonical = normalizeApiRole(role);
  const match = ADMIN_USER_ASSIGNABLE_ROLES.find(
    r => r.value.toLowerCase() === canonical.toLowerCase()
  );
  return match?.value ?? 'Citizen';
}

export function AdminUserEditDialog({ user, onClose }: AdminUserEditDialogProps) {
  const updateUser = useUpdateAdminUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      role: 'Citizen',
      isEmailVerified: false,
    },
  });

  useEffect(() => {
    if (!user) return;
    reset({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber ?? '',
      role: normalizeAssignableRole(user.role),
      isEmailVerified: user.isEmailVerified,
    });
  }, [user, reset]);

  const onSubmit = handleSubmit(values => {
    if (!user) return;
    updateUser.mutate(
      {
        id: user.id,
        body: {
          fullName: values.fullName.trim(),
          phoneNumber: values.phoneNumber.trim() || undefined,
          role: values.role,
          isEmailVerified: values.isEmailVerified,
        },
      },
      {
        onSuccess: env => {
          toast.success(env.data?.message ?? env.message ?? 'Cập nhật người dùng thành công');
          onClose();
        },
        onError: err =>
          toast.error(getAdminUserMutationError(err, 'Không thể cập nhật người dùng')),
      }
    );
  });

  const fieldClass =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

  return (
    <AdminUserDialogShell
      open={user != null}
      title="Cập nhật người dùng"
      titleId="admin-user-edit-title"
      onClose={onClose}
    >
      {user && (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Email: <span className="font-medium text-foreground">{user.email}</span>
          </p>
          <Field label="Họ tên" error={errors.fullName?.message}>
            <input type="text" className={fieldClass} {...register('fullName')} />
          </Field>
          <Field label="Số điện thoại" error={errors.phoneNumber?.message}>
            <input type="tel" className={fieldClass} {...register('phoneNumber')} />
          </Field>
          <Field label="Vai trò" error={errors.role?.message}>
            <select className={fieldClass} {...register('role')}>
              {ADMIN_USER_ASSIGNABLE_ROLES.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input text-emerald-700 focus:ring-emerald-500/40"
              {...register('isEmailVerified')}
            />
            Đã xác minh email
          </label>
          <DialogFormActions
            pending={updateUser.isPending}
            onCancel={onClose}
            submitLabel="Lưu thay đổi"
          />
        </form>
      )}
    </AdminUserDialogShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function DialogFormActions({
  pending,
  onCancel,
  submitLabel,
}: {
  pending: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
      >
        Hủy
      </button>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {submitLabel}
      </button>
    </div>
  );
}
