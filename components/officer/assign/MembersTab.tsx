'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { RecruitStaffDialog } from '@/components/officer/assign/RecruitStaffDialog';
import UsersIcon from '@/components/ui/users-icon';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useOfficeStaffList } from '@/hooks/useLeoOffices';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OfficeStaffAssignRole, OfficeStaffListParams } from '@/lib/api/models/office';
import { cn } from '@/lib/utils';
import { formatJoinedDateVi } from '@/utils/officerTracking';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { useMemo, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const MEMBERS_PER_PAGE = 10;

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-amber-100 text-amber-700',
];

type ColumnKey = 'name' | 'email' | 'team' | 'role' | 'joined' | 'actions';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'name', label: 'Họ tên', className: 'min-w-[180px]' },
  { key: 'email', label: 'Email', className: 'min-w-[200px]' },
  { key: 'team', label: 'Đội', className: 'min-w-[140px]' },
  { key: 'role', label: 'Vai trò', className: 'w-[130px]' },
  { key: 'joined', label: 'Ngày tham gia', className: 'w-[120px]' },
  { key: 'actions', label: '', className: 'w-12' },
];

type HasTeamFilter = 'all' | 'true' | 'false';

const HAS_TEAM_LABEL: Record<HasTeamFilter, string> = {
  all: 'Đội xử lý',
  true: 'Có đội',
  false: 'Chưa có đội',
};

type RoleFilter = 'all' | OfficeStaffAssignRole;

const ROLE_LABEL: Record<RoleFilter, string> = {
  all: 'Vai trò',
  Cleaner: 'Đội dọn dẹp (Cleaner)',
  Inspector: 'Thanh tra (Inspector)',
};

const ROLE_BADGE: Record<OfficeStaffAssignRole, string> = {
  Cleaner: 'Đội dọn dẹp',
  Inspector: 'Thanh tra',
};

function staffRoleBadge(role: string): string {
  if (role === 'Cleaner' || role === 'Inspector') return ROLE_BADGE[role];
  return role;
}

const FILTER_BTN_CLASS =
  'h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-sky-700';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function buildStaffParams(
  page: number,
  search: string,
  hasTeamFilter: HasTeamFilter,
  roleFilter: RoleFilter
): OfficeStaffListParams {
  const params: OfficeStaffListParams = {
    page,
    pageSize: MEMBERS_PER_PAGE,
  };
  if (search) params.search = search;
  if (roleFilter !== 'all') params.role = roleFilter;
  if (hasTeamFilter === 'true') params.hasTeam = true;
  if (hasTeamFilter === 'false') params.hasTeam = false;
  return params;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MembersTab() {
  const [hasTeamFilter, setHasTeamFilter] = useState<HasTeamFilter>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [memberPage, setMemberPage] = useState(1);
  const [recruitOpen, setRecruitOpen] = useState(false);

  const staffParams = useMemo(
    () => buildStaffParams(memberPage, debouncedSearch, hasTeamFilter, roleFilter),
    [memberPage, debouncedSearch, hasTeamFilter, roleFilter]
  );

  const {
    data: staffData,
    isPending: isLoadingMembers,
    isFetching,
    isError,
    refetch,
  } = useOfficeStaffList(staffParams);

  const members = staffData?.items ?? [];
  const pagination = staffData?.pagination;

  const handleSearch = (v: string) => {
    setSearch(v);
    setMemberPage(1);
  };

  const handleHasTeamChange = (value: HasTeamFilter) => {
    setHasTeamFilter(value);
    setMemberPage(1);
  };

  const handleRoleChange = (r: RoleFilter) => {
    setRoleFilter(r);
    setMemberPage(1);
  };

  return (
    <>
      <header className="mb-6 shrink-0">
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
                  {HAS_TEAM_LABEL[hasTeamFilter]}
                  <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {(Object.keys(HAS_TEAM_LABEL) as HasTeamFilter[]).map(key => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleHasTeamChange(key)}
                    className={hasTeamFilter === key ? 'font-medium text-sky-700' : ''}
                  >
                    {HAS_TEAM_LABEL[key]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
                  {ROLE_LABEL[roleFilter]}
                  <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {(Object.keys(ROLE_LABEL) as RoleFilter[]).map(key => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleRoleChange(key)}
                    className={roleFilter === key ? 'font-medium text-sky-700' : ''}
                  >
                    {ROLE_LABEL[key]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Tìm tên, email..."
              className="h-8 max-w-sm border-slate-200 bg-white text-sm shadow-none"
              aria-label="Tìm thành viên theo tên hoặc email"
            />
            {isFetching && !isLoadingMembers ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-slate-400" aria-hidden />
            ) : null}
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setRecruitOpen(true)}
            className="h-8 shrink-0 gap-1.5 bg-emerald-600 px-3 text-[0.8125rem] text-white hover:bg-emerald-500"
          >
            <Plus className="size-3.5" />
            Thêm
          </Button>
        </div>
      </header>

      <RecruitStaffDialog
        open={recruitOpen}
        onClose={() => setRecruitOpen(false)}
        onRecruited={() => setMemberPage(1)}
      />

      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/4%)]">
        <div className="flex-1 overflow-auto [&_table]:border-collapse">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMN_DEFS.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      'h-9 border-b border-slate-200 bg-slate-50/80 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                      col.className
                    )}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingMembers ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 text-center">
                    <p className="text-sm text-destructive">Không tải được danh sách thành viên.</p>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <UsersIcon size={32} className="opacity-30" />
                      <span>Không có thành viên.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member, idx) => (
                  <TableRow
                    key={member.userId}
                    className="cursor-pointer border-slate-100 hover:bg-sky-50/40"
                  >
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                            AVATAR_COLORS[
                              ((memberPage - 1) * MEMBERS_PER_PAGE + idx) % AVATAR_COLORS.length
                            ]
                          )}
                        >
                          {getInitials(member.fullName)}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800">
                            {member.fullName}
                          </span>
                          {member.isLeader ? (
                            <span className="text-[11px] font-medium text-amber-600">
                              Trưởng nhóm
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600">
                      {member.email}
                    </TableCell>
                    <TableCell className="px-3 py-6 text-sm text-slate-600">
                      {member.teamName ?? '—'}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                      >
                        {staffRoleBadge(member.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600">
                      {formatJoinedDateVi(member.createdAt)}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-slate-500 hover:text-slate-700"
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Xem hồ sơ</DropdownMenuItem>
                          <DropdownMenuItem>Đổi vai trò</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Xoá khỏi đội
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-500">
              Trang {pagination.page}/{Math.max(pagination.totalPages, 1)} · {pagination.totalItems}{' '}
              thành viên
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrev}
                onClick={() => setMemberPage(p => Math.max(1, p - 1))}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
                Trước
              </button>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setMemberPage(p => p + 1)}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Sau
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
