'use client';

import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useUser';
import { userProfileToAuthUser } from '@/lib/auth/profileMappers';
import { useAuthStore } from '@/lib/store/authStore';
import { formatCompanyDateTime } from '@/utils/companyUi';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Camera,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { type ChangeEvent, useEffect, useRef } from 'react';
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

function roleLabel(role: string | undefined): string {
  if (!role) return '—';
  if (role === 'CompanyManager') return 'Quản lý công ty';
  if (role === 'CompanyStaff') return 'Nhân viên công ty';
  return role;
}

export function CompanyAccountView() {
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
  const avatarFallback = profile?.fullName?.trim()?.slice(0, 1)?.toUpperCase() ?? '?';

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
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-emerald-100 bg-white dark:border-border dark:bg-card">
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <Loader2 className="size-7 animate-spin text-emerald-600" aria-hidden />
          <p className="text-sm font-semibold text-foreground">Đang tải hồ sơ</p>
          <p className="text-sm text-muted-foreground">Vui lòng chờ trong giây lát…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 space-y-2">
            <p className="font-semibold text-destructive">Không tải được hồ sơ</p>
            <p className="text-muted-foreground">
              {(error as Error)?.message ?? 'Đã có lỗi xảy ra khi tải thông tin hồ sơ.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <RefreshCw className="size-4" aria-hidden />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-w-0 space-y-4">
      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white dark:border-border dark:bg-card">
        <div className="bg-emerald-600 px-4 py-4 text-white sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
            Tài khoản công ty
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">Tài khoản của tôi</h1>
          <p className="mt-1 max-w-2xl text-sm text-emerald-50/90">
            Quản lý thông tin cá nhân và ảnh đại diện dùng trong cổng công ty.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-emerald-100 bg-white p-5 dark:border-border dark:bg-card">
            <div className="relative mx-auto size-24">
              <div className="relative size-24 overflow-hidden rounded-full border-2 border-emerald-100 bg-emerald-50">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt="Ảnh đại diện"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-3xl font-bold text-emerald-700">
                    {avatarFallback}
                  </div>
                )}

                {uploadAvatar.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 className="size-6 animate-spin text-emerald-600" aria-hidden />
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={uploadAvatar.isPending}
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-50"
                aria-label="Đổi ảnh đại diện"
              >
                <Camera className="size-4" aria-hidden />
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_ACCEPT.join(',')}
              className="sr-only"
              onChange={onPickAvatar}
            />

            <div className="mt-4 text-center">
              <h2 className="text-base font-bold text-foreground">
                {profile?.fullName ?? 'Chưa có tên'}
              </h2>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{profile?.email}</p>
            </div>

            <button
              type="button"
              disabled={uploadAvatar.isPending}
              onClick={() => fileRef.current?.click()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-border dark:bg-muted dark:text-foreground dark:hover:bg-muted/80"
            >
              {uploadAvatar.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Đang tải ảnh…
                </>
              ) : (
                <>
                  <Camera className="size-4" aria-hidden />
                  Đổi ảnh đại diện
                </>
              )}
            </button>

            <p className="mt-2 text-center text-xs text-muted-foreground">
              JPG, PNG, WebP — tối đa 5MB.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-5 dark:border-border dark:bg-card">
            <h3 className="text-sm font-bold text-foreground">Trạng thái tài khoản</h3>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-border dark:bg-muted/40">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <BadgeCheck className="size-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Email</p>
                  <p className="text-xs text-muted-foreground">Xác minh tài khoản</p>
                </div>
              </div>
              <span
                className={
                  profile?.isEmailVerified
                    ? 'shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800'
                    : 'shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700'
                }
              >
                {profile?.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-border dark:bg-muted/40">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="size-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Vai trò</p>
                  <p className="text-xs text-muted-foreground">Quyền trong hệ thống</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                {roleLabel(profile?.role)}
              </span>
            </div>

            <div className="space-y-1.5 rounded-xl border border-emerald-100 p-3 text-xs text-muted-foreground dark:border-border">
              <p>
                <span className="font-medium text-foreground">Tạo lúc:</span>{' '}
                {formatCompanyDateTime(profile?.createdAt)}
              </p>
              <p>
                <span className="font-medium text-foreground">Cập nhật:</span>{' '}
                {formatCompanyDateTime(profile?.updatedAt)}
              </p>
            </div>

            <Link
              href="/company/notifications/preferences"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-100 px-3 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 dark:border-border dark:text-emerald-400 dark:hover:bg-muted"
            >
              <Bell className="size-4" aria-hidden />
              Cài đặt thông báo
            </Link>
          </section>
        </aside>

        <section className="rounded-2xl border border-emerald-100 bg-white p-5 dark:border-border dark:bg-card sm:p-6">
          <div className="flex flex-col gap-2 border-b border-emerald-100 pb-4 dark:border-border sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Thông tin cá nhân
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Cập nhật họ tên và số điện thoại hiển thị trong hệ thống.
              </p>
            </div>
            {isDirty && (
              <span className="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                Có thay đổi chưa lưu
              </span>
            )}
          </div>

          <form className="mt-5 space-y-5" onSubmit={onSubmit} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor="company-fullName"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <UserRound className="size-4 text-muted-foreground" aria-hidden />
                  Họ và tên
                </label>
                <input
                  id="company-fullName"
                  autoComplete="name"
                  placeholder="Nhập họ và tên"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="text-xs font-medium text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="company-email"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <Mail className="size-4 text-muted-foreground" aria-hidden />
                  Email
                </label>
                <input
                  id="company-email"
                  type="email"
                  value={profile?.email ?? ''}
                  readOnly
                  className="h-11 w-full cursor-not-allowed rounded-xl border border-dashed border-border bg-muted/50 px-3.5 text-sm text-muted-foreground outline-none"
                />
                <p className="text-xs text-muted-foreground">Email không thể thay đổi tại đây.</p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="company-phoneNumber"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <Phone className="size-4 text-muted-foreground" aria-hidden />
                  Số điện thoại
                </label>
                <input
                  id="company-phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="0955633245"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                  {...register('phoneNumber')}
                />
                {errors.phoneNumber && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3.5 dark:border-border dark:bg-muted/40">
              <p className="text-sm font-semibold text-emerald-950 dark:text-foreground">
                Thông tin dùng cho cổng công ty
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-900/70 dark:text-muted-foreground">
                Họ tên và ảnh đại diện hiển thị khi điều phối báo cáo, phân công và thông báo nội
                bộ.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2.5 border-t border-emerald-100 pt-5 dark:border-border sm:flex-row sm:justify-end">
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <RefreshCw className="size-4" aria-hidden />
                Hủy thay đổi
              </button>

              <button
                type="submit"
                disabled={!isDirty || updateProfile.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Đang lưu…
                  </>
                ) : (
                  <>
                    <Save className="size-4" aria-hidden />
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
