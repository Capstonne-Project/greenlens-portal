'use client';

import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
  adminTableCellPad,
} from '@/components/admin/shared/adminDataTableChrome';
import { AdminUserChangeRoleDialog } from '@/components/admin/users/AdminUserChangeRoleDialog';
import { AdminUserCreateDialog } from '@/components/admin/users/AdminUserCreateDialog';
import { AdminUserDeleteDialog } from '@/components/admin/users/AdminUserDeleteDialog';
import { AdminUserDetailDialog } from '@/components/admin/users/AdminUserDetailDialog';
import { AdminUserEditDialog } from '@/components/admin/users/AdminUserEditDialog';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminUsersList } from '@/hooks/useAdminUsers';
import type { AdminUser, AdminUserDetail } from '@/lib/api/models/adminUser';
import { ADMIN_USERS_PAGE_SIZE } from '@/lib/constants/adminUsersNav';
import { cn } from '@/lib/utils';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { roleBadgeClasses, roleDisplayVi } from '@/utils/adminUserUi';
import { Download, Eye, Loader2, Pencil, Search, Trash2, UserCog } from 'lucide-react';
import Image from 'next/image';
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
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [changeRoleUser, setChangeRoleUser] = useState<AdminUser | AdminUserDetail | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: ADMIN_USERS_PAGE_SIZE,
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
    <div className="w-full min-w-0 space-y-4">
      <p className="border-b border-border pb-3 text-sm text-muted-foreground">
        {subtitleParts.join(' · ')}
      </p>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Tổng bản ghi',
            value: pagination ? pagination.totalItems.toLocaleString('vi-VN') : '—',
            hint: apiRole ? `Lọc: ${roleDisplayVi(apiRole)}` : 'Mọi vai trò',
            ring: 100,
          },
          {
            label: 'Kích thước trang',
            value: String(pagination?.pageSize ?? ADMIN_USERS_PAGE_SIZE),
            hint: 'Mỗi trang',
            ring: Math.min(100, (pagination?.pageSize ?? ADMIN_USERS_PAGE_SIZE) * 5),
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
          <Select
            value={verifiedParam ?? 'all'}
            onValueChange={v => {
              const next = new URLSearchParams(searchParams.toString());
              if (v === 'all') next.delete('verified');
              else next.set('verified', v);
              next.set('page', '1');
              router.push(`${pathname}?${next.toString()}`);
            }}
          >
            <SelectTrigger
              id="verified-filter"
              className="h-10 w-[14rem] rounded-lg"
              aria-label="Trạng thái xác minh email"
            >
              <SelectValue placeholder="Xác minh email: Tất cả" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value="all">Xác minh email: Tất cả</SelectItem>
              <SelectItem value="true">Đã xác minh</SelectItem>
              <SelectItem value="false">Chưa xác minh</SelectItem>
            </SelectContent>
          </Select>
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

      <div className={ADMIN_TABLE_SHELL}>
        <div className={ADMIN_TABLE_SCROLL}>
          <Table className={ADMIN_TABLE_CLASS}>
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}>
                <TableHead
                  className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('first', 'head'))}
                >
                  Họ tên
                </TableHead>
                <TableHead
                  className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                >
                  Liên hệ
                </TableHead>
                <TableHead
                  className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                >
                  Vai trò
                </TableHead>
                <TableHead
                  className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                >
                  Ngày tạo
                </TableHead>
                <TableHead
                  className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                >
                  Trạng thái email
                </TableHead>
                <TableHead
                  className={cn(
                    ADMIN_TABLE_HEAD_CELL,
                    adminTableCellPad('last', 'head'),
                    'w-56 whitespace-nowrap text-right'
                  )}
                >
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={6} className="h-40 px-6 py-4 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={6} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">
                      {getAdminUserMutationError(error, 'Không tải được danh sách người dùng.')}
                    </p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={6} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <SaveIcon size={32} className="opacity-30" />
                      <span>Không có người dùng phù hợp.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(user => (
                  <TableRow
                    key={user.id}
                    className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-sky-50/40')}
                  >
                    <TableCell className={cn(adminTableCellPad('first'), 'align-middle')}>
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
                    </TableCell>
                    <TableCell
                      className={cn(adminTableCellPad('middle'), 'max-w-[220px] align-middle')}
                    >
                      <div className="truncate text-muted-foreground">{user.email}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {user.phoneNumber ?? '—'}
                      </div>
                    </TableCell>
                    <TableCell className={cn(adminTableCellPad('middle'), 'align-middle')}>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeClasses(user.role)}`}
                      >
                        {roleDisplayVi(user.role)}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        adminTableCellPad('middle'),
                        'whitespace-nowrap align-middle text-muted-foreground'
                      )}
                    >
                      {formatCreatedAt(user.createdAt)}
                    </TableCell>
                    <TableCell className={cn(adminTableCellPad('middle'), 'align-middle')}>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`size-2 shrink-0 rounded-full ${user.isEmailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          aria-hidden
                        />
                        {user.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        adminTableCellPad('last'),
                        'w-56 whitespace-nowrap text-right align-middle'
                      )}
                    >
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailUserId(user.id)}
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label="Xem chi tiết người dùng"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setChangeRoleUser(user)}
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label="Đổi vai trò"
                        >
                          <UserCog className="size-4" />
                        </button>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
              {pagination.totalPages > 1 ? (
                <PaginationSimple
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={p => setQuery({ page: String(p) })}
                  className="w-auto"
                />
              ) : null}
            </div>
            <p className="shrink-0 text-xs text-slate-500 tabular-nums">
              {pagination.totalItems.toLocaleString('vi-VN')} rows
            </p>
          </div>
        ) : null}
      </div>

      <AdminUserCreateDialog
        open={createOpen}
        defaultRole={apiRole}
        onClose={() => setCreateOpen(false)}
      />
      <AdminUserEditDialog user={editUser} onClose={() => setEditUser(null)} />
      <AdminUserDeleteDialog user={deleteUser} onClose={() => setDeleteUser(null)} />
      <AdminUserDetailDialog
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
        onChangeRole={user => {
          setDetailUserId(null);
          setChangeRoleUser(user);
        }}
      />
      <AdminUserChangeRoleDialog user={changeRoleUser} onClose={() => setChangeRoleUser(null)} />
    </div>
  );
}
