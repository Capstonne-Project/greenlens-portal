'use client';

import { AdminUserDialogShell } from '@/components/admin/users/AdminUserDialogShell';
import { useAdminRoles, useChangeAdminUserRole } from '@/hooks/useAdminUsers';
import type { AdminUser, AdminUserDetail } from '@/lib/api/models/adminUser';
import { ADMIN_USER_ASSIGNABLE_ROLES } from '@/lib/constants/adminUsersNav';
import { normalizeApiRole } from '@/lib/constants/systemRoles';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { roleDisplayVi } from '@/utils/adminUserUi';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

function createChangeRoleSchema(currentRole: string) {
  return z
    .object({
      newRole: z.string().trim().min(1, 'Vui lòng chọn vai trò mới'),
    })
    .refine(data => normalizeApiRole(data.newRole) !== normalizeApiRole(currentRole), {
      message: 'Vai trò mới phải khác vai trò hiện tại',
      path: ['newRole'],
    });
}

type ChangeRoleFormValues = z.infer<ReturnType<typeof createChangeRoleSchema>>;

interface AdminUserChangeRoleDialogProps {
  user: AdminUser | AdminUserDetail | null;
  onClose: () => void;
}

export function AdminUserChangeRoleDialog({ user, onClose }: AdminUserChangeRoleDialogProps) {
  return (
    <AdminUserDialogShell
      open={user != null}
      title="Đổi vai trò"
      titleId="admin-user-change-role-title"
      onClose={onClose}
    >
      {user ? <ChangeRoleForm key={user.id} user={user} onClose={onClose} /> : null}
    </AdminUserDialogShell>
  );
}

function ChangeRoleForm({
  user,
  onClose,
}: {
  user: AdminUser | AdminUserDetail;
  onClose: () => void;
}) {
  const changeRole = useChangeAdminUserRole();
  const { data: roles, isLoading: rolesLoading, isError: rolesError } = useAdminRoles();

  const schema = useMemo(() => createChangeRoleSchema(user.role), [user.role]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeRoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newRole: '' },
  });

  useEffect(() => {
    reset({ newRole: '' });
  }, [user.id, reset]);

  const roleOptions = useMemo(() => {
    if (roles && roles.length > 0) {
      return roles.map(r => ({
        value: r.name,
        label: r.description?.trim() ? `${r.name} — ${r.description}` : roleDisplayVi(r.name),
      }));
    }
    return ADMIN_USER_ASSIGNABLE_ROLES.map(r => ({ value: r.value, label: r.label }));
  }, [roles]);

  const usedFallback = !roles || roles.length === 0 || rolesError;

  const onSubmit = handleSubmit(values => {
    changeRole.mutate(
      { id: user.id, newRole: values.newRole },
      {
        onSuccess: env => {
          toast.success(env.message || 'Đổi vai trò thành công');
          onClose();
        },
        onError: err => toast.error(getAdminUserMutationError(err, 'Không thể đổi vai trò')),
      }
    );
  });

  const fieldClass =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm">
        <p className="font-medium text-foreground">{user.fullName}</p>
        <p className="mt-0.5 text-muted-foreground">{user.email}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Vai trò hiện tại:{' '}
          <span className="font-medium text-foreground">{roleDisplayVi(user.role)}</span>
        </p>
      </div>

      {usedFallback && !rolesLoading ? (
        <p className="text-xs text-amber-800">
          Không tải được danh sách role từ máy chủ — đang dùng danh sách mặc định.
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="admin-user-new-role" className="text-sm font-medium text-foreground">
          Vai trò mới <span className="text-destructive">*</span>
        </label>
        <select
          id="admin-user-new-role"
          className={fieldClass}
          disabled={rolesLoading || changeRole.isPending}
          {...register('newRole')}
        >
          <option value="">{rolesLoading ? 'Đang tải vai trò…' : 'Chọn vai trò'}</option>
          {roleOptions.map(r => (
            <option
              key={r.value}
              value={r.value}
              disabled={normalizeApiRole(r.value) === normalizeApiRole(user.role)}
            >
              {r.label}
            </option>
          ))}
        </select>
        {errors.newRole ? (
          <p className="text-xs font-medium text-destructive">{errors.newRole.message}</p>
        ) : null}
      </div>

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
          disabled={changeRole.isPending || rolesLoading}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {changeRole.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Xác nhận đổi
        </button>
      </div>
    </form>
  );
}
