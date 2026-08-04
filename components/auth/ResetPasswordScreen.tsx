'use client';

import { AuthFormLayout } from '@/components/auth/AuthFormLayout';
import { GreenLensLogo } from '@/components/auth/GreenLensLogo';
import { getResetPasswordErrorMessage, useResetPassword } from '@/hooks/useAuth';
import { resolveApiToastMessage } from '@/utils/apiToastMessage';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const resetSchema = z
  .object({
    email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    otpCode: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập mã OTP')
      .regex(/^\d{6}$/, 'Mã OTP gồm 6 chữ số'),
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
  });

type ResetFormValues = z.infer<typeof resetSchema>;

type ResetPasswordFormCardProps = {
  presetEmail: string;
};

function ResetPasswordFormCard({ presetEmail }: ResetPasswordFormCardProps) {
  const reset = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: presetEmail,
      otpCode: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = handleSubmit(values => {
    reset.mutate(
      {
        email: values.email.trim(),
        otpCode: values.otpCode.trim(),
        newPassword: values.newPassword,
      },
      {
        onSuccess: env => {
          toast.success(
            resolveApiToastMessage(
              env.data?.message ?? env.message,
              'Đã đặt lại mật khẩu. Vui lòng đăng nhập.'
            )
          );
        },
        onError: err => toast.error(getResetPasswordErrorMessage(err)),
      }
    );
  });

  return (
    <article className="login-form-panel w-full">
      <header>
        <GreenLensLogo className="text-[1.65rem]" />
        <p className="login-form-kicker">Khôi phục tài khoản</p>
        <h1 className="login-form-title">Đặt lại mật khẩu</h1>
        <p className="login-form-lead">
          Nhập mã OTP từ email và mật khẩu mới (OTP có hiệu lực 10 phút).
        </p>
      </header>

      <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
        <div className="login-form-field">
          <label htmlFor="reset-email" className="login-form-label">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            className="login-form-input"
            {...register('email')}
          />
          {errors.email && <p className="login-form-error">{errors.email.message}</p>}
        </div>

        <div className="login-form-field">
          <label htmlFor="reset-otp" className="login-form-label">
            Mã OTP
          </label>
          <input
            id="reset-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="login-form-input tracking-widest"
            placeholder="123456"
            {...register('otpCode')}
          />
          {errors.otpCode && <p className="login-form-error">{errors.otpCode.message}</p>}
        </div>

        <div className="login-form-field">
          <label htmlFor="reset-new-password" className="login-form-label">
            Mật khẩu mới
          </label>
          <div className="login-form-password-wrap">
            <input
              id="reset-new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="login-form-input no-native-reveal pr-10"
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="login-form-password-toggle"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
          {errors.newPassword && <p className="login-form-error">{errors.newPassword.message}</p>}
        </div>

        <div className="login-form-field">
          <label htmlFor="reset-confirm-password" className="login-form-label">
            Xác nhận mật khẩu
          </label>
          <input
            id="reset-confirm-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className="login-form-input"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="login-form-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button type="submit" disabled={reset.isPending} className="login-form-submit">
          {reset.isPending ? (
            'Đang lưu…'
          ) : (
            <>
              Đặt lại mật khẩu
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </button>
      </form>

      <p className="login-form-footnote">
        <Link href="/forgot-password" className="login-form-link">
          Gửi lại mã OTP
        </Link>
        {' · '}
        <Link href="/login" className="login-form-link">
          Đăng nhập
        </Link>
      </p>
    </article>
  );
}

export function ResetPasswordScreen() {
  const searchParams = useSearchParams();
  const presetEmail = searchParams.get('email')?.trim() ?? '';

  return <AuthFormLayout renderPanel={() => <ResetPasswordFormCard presetEmail={presetEmail} />} />;
}
