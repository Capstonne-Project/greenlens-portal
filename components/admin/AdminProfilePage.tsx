'use client';

import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useUser';
import { userProfileToAuthUser } from '@/lib/auth/profileMappers';
import { useAuthStore } from '@/lib/store/authStore';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BadgeCheck,
  Camera,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import { type ChangeEvent, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const profileFormSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên').max(160, 'Tối đa 160 ký tự'),
  phoneNumber: z.string().refine(
    val => {
      const t = val.trim();
      return t === '' || /^0\d{8,10}$/.test(t.replace(/\s/g, ''));
    },
    { message: 'Số điện thoại không hợp lệ (VD: 0955633245)' }
  ),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

export function AdminProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const updateUser = useAuthStore(s => s.updateUser);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
    },
  });

  useEffect(() => {
    if (!profile) return;

    reset({
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber ?? '',
    });

    updateUser(userProfileToAuthUser(profile));
  }, [profile, reset, updateUser]);

  const avatarSrc = profile?.avatarUrl;

  const avatarFallback = useMemo(() => {
    return profile?.fullName?.trim()?.slice(0, 1)?.toUpperCase() ?? '?';
  }, [profile?.fullName]);

  const onSubmit = handleSubmit(values => {
    updateProfile.mutate(
      {
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber.trim() || undefined,
      },
      {
        onSuccess: env => {
          toast.success(env.data?.message ?? env.message ?? 'Đã cập nhật hồ sơ');
        },
        onError: () => {
          toast.error('Không thể cập nhật hồ sơ');
        },
      }
    );
  });

  const onPickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    if (!AVATAR_ACCEPT.includes(file.type)) {
      toast.error('Chỉ chấp nhận JPG, PNG hoặc WebP');
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('Ảnh tối đa 5MB');
      return;
    }

    uploadAvatar.mutate(file, {
      onSuccess: env => {
        toast.success(env.data?.message ?? env.message ?? 'Đã cập nhật ảnh đại diện');
      },
      onError: () => {
        toast.error('Không thể tải ảnh lên');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 rounded-card border border-border bg-card px-10 py-8 shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Loader2 className="size-7 animate-spin" aria-hidden />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Đang tải hồ sơ</p>
            <p className="mt-1 text-sm text-muted-foreground">Vui lòng chờ trong giây lát…</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex min-h-[520px] max-w-xl items-center justify-center">
        <div className="w-full rounded-card border border-destructive/25 bg-destructive/5 p-8 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <RefreshCcw className="size-7" aria-hidden />
          </div>

          <h1 className="mt-5 text-xl font-bold text-foreground">Không tải được hồ sơ</h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {(error as Error)?.message ?? 'Đã có lỗi xảy ra khi tải thông tin hồ sơ.'}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <RefreshCcw className="size-4" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="relative overflow-hidden rounded-card border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="size-4" />
              Tài khoản quản trị
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Hồ sơ cá nhân
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Quản lý thông tin cá nhân, ảnh đại diện và quyền truy cập trong hệ thống báo cáo ô
              nhiễm môi trường.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-slate-500">Đăng nhập bằng</p>
            <p className="mt-0.5 font-semibold text-slate-900">
              {profile?.email ?? 'Không có email'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <section className="overflow-hidden rounded-card border border-border bg-card shadow-sm">
            <div className="h-24 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50" />

            <div className="-mt-14 px-6 pb-6">
              <div className="relative mx-auto size-28">
                <div className="relative size-28 overflow-hidden rounded-full border-4 border-background bg-muted shadow-md">
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt="Ảnh đại diện"
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-emerald-50 text-4xl font-bold text-emerald-700">
                      {avatarFallback}
                    </div>
                  )}

                  {uploadAvatar.isPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                      <Loader2 className="size-8 animate-spin text-emerald-600" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={uploadAvatar.isPending}
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-1 right-1 flex size-10 items-center justify-center rounded-full border-4 border-background bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                  aria-label="Đổi ảnh đại diện"
                >
                  <Camera className="size-4" />
                </button>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept={AVATAR_ACCEPT.join(',')}
                className="sr-only"
                onChange={onPickAvatar}
              />

              <div className="mt-5 text-center">
                <h2 className="text-lg font-bold text-foreground">
                  {profile?.fullName ?? 'Chưa có tên'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{profile?.email}</p>
              </div>

              <button
                type="button"
                disabled={uploadAvatar.isPending}
                onClick={() => fileRef.current?.click()}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:opacity-50"
              >
                {uploadAvatar.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang tải ảnh…
                  </>
                ) : (
                  <>
                    <Camera className="size-4" />
                    Đổi ảnh đại diện
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                Hỗ trợ JPG, PNG, WebP. Kích thước tối đa 5MB.
              </p>
            </div>
          </section>

          <section className="rounded-card border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Trạng thái tài khoản</h3>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-card border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <BadgeCheck className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email</p>
                    <p className="text-xs text-muted-foreground">Xác minh tài khoản</p>
                  </div>
                </div>

                <span
                  className={
                    profile?.isEmailVerified
                      ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700'
                      : 'rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700'
                  }
                >
                  {profile?.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-card border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Vai trò</p>
                    <p className="text-xs text-muted-foreground">Quyền trong hệ thống</p>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {profile?.role ?? 'User'}
                </span>
              </div>
            </div>
          </section>
        </aside>

        <section className="rounded-card border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-2 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Thông tin cá nhân
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cập nhật thông tin cơ bản dùng để hiển thị trong hệ thống.
              </p>
            </div>

            {isDirty && (
              <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                Có thay đổi chưa lưu
              </span>
            )}
          </div>

          <form className="mt-7 space-y-6" onSubmit={onSubmit} noValidate>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="fullName"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <UserRound className="size-4 text-muted-foreground" />
                  Họ và tên
                </label>

                <input
                  id="fullName"
                  autoComplete="name"
                  placeholder="Nhập họ và tên"
                  className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  {...register('fullName')}
                />

                {errors.fullName && (
                  <p className="text-xs font-medium text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <Mail className="size-4 text-muted-foreground" />
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={profile?.email ?? ''}
                  readOnly
                  className="h-12 w-full cursor-not-allowed rounded-2xl border border-dashed border-border bg-muted/50 px-4 text-sm text-muted-foreground outline-none"
                />

                <p className="text-xs text-muted-foreground">
                  Email không thể thay đổi tại màn hình này.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="phoneNumber"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <Phone className="size-4 text-muted-foreground" />
                  Số điện thoại
                </label>

                <input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="0955633245"
                  className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  {...register('phoneNumber')}
                />

                {errors.phoneNumber && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-card border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="size-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-emerald-950">
                    Thông tin này dùng cho tài khoản quản trị
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-900/70">
                    Họ tên và ảnh đại diện sẽ được hiển thị trong dashboard, lịch sử thao tác và các
                    hoạt động quản trị.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!profile) return;

                  reset({
                    fullName: profile.fullName,
                    phoneNumber: profile.phoneNumber ?? '',
                  });
                }}
                disabled={!isDirty || updateProfile.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <RefreshCcw className="size-4" />
                Hủy thay đổi
              </button>

              <button
                type="submit"
                disabled={!isDirty || updateProfile.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu…
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
