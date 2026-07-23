'use client';

import { getChangePasswordErrorMessage, useChangePassword } from '@/hooks/useAuth';
import { getDashboardPathByRole } from '@/lib/auth/mapUser';
import { useAuthStore } from '@/lib/store/authStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, KeyRound, Leaf, Lock, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const renewSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu tạm hiện tại'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu mới tối thiểu 8 ký tự')
      .regex(/[A-Za-z]/, 'Mật khẩu mới cần ít nhất một chữ cái')
      .regex(/[0-9]/, 'Mật khẩu mới cần ít nhất một chữ số'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine(v => v.newPassword === v.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
  .refine(v => v.newPassword !== v.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu tạm',
    path: ['newPassword'],
  });

type RenewFormValues = z.infer<typeof renewSchema>;

function BrandMark() {
  return (
    <span className="inline-flex items-end text-xl font-bold tracking-tight text-emerald-700">
      GreenLe
      <span className="relative inline-block min-w-[0.65ch] text-center">
        n
        <Leaf
          className="pointer-events-none absolute -top-2.5 left-1/2 size-[1.05em] max-h-5 -translate-x-1/2 text-emerald-600"
          aria-hidden
          strokeWidth={2.5}
        />
      </span>
      s
    </span>
  );
}

export function RenewPasswordScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const mustChange = useAuthStore(s => s.user?.mustChangePassword);
  const changePassword = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RenewFormValues>({
    resolver: zodResolver(renewSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    // Only leave renew when flag is explicitly cleared (password already changed)
    if (mustChange === false) {
      router.replace(getDashboardPathByRole(user?.role ?? 'company'));
    }
  }, [isAuthenticated, mustChange, router, user?.role]);

  const onSubmit = handleSubmit(values => {
    changePassword.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          toast.success('Đã đổi mật khẩu — tài khoản đã được kích hoạt.');
        },
        onError: err => toast.error(getChangePasswordErrorMessage(err)),
      }
    );
  });

  const inputClass =
    'h-12 w-full rounded-2xl border border-zinc-200/90 bg-white pl-11 pr-12 text-[15px] text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-100/90 via-white to-emerald-50/50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/95 p-6 shadow-xl shadow-zinc-900/5 sm:p-8">
        <div className="mb-6 space-y-3 text-center">
          <BrandMark />
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <ShieldCheck className="size-6" aria-hidden />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Đổi mật khẩu lần đầu</h1>
          <p className="text-sm text-zinc-600">
            Tài khoản {user?.email ? <strong>{user.email}</strong> : 'của bạn'} đang dùng mật khẩu
            tạm. Hãy đặt mật khẩu mới để kích hoạt và vào cổng công ty.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Mật khẩu tạm hiện tại
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${inputClass} no-native-reveal`}
                {...register('currentPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:text-zinc-700"
                onClick={() => setShowCurrent(v => !v)}
                aria-label={showCurrent ? 'Ẩn mật khẩu tạm' : 'Hiện mật khẩu tạm'}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${inputClass} no-native-reveal`}
                {...register('newPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:text-zinc-700"
                onClick={() => setShowNew(v => !v)}
                aria-label={showNew ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${inputClass} no-native-reveal`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:text-zinc-700"
                onClick={() => setShowConfirm(v => !v)}
                aria-label={showConfirm ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={changePassword.isPending}
            className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {changePassword.isPending ? 'Đang kích hoạt…' : 'Đổi mật khẩu và kích hoạt'}
          </button>
        </form>
      </div>
    </div>
  );
}
