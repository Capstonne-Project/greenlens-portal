'use client';

import { AdminUserCreateDialog } from '@/components/admin/users/AdminUserCreateDialog';
import { AdminUserDeleteDialog } from '@/components/admin/users/AdminUserDeleteDialog';
import { AdminUserEditDialog } from '@/components/admin/users/AdminUserEditDialog';
import { useAdminUsersList } from '@/hooks/useAdminUsers';
import type { AdminUser } from '@/lib/api/models/adminUser';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { roleBadgeClasses, roleDisplayVi } from '@/utils/adminUserUi';
import { ChevronLeft, ChevronRight, Download, Pencil, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

/** BE đôi khi trả DateTime mặc định .NET (0001-01-01) khi chưa lưu CreatedAt — không phải lỗi FE. */
function formatCreatedAt(iso: string): string {
  if (!iso?.trim()) return 'Chưa có ngày tạo';
  const s = iso.trim();
  if (s.startsWith('0001-01-01')) return 'Chưa có ngày tạo';
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return 'Chưa có ngày tạo';
    if (d.getFullYear() <= 1) return 'Chưa có ngày tạo';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return 'Chưa có ngày tạo';
  }
}

interface AdminUsersViewProps {
  /** Giá trị `role` gửi API — ví dụ `Admin`, `Citizen`. `undefined` = tất cả. */
  apiRole?: string;
}

