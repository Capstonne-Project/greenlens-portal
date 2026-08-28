'use client';

import { ADMIN_DIALOG_PRIMARY_BTN } from '@/components/admin/shared/adminUiTokens';
import { ValidatedInput } from '@/components/common/ValidatedField';
import { AdminUserDialogShell } from '@/components/admin/users/AdminUserDialogShell';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateAdminUser } from '@/hooks/useAdminUsers';
import {
  ADMIN_USER_ASSIGNABLE_ROLES,
  type AdminUserAssignableRole,
} from '@/lib/constants/adminUsersNav';
import { normalizeApiRole } from '@/lib/constants/systemRoles';
import type { AdminUser } from '@/lib/api/models/adminUser';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
    watch,
    control,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    ...REALTIME_FORM_OPTIONS,
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

          <div className="space-y-1.5">
            <Label>Họ tên</Label>
            <ValidatedInput
              type="text"
              {...register('fullName')}
              value={watch('fullName') ?? ''}
              minLength={1}
              maxLength={160}
              error={errors.fullName?.message}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Số điện thoại</Label>
            <ValidatedInput
              type="tel"
              {...register('phoneNumber')}
              value={watch('phoneNumber') ?? ''}
              minLength={0}
              maxLength={15}
              error={errors.phoneNumber?.message}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_USER_ASSIGNABLE_ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role ? (
              <p className="text-xs font-medium text-destructive">{errors.role.message}</p>
            ) : null}
          </div>

          <Controller
            control={control}
            name="isEmailVerified"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-email-verified"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="edit-email-verified" className="cursor-pointer">
                  Đã xác minh email
                </Label>
              </div>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={updateUser.isPending}
              className={ADMIN_DIALOG_PRIMARY_BTN}
            >
              {updateUser.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      )}
    </AdminUserDialogShell>
  );
}
