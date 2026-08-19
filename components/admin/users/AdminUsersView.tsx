'use client';

import {
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_PAGINATION_META,
  adminTableCellPadCompact,
} from '@/components/admin/shared/adminDataTableChrome';
import { AdminUserChangeRoleDialog } from '@/components/admin/users/AdminUserChangeRoleDialog';
import { AdminUserCreateDialog } from '@/components/admin/users/AdminUserCreateDialog';
import { AdminUserDeleteDialog } from '@/components/admin/users/AdminUserDeleteDialog';
import { AdminUserDetailDialog } from '@/components/admin/users/AdminUserDetailDialog';
import { AdminUserEditDialog } from '@/components/admin/users/AdminUserEditDialog';
import { AdminUserSummaryStrip } from '@/components/admin/users/AdminUserSummaryStrip';
import { AdminSearchField } from '@/components/admin/shared/AdminSearchField';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GreenLensLookupSpinner } from '@/components/ui/greenlens-lookup-spinner';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminUsersList } from '@/hooks/useAdminUsers';
import type { AdminUser, AdminUserDetail } from '@/lib/api/models/adminUser';
import { ADMIN_USERS_PAGE_SIZE } from '@/lib/constants/adminUsersNav';
import { cn } from '@/lib/utils';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { roleBadgeClasses, roleDisplayVi } from '@/utils/adminUserUi';
import { Eye, Pencil, Trash2, UserCog } from 'lucide-react';
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