export function AdminUsersView({ apiRole }: AdminUsersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const searchQ = searchParams.get('search') ?? '';
  const verifiedParam = searchParams.get('verified');
  const isEmailVerified: boolean | undefined =
    verifiedParam === 'true' ? true : verifiedParam === 'false' ? false : undefined;

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: 10,
      ...(searchQ.trim() ? { search: searchQ.trim() } : {}),
      ...(apiRole ? { role: apiRole } : {}),
      ...(isEmailVerified !== undefined ? { isEmailVerified } : {}),
    }),
    [page, searchQ, apiRole, isEmailVerified]
  );

  const { data, isPending, isError, error, refetch } = useAdminUsersList(queryParams);

  const setQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      });
      router.push(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const verifiedOnPage = items.filter(u => u.isEmailVerified).length;
  const unverifiedOnPage = items.length - verifiedOnPage;

  const subtitleParts = [
    `Người dùng`,
    pagination ? `${pagination.totalItems.toLocaleString('vi-VN')} tổng` : '…',
    `Trang ${pagination?.page ?? page}${pagination ? ` / ${pagination.totalPages}` : ''}`,
  ];

  return (
    <div className="w-full min-w-0 space-y-6">
      <p className="border-b border-border pb-6 text-sm text-muted-foreground">
        {subtitleParts.join(' · ')}
      </p>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Tổng bản ghi',
            value: pagination ? pagination.totalItems.toLocaleString('vi-VN') : '—',
            hint: apiRole ? `Lọc: ${roleDisplayVi(apiRole)}` : 'Mọi vai trò',
            ring: 100,
          },
          {
            label: 'Kích thước trang',
            value: String(pagination?.pageSize ?? 10),
            hint: 'Mỗi trang',
            ring: Math.min(100, (pagination?.pageSize ?? 10) * 5),
          },
          {
            label: 'Đã xác minh email (trang)',
            value: String(verifiedOnPage),
            hint: 'Theo dữ liệu trang hiện tại',
            ring: items.length ? Math.round((verifiedOnPage / items.length) * 100) : 0,
          },
          {
            label: 'Chưa xác minh (trang)',
            value: String(unverifiedOnPage),
            hint: 'Theo dữ liệu trang hiện tại',
            ring: items.length ? Math.round((unverifiedOnPage / items.length) * 100) : 0,
          },
        ].map(card => (
          <article
            key={card.label}
            className="rounded-card border border-border bg-card p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                <p className="mt-1 text-xs text-emerald-800/90">{card.hint}</p>
              </div>
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50 text-[11px] font-bold text-emerald-800"
                aria-hidden
              >
                {card.ring}%
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-4 shadow-sm md:flex-row md:flex-wrap md:items-center">
        <form
          onSubmit={e => {
            e.preventDefault();

            const formData = new FormData(e.currentTarget);

            const q = String(formData.get('q') ?? '').trim();

            const next = new URLSearchParams(searchParams.toString());

            if (q) next.set('search', q);
            else next.delete('search');

            next.set('page', '1');

            router.push(`${pathname}?${next.toString()}`);
          }}
          className="flex min-w-[220px] flex-1 items-center gap-2"
        >
          {' '}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={searchQ}
              placeholder="Họ tên, email, số điện thoại..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              aria-label="Tìm trong danh sách"
            />
          </div>
          <button
            type="submit"
            className="h-10 shrink-0 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Tìm
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="verified-filter">
            Trạng thái xác minh email
          </label>
          <select
            id="verified-filter"
            value={verifiedParam ?? ''}
            onChange={e => {
              const v = e.target.value;
              const next = new URLSearchParams(searchParams.toString());
              if (v === '') next.delete('verified');
              else next.set('verified', v);
              next.set('page', '1');
              router.push(`${pathname}?${next.toString()}`);
            }}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <option value="">Xác minh email: Tất cả</option>
            <option value="true">Đã xác minh</option>
            <option value="false">Chưa xác minh</option>
          </select>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground"
          >
            <Download className="size-4" />
            Xuất
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
          >
            + Tạo tài khoản
          </button>
        </div>
      </div>

      {isError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {getAdminUserMutationError(error, 'Không tải được danh sách người dùng.')}{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Thử lại
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-card border border-border bg-card shadow-sm">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground">
              <th className="px-4 py-3 font-medium">Họ tên</th>
              <th className="px-4 py-3 font-medium">Liên hệ</th>
              <th className="px-4 py-3 font-medium">Vai trò</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium">Trạng thái email</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isPending &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="h-10 animate-pulse rounded-lg bg-muted" />
                  </td>
                </tr>
              ))}
            {!isPending &&
              items.map(user => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-600/15">
                          <Image
                            src={user.avatarUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-xs font-bold text-emerald-900"
                          aria-hidden
                        >
                          {initialsFromName(user.fullName || user.email)}
                        </div>
                      )}
                      <span className="font-semibold text-foreground">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <div className="truncate text-muted-foreground">{user.email}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {user.phoneNumber ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeClasses(user.role)}`}
                    >
                      {roleDisplayVi(user.role)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatCreatedAt(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`size-2 shrink-0 rounded-full ${user.isEmailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        aria-hidden
                      />
                      {user.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditUser(user)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Sửa người dùng"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteUser(user)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Xóa người dùng"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!isPending && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Không có người dùng phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={!pagination.hasPrev}
            onClick={() => setQuery({ page: String(pagination.page - 1) })}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
            Trước
          </button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNext}
            onClick={() => setQuery({ page: String(pagination.page + 1) })}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
          >
            Sau
            <ChevronRight className="size-4" />
          </button>
          <Link
            href={`${pathname}?${(() => {
              const u = new URLSearchParams(searchParams.toString());
              u.set('page', String(pagination.totalPages));
              return u.toString();
            })()}`}
            className="text-sm text-emerald-800 underline-offset-4 hover:underline"
          >
            Trang cuối ({pagination.totalPages})
          </Link>
        </div>
      )}

      <AdminUserCreateDialog
        open={createOpen}
        defaultRole={apiRole}
        onClose={() => setCreateOpen(false)}
      />
      <AdminUserEditDialog user={editUser} onClose={() => setEditUser(null)} />
      <AdminUserDeleteDialog user={deleteUser} onClose={() => setDeleteUser(null)} />
    </div>
  );
}
