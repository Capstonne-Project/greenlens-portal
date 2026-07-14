'use client';

import { AdminUserChangeRoleDialog } from '@/components/admin/users/AdminUserChangeRoleDialog';
import { AdminUserDialogShell } from '@/components/admin/users/AdminUserDialogShell';
import { useAdminUserDetail } from '@/hooks/useAdminUsers';
import type { AdminUserDetail } from '@/lib/api/models/adminUser';
import { getAdminUserMutationError, isAdminUserNotFound } from '@/utils/adminUserErrors';
import { roleBadgeClasses, roleDisplayVi } from '@/utils/adminUserUi';
import { Loader2, UserCog } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface AdminUserDetailDialogProps {
  userId: string | null;
  onClose: () => void;
  /** Called with loaded detail; if omitted, dialog opens change-role itself. */
  onChangeRole?: (user: AdminUserDetail) => void;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

/** BE đôi khi trả DateTime mặc định .NET (0001-01-01) khi chưa lưu — không phải lỗi FE. */
function formatAdminDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—';
  const s = iso.trim();
  if (s.startsWith('0001-01-01')) return 'Chưa có';
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return 'Chưa có';
    if (d.getFullYear() <= 1) return 'Chưa có';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return 'Chưa có';
  }
}

export function AdminUserDetailDialog({
  userId,
  onClose,
  onChangeRole,
}: AdminUserDetailDialogProps) {
  const { data, isPending, isError, error, refetch } = useAdminUserDetail(userId);
  const [internalChangeRole, setInternalChangeRole] = useState(false);

  const open = userId != null;
  const notFound = isAdminUserNotFound(error);

  const handleChangeRole = () => {
    if (!data) return;
    if (onChangeRole) {
      onChangeRole(data);
      return;
    }
    setInternalChangeRole(true);
  };

  const close = () => {
    setInternalChangeRole(false);
    onClose();
  };

  return (
    <>
      <AdminUserDialogShell
        open={open}
        title="Chi tiết người dùng"
        titleId="admin-user-detail-title"
        onClose={close}
      >
        {isPending && !data ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : null}

        {isError && !data ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-sm text-destructive">
              {notFound
                ? 'Không tìm thấy người dùng.'
                : getAdminUserMutationError(error, 'Không tải được chi tiết người dùng.')}
            </p>
            {!notFound ? (
              <button
                type="button"
                onClick={() => void refetch()}
                className="text-sm font-medium text-emerald-700 hover:underline"
              >
                Thử lại
              </button>
            ) : null}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={close}
                className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : null}

        {data ? (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              {data.avatarUrl ? (
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-600/15">
                  <Image src={data.avatarUrl} alt="" fill sizes="56px" className="object-cover" />
                </div>
              ) : (
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-sm font-bold text-emerald-900"
                  aria-hidden
                >
                  {initialsFromName(data.fullName || data.email)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">{data.fullName}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{data.email}</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeClasses(data.role)}`}
                >
                  {roleDisplayVi(data.role)}
                </span>
              </div>
            </div>

            <dl className="grid gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
              <DetailRow label="Số điện thoại" value={data.phoneNumber || '—'} />
              <DetailRow
                label="Xác minh email"
                value={data.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
              />
              <DetailRow label="Ngày tạo" value={formatAdminDate(data.createdAt)} />
              {data.updatedAt != null ? (
                <DetailRow label="Cập nhật" value={formatAdminDate(data.updatedAt)} />
              ) : null}
              {data.googleId ? <DetailRow label="Google ID" value={data.googleId} mono /> : null}
            </dl>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={close}
                className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleChangeRole}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
              >
                <UserCog className="size-4" aria-hidden />
                Đổi vai trò
              </button>
            </div>
          </div>
        ) : null}
      </AdminUserDialogShell>

      {!onChangeRole && data ? (
        <AdminUserChangeRoleDialog
          user={internalChangeRole ? data : null}
          onClose={() => setInternalChangeRole(false)}
        />
      ) : null}
    </>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={`text-foreground sm:text-right ${mono ? 'break-all font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
