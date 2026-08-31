'use client';

import { GreenLensLogo } from '@/components/auth/GreenLensLogo';
import { LoginFormMotion } from '@/components/auth/login-hero/LoginFormMotion';
import { LoginHeroScene } from '@/components/auth/login-hero/LoginHeroScene';
import '@/components/auth/login-hero/login-hero.css';
import { getLoginErrorMessage, useLogin } from '@/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  acceptTerms: z.boolean().refine(v => v === true, {
    message: 'Bạn cần đồng ý điều khoản để tiếp tục',
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginFormCard({ className }: { className?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from');
  const login = useLogin({ redirectTo });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      acceptTerms: false,
    },
  });

  const onSubmit = handleSubmit(values => {
    login.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onError: err => toast.error(getLoginErrorMessage(err)),
      }
    );
  });

  return (
    <article className={`login-form-panel ${className ?? ''}`}>
      <header>
        <GreenLensLogo className="text-[1.65rem]" />
        <p className="login-form-kicker">Cổng báo cáo ô nhiễm</p>
        <h1 className="login-form-title">Đăng nhập tài khoản</h1>
        <p className="login-form-lead">
          Dành cho công dân, cán bộ môi trường và đơn vị xử lý đã được cấp quyền.
        </p>
      </header>

      <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
        <div className="login-form-field">
          <label htmlFor="email" className="login-form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="login-form-input"
            placeholder="ten@email.com"
            {...register('email')}
          />
          {errors.email && <p className="login-form-error">{errors.email.message}</p>}
        </div>

        <div className="login-form-field">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="password" className="login-form-label">
              Mật khẩu
            </label>
            <Link href="/forgot-password" className="login-form-link">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="login-form-password-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="login-form-input no-native-reveal pr-10"
              placeholder="Nhập mật khẩu"
              {...register('password')}
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
          {errors.password && <p className="login-form-error">{errors.password.message}</p>}
        </div>

        <label className="login-form-terms">
          <Controller
            name="acceptTerms"
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                checked={field.value}
                onChange={e => field.onChange(e.target.checked)}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <span>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của GreenLens.</span>
        </label>
        {errors.acceptTerms && <p className="login-form-error">{errors.acceptTerms.message}</p>}

        <button type="submit" disabled={login.isPending} className="login-form-submit">
          {login.isPending ? (
            'Đang đăng nhập…'
          ) : (
            <>
              Vào hệ thống
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </button>
      </form>

      <p className="login-form-footnote">GreenLens · SU26SE049 · Term IX</p>
    </article>
  );
}

export function LoginScreen() {
  return (
    <>
      {/* Desktop: full-screen hero + form ở giữa */}
      <div className="relative hidden min-h-screen overflow-hidden lg:block">
        <LoginHeroScene />
        <div className="login-hero-center-slot">
          <LoginFormMotion className="w-full">
            <LoginFormCard />
          </LoginFormMotion>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#eef2ea] lg:hidden">
        <aside className="relative w-full min-w-0">
          <div className="relative h-52 w-full sm:h-60">
            <Image
              src="/images/login-hero1.png"
              alt="Protect our Planet — hành động vì môi trường"
              fill
              priority
              sizes="(min-width: 1024px) 1px, 100vw"
              className="object-cover object-[center_38%]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a2e1f]/80 via-transparent to-black/15"
              aria-hidden
            />
            <div className="absolute inset-x-0 top-0 p-4 sm:p-5">
              <GreenLensLogo variant="onImage" className="text-2xl sm:text-3xl" />
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/85">
                Nền tảng crowdsourcing báo cáo ô nhiễm môi trường — minh bạch, nhanh chóng, vì một
                môi trường xanh hơn.
              </p>
            </div>
          </div>
        </aside>

        <div className="relative flex w-full min-w-0 flex-col justify-center px-4 pb-10 pt-6 sm:px-6">
          <div className="mx-auto w-full max-w-[400px]">
            <LoginFormCard />
          </div>
        </div>
      </div>
    </>
  );
}