/** Tìm kiếm người dùng — debounce, không label. */
function AdminUsersSearchField({
  searchQ,
  pathname,
  searchParams,
}: {
  searchQ: string;
  pathname: string;
  searchParams: URLSearchParams;
}) {
  const router = useRouter();

  const commitSearch = useCallback(
    (q: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (q) next.set('search', q);
      else next.delete('search');
      next.set('page', '1');
      router.push(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <AdminSearchField
      label=""
      value={searchQ}
      onCommit={commitSearch}
      placeholder="Họ tên, email, số điện thoại..."
      className="min-w-55 flex-1"
    />
  );
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

  return (
    /* Viewport-fit layout: toolbar fixed, only table area scrolls */
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      {/* ── Toolbar (fixed height, never scrolls) ─────────────────────────── */}
      <div className="shrink-0 space-y-4 pb-8">
        <AdminUserSummaryStrip
          totalItems={pagination?.totalItems ?? null}
          onPageCount={items.length}
          verifiedOnPage={verifiedOnPage}
          unverifiedOnPage={unverifiedOnPage}
        />

        {/* Filter row — single line on md+, wraps gracefully on mobile */}
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
          <AdminUsersSearchField
            searchQ={searchQ}
            pathname={pathname}
            searchParams={searchParams}
          />

          <div className="flex shrink-0 items-center gap-2 md:ml-auto">
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
                className="h-9 w-56"
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

            <Button
              size="sm"
              className="h-9 shrink-0 bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={() => setCreateOpen(true)}
            >
              + <span className="hidden sm:inline">Tạo tài khoản</span>
              <span className="sm:hidden">Tạo</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Table area (fills remaining height, header fixed, body scrolls) ─── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/*
          Enterprise pattern: render native <table> directly (bypassing shadcn
          wrapper div that breaks sticky thead) inside a single overflow-auto
          scroll container. thead uses position:sticky top-0 — works reliably
          because this div is the only scroll ancestor.
        */}
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-170 caption-bottom text-sm">
            <thead className="sticky top-0 z-10">
              <tr className={cn(ADMIN_TABLE_ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}>
                <th
                  className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPadCompact('first', 'head'))}
                >
                  Họ tên
                </th>
                <th
                  className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPadCompact('middle', 'head'))}
                >
                  Liên hệ
                </th>
                <th
                  className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPadCompact('middle', 'head'))}
                >
                  Vai trò
                </th>
                <th
                  className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPadCompact('middle', 'head'))}
                >
                  Ngày tạo
                </th>
                <th
                  className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPadCompact('middle', 'head'))}
                >
                  Trạng thái email
                </th>
                <th
                  className={cn(
                    ADMIN_TABLE_HEAD_CELL,
                    adminTableCellPadCompact('last', 'head'),
                    'w-44 whitespace-nowrap text-right'
                  )}
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isPending ? (
                <tr className={ADMIN_TABLE_ROW_BORDER}>
                  <td colSpan={6} className="h-32 px-6 py-3 text-center align-middle">
                    <GreenLensLookupSpinner className="mx-auto size-8" />
                  </td>
                </tr>
              ) : isError ? (
                <tr className={ADMIN_TABLE_ROW_BORDER}>
                  <td colSpan={6} className="h-32 px-6 py-3 text-center align-middle">
                    <p className="text-sm text-destructive">
                      {getAdminUserMutationError(error, 'Không tải được danh sách người dùng.')}
                    </p>
                    <Button variant="link" onClick={() => refetch()} className="mt-2 text-sky-700">
                      Thử lại
                    </Button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-transparent')}>
                  <td colSpan={6} className="h-32 px-6 py-3 text-center align-middle">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <SaveIcon size={32} className="opacity-30" />
                      <span>Không có người dùng phù hợp.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <TooltipProvider delayDuration={200}>
                  {items.map(user => (
                    <tr
                      key={user.id}
                      className={cn(ADMIN_TABLE_ROW_BORDER, 'transition-colors hover:bg-sky-50/40')}
                    >
                      <td className={cn(adminTableCellPadCompact('first'), 'align-middle')}>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 ring-2 ring-emerald-600/15">
                            {user.avatarUrl ? (
                              <AvatarImage asChild src={user.avatarUrl}>
                                <Image
                                  src={user.avatarUrl}
                                  alt=""
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </AvatarImage>
                            ) : null}
                            <AvatarFallback className="bg-emerald-600/15 text-[10px] font-bold text-emerald-900">
                              {initialsFromName(user.fullName || user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold text-foreground">
                            {user.fullName}
                          </span>
                        </div>
                      </td>
                      <td
                        className={cn(adminTableCellPadCompact('middle'), 'max-w-55 align-middle')}
                      >
                        <div className="truncate text-muted-foreground">{user.email}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {user.phoneNumber ?? '—'}
                        </div>
                      </td>
                      <td className={cn(adminTableCellPadCompact('middle'), 'align-middle')}>
                        <Badge
                          variant="outline"
                          className={cn('text-[11px] font-medium', roleBadgeClasses(user.role))}
                        >
                          {roleDisplayVi(user.role)}
                        </Badge>
                      </td>
                      <td
                        className={cn(
                          adminTableCellPadCompact('middle'),
                          'whitespace-nowrap align-middle text-muted-foreground'
                        )}
                      >
                        {formatCreatedAt(user.createdAt)}
                      </td>
                      <td className={cn(adminTableCellPadCompact('middle'), 'align-middle')}>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`size-2 shrink-0 rounded-full ${user.isEmailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            aria-hidden
                          />
                          {user.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                        </span>
                      </td>
                      <td
                        className={cn(
                          adminTableCellPadCompact('last'),
                          'w-44 whitespace-nowrap text-right align-middle'
                        )}
                      >
                        <div className="inline-flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground"
                                onClick={() => setDetailUserId(user.id)}
                              >
                                <Eye className="size-3.5" />
                                <span className="sr-only">Xem chi tiết</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xem chi tiết</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground"
                                onClick={() => setChangeRoleUser(user)}
                              >
                                <UserCog className="size-3.5" />
                                <span className="sr-only">Đổi vai trò</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Đổi vai trò</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground"
                                onClick={() => setEditUser(user)}
                              >
                                <Pencil className="size-3.5" />
                                <span className="sr-only">Sửa</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Sửa người dùng</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setDeleteUser(user)}
                              >
                                <Trash2 className="size-3.5" />
                                <span className="sr-only">Xóa</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xóa người dùng</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </TooltipProvider>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer — pinned at bottom of the table card */}
        {pagination ? (
          <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-4 py-2.5">
            {pagination.totalPages > 1 ? (
              <PaginationSimple
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={p => setQuery({ page: String(p) })}
                className="w-auto"
              />
            ) : (
              <span />
            )}
            <p className={ADMIN_TABLE_PAGINATION_META}>
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
