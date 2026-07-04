'use client';

import { getLoginErrorMessage, useLogin } from '@/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Leaf, Lock, LogIn, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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

function GreenLensLogo({
  className,
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'onImage';
}) {
  const text = variant === 'onImage' ? 'text-white' : 'text-emerald-600';
  const leaf = variant === 'onImage' ? 'text-emerald-300' : 'text-emerald-600';
  return (
    <span className={`inline-flex items-end font-bold tracking-tight ${text} ${className ?? ''}`}>
      GreenLe
      <span className="relative inline-block min-w-[0.65ch] text-center">
        n
        <Leaf
          className={`pointer-events-none absolute -top-2.5 left-1/2 size-[1.05em] max-h-5 -translate-x-1/2 sm:max-h-6 ${leaf}`}
          aria-hidden
          strokeWidth={2.5}
        />
      </span>
      s
    </span>
  );
}

export function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

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

  const inputClass =
    'h-12 w-full rounded-2xl border border-zinc-200/90 bg-white pl-11 pr-3 text-[15px] text-zinc-900 shadow-sm shadow-zinc-900/[0.02] outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:bg-white focus:shadow-md focus:shadow-emerald-900/[0.06] focus:ring-4 focus:ring-emerald-500/15';

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-br from-zinc-100/90 via-white to-emerald-50/50 lg:flex-row">
      {/* Left: hero */}
      <aside className="relative w-full min-w-0 lg:sticky lg:top-0 lg:min-h-screen lg:w-1/2 lg:shrink-0">
        <div className="relative h-56 w-full bg-emerald-900/20 sm:h-64 lg:absolute lg:inset-0 lg:h-full lg:min-h-screen">
          <Image
            src="/images/login-hero1.png"
            alt="Protect our Planet — hành động vì môi trường"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-[center_38%] lg:object-[center_42%]"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 lg:bg-gradient-to-r lg:from-black/35 lg:via-transparent lg:to-black/5"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8 xl:p-10">
            <div className="rounded-2xl border border-white/15 bg-black/25 p-5 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-6 lg:max-w-lg lg:p-7">
              <GreenLensLogo variant="onImage" className="text-3xl sm:text-4xl" />
              <p className="mt-3 text-sm leading-relaxed text-white/95 sm:text-base">
                Nền tảng crowdsourcing báo cáo ô nhiễm môi trường — minh bạch, nhanh chóng, vì một
                môi trường xanh hơn.
              </p>
              <p className="mt-5 border-t border-white/10 pt-4 text-xs text-white/50">
                © {new Date().getFullYear()} GreenLens · SU26SE049
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right: form */}
      <div className="relative flex w-full min-w-0 flex-col justify-center px-4 pb-12 pt-8 sm:px-8 lg:w-1/2 lg:min-h-screen lg:shrink-0 lg:py-16 lg:pl-12 xl:pl-20">
        <div className="mx-auto w-full max-w-[440px]">
          <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-8 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-zinc-900/[0.04] backdrop-blur-sm sm:p-10">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
              aria-hidden
            />
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <GreenLensLogo className="text-2xl" />
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-600/10 text-emerald-700 shadow-inner ring-1 ring-emerald-600/10">
                <LogIn className="size-6" aria-hidden strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-[1.65rem]">
                Đăng nhập
              </h1>
              <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-zinc-500">
                Sẵn sàng tạo thay đổi hôm nay?
              </p>
            </div>

            <form className="mt-9 space-y-5" onSubmit={onSubmit} noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-[13px] font-semibold tracking-wide text-zinc-600"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400"
                    aria-hidden
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={inputClass}
                    placeholder="admin@greenlens.com.vn"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-[13px] font-semibold tracking-wide text-zinc-600"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400"
                    aria-hidden
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`${inputClass} pr-12`}
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? (
                      <EyeOff className="size-[18px]" />
                    ) : (
                      <Eye className="size-[18px]" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-0.5">
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-medium text-emerald-700/90 underline-offset-4 hover:text-emerald-800 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <label className="flex cursor-pointer items-start gap-3.5 rounded-xl py-1 text-left text-sm leading-snug text-zinc-600 transition hover:bg-zinc-50/80">
                <Controller
                  name="acceptTerms"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      className="mt-1 size-[18px] shrink-0 rounded-md border-zinc-300 text-emerald-600 focus:ring-emerald-500/30"
                      checked={field.value}
                      onChange={e => field.onChange(e.target.checked)}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
                <span>Chấp nhận điều khoản sử dụng và chính sách của chúng tôi</span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs font-medium text-red-600">{errors.acceptTerms.message}</p>
              )}

              <button
                type="submit"
                disabled={login.isPending}
                className="relative h-[3.25rem] w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 text-[15px] font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:brightness-[1.05] hover:shadow-xl hover:shadow-emerald-900/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
              >
                <span className="relative z-10">
                  {login.isPending ? 'Đang đăng nhập…' : 'Hành động vì môi trường xanh'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
