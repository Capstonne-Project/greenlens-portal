'use client';

import { ValidatedInput } from '@/components/common/ValidatedField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateAdminUser } from '@/hooks/useAdminUsers';
import {
  ADMIN_USER_ASSIGNABLE_ROLES,
  type AdminUserAssignableRole,
} from '@/lib/constants/adminUsersNav';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
  const [showPassword, setShowPassword] = useState(false);
  const isBusy = createUser.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
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
    setShowPassword(false);
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

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen && !isBusy) onClose();
      }}
    >
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        onInteractOutside={e => {
          if (isBusy) e.preventDefault();
        }}
        onEscapeKeyDown={e => {
          if (isBusy) e.preventDefault();
        }}
      >
        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="space-y-5 px-8 pb-8 pt-8 md:px-10 md:pb-10 md:pt-10">
            <DialogHeader className="space-y-2 pr-8 text-left">
              <DialogTitle className="flex items-center gap-2.5">
                <UserPlus className="size-4 shrink-0 text-foreground" aria-hidden />
                Thêm thành viên
              </DialogTitle>
              <DialogDescription>
                Tạo tài khoản mới trên hệ thống. Mật khẩu phải đủ 8 ký tự, chữ hoa, chữ thường, số
                và ký tự đặc biệt.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label>Email</Label>
              <ValidatedInput
                type="email"
                autoComplete="off"
                {...register('email')}
                value={watch('email') ?? ''}
                minLength={1}
                maxLength={254}
                error={errors.email?.message}
              />
            </div>

            <div className="space-y-2">
              <Label>Mật khẩu</Label>
              <div className="relative">
                <ValidatedInput
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="no-native-reveal pr-10"
                  {...register('password')}
                  value={watch('password') ?? ''}
                  minLength={8}
                  maxLength={128}
                  error={errors.password?.message}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-0 size-9 text-muted-foreground"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
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
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-slate-50 px-8 py-5 sm:space-x-0 md:px-10">
            <Button type="button" variant="outline" disabled={isBusy} onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isBusy}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
                  Đang thêm...
                </>
              ) : (
                'Thêm'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
