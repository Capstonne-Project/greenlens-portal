'use client';

import { AuthFormLayout } from '@/components/auth/AuthFormLayout';
import { GreenLensLogo } from '@/components/auth/GreenLensLogo';
import { getForgotPasswordErrorMessage, useForgotPassword } from '@/hooks/useAuth';
import { resolveApiToastMessage } from '@/utils/apiToastMessage';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const forgotSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

function ForgotPasswordFormCard() {
  const router = useRouter();
  const forgot = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });

  const onSubmit = handleSubmit(values => {
    const email = values.email.trim();
    forgot.mutate(
      { email },
      {
        onSuccess: env => {
          toast.success(
            resolveApiToastMessage(
              env.data?.message ?? env.message,
              'Đã gửi mã OTP tới email của bạn. Vui lòng kiểm tra hộp thư.'
            )
          );
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        },
        onError: err => toast.error(getForgotPasswordErrorMessage(err)),
      }
    );
  });

  return (
    <article className="login-form-panel w-full">
      <header>
        <GreenLensLogo className="text-[1.65rem]" />
        <p className="login-form-kicker">Khôi phục tài khoản</p>
        <h1 className="login-form-title">Quên mật khẩu</h1>
        <p className="login-form-lead">
          Nhập email đã đăng ký. Hệ thống sẽ gửi mã OTP để bạn đặt lại mật khẩu.
        </p>
      </header>

      <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
        <div className="login-form-field">
          <label htmlFor="forgot-email" className="login-form-label">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            className="login-form-input"
            placeholder="ten@email.com"
            {...register('email')}
          />
          {errors.email && <p className="login-form-error">{errors.email.message}</p>}
        </div>

        <button type="submit" disabled={forgot.isPending} className="login-form-submit">
          {forgot.isPending ? (
            'Đang gửi OTP…'
          ) : (
            <>
              Gửi mã OTP
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </button>
      </form>

      <p className="login-form-footnote">
        <Link href="/login" className="login-form-link">
          Quay lại đăng nhập
        </Link>
      </p>
    </article>
  );
}

export function ForgotPasswordScreen() {
  return <AuthFormLayout renderPanel={() => <ForgotPasswordFormCard />} />;
}
