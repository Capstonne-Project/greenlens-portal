'use client';

import Image from 'next/image';
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, ChevronDown, Loader2, Mail, Phone, Plus, Shield, Users } from 'lucide-react';

import { RecruitStaffDialog } from '@/components/officer/assign/RecruitStaffDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GooeyInput } from '@/components/ui/gooey-input';
import { MovingBorderButton } from '@/components/ui/moving-border';
import { PaginationSimple } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import UsersIcon from '@/components/ui/users-icon';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useOfficeStaffList } from '@/hooks/useLeoOffices';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import type {
  OfficeStaffAssignRole,
  OfficeStaffListParams,
  OfficeStaffMember,
} from '@/lib/api/models/office';
import { cn } from '@/lib/utils';
import { formatJoinedDateVi } from '@/utils/officerTracking';

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
  { key: 'actions', label: '', className: 'w-[88px]' },
];

type HasTeamFilter = 'all' | 'true' | 'false';
type RoleFilter = 'all' | OfficeStaffAssignRole;

const HAS_TEAM_LABEL: Record<HasTeamFilter, string> = {
  all: 'Đội xử lý',
  true: 'Có đội',
  false: 'Chưa có đội',
};

const ROLE_LABEL: Record<RoleFilter, string> = {
  all: 'Vai trò',
  Cleaner: 'Đội dọn dẹp (Cleaner)',
  Inspector: 'Thanh tra (Inspector)',
};

const ROLE_BADGE: Record<OfficeStaffAssignRole, string> = {
  Cleaner: 'Đội dọn dẹp',
  Inspector: 'Thanh tra',
};

const FILTER_BTN_CLASS =
  'h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-sky-700';

function staffRoleLabel(role: string): string {
  if (role === 'Cleaner' || role === 'Inspector') return ROLE_BADGE[role];
  return role;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function formatJoinedMeta(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `Joined ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
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

function MemberAvatar({
  member,
  colorClass,
  size,
}: {
  member: OfficeStaffMember;
  colorClass: string;
  size: 'sm' | 'profile';
}) {
  const dim = size === 'profile' ? 'size-[5.5rem]' : 'size-7';
  const rounded = 'rounded-full';
  const textSize = size === 'profile' ? 'text-2xl' : 'text-[11px]';
  const ring =
    size === 'profile' ? 'ring-[3px] ring-white shadow-[0_2px_10px_rgb(15_23_42/12%)]' : '';

  if (member.avatarUrl) {
    return (
      <div className={cn('relative shrink-0 overflow-hidden bg-slate-100', dim, rounded, ring)}>
        <Image
          src={member.avatarUrl}
          alt={member.fullName}
          fill
          sizes={size === 'profile' ? '88px' : '28px'}
          className="object-cover object-top"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center font-bold',
        dim,
        rounded,
        textSize,
        colorClass,
        ring
      )}
    >
      {getInitials(member.fullName)}
    </div>
  );
}

type InfoRow = {
  key: string;
  label: string;
  value: string;
  icon: typeof Mail;
};

function buildStaffInfoRows(member: OfficeStaffMember): InfoRow[] {
  return [
    {
      key: 'role',
      label: 'Role',
      value: staffRoleLabel(member.role),
      icon: Shield,
    },
    { key: 'email', label: 'Email', value: member.email || '—', icon: Mail },
    {
      key: 'phone',
      label: 'Phone',
      value: member.phoneNumber?.trim() || '—',
      icon: Phone,
    },
    {
      key: 'team',
      label: 'Team',
      value: member.teamName?.trim() || 'Chưa có đội',
      icon: Users,
    },
    {
      key: 'joined',
      label: 'Joined',
      value: formatJoinedDateVi(member.createdAt),
      icon: CalendarDays,
    },
  ];
}

function CloseIcon() {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
}

function StaffProfileExpandPanel({
  member,
  colorClass,
  layoutKey,
  panelRef,
  onClose,
}: {
  member: OfficeStaffMember;
  colorClass: string;
  layoutKey: string;
  panelRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  const infoRows = buildStaffInfoRows(member);
  const teamLabel = member.teamName?.trim() || 'Chưa có đội';

  return (
    <motion.div
      layoutId={`card-${layoutKey}`}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết ${member.fullName}`}
      className="flex h-full w-full max-w-[420px] flex-col overflow-hidden bg-white sm:h-fit sm:max-h-[90%] sm:rounded-3xl"
    >
      {/* Shared layout: image — morph từ avatar row */}
      <motion.div layoutId={`image-${layoutKey}`} className="relative shrink-0">
        <div className="relative h-40 bg-[#1e293b] sm:h-44">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_40%)]"
            aria-hidden
          />
        </div>
        <div className="absolute inset-x-0 -bottom-11 flex justify-center">
          <MemberAvatar member={member} colorClass={colorClass} size="profile" />
        </div>
      </motion.div>

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header căn giữa — khớp ảnh mẫu */}
        <div className="relative flex flex-col items-center px-5 pt-14 pb-4 text-center">
          <div className="flex flex-wrap items-start justify-center gap-1.5">
            <motion.h3
              layoutId={`title-${layoutKey}`}
              className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
            >
              {member.fullName}
            </motion.h3>
            {member.isLeader ? (
              <Badge
                variant="secondary"
                className="mt-0.5 rounded-full bg-amber-50 px-1.5 py-0 text-[9px] leading-4 font-medium text-amber-700"
              >
                Trưởng nhóm
              </Badge>
            ) : null}
          </div>
          <motion.p
            layoutId={`description-${layoutKey}`}
            className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-sm"
          >
            <span className="font-medium text-violet-400">{teamLabel}</span>
            <span className="text-slate-300" aria-hidden>
              |
            </span>
            <span className="text-slate-400">{formatJoinedMeta(member.createdAt)}</span>
          </motion.p>

          {/* Giữ layoutId button cho animation — không làm lệch layout căn giữa */}
          <motion.button
            type="button"
            layoutId={`button-${layoutKey}`}
            onClick={onClose}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          >
            Chi tiết
          </motion.button>
        </div>

        {/* Fade-in content — giống bản gốc */}
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col gap-4 overflow-auto px-4 pt-1 pb-8 text-slate-600 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <h4 className="px-4 pt-4 text-lg font-bold text-slate-900">Information</h4>
            <ul className="mt-1 flex flex-col px-4 pb-2">
              {infoRows.map(row => {
                const Icon = row.icon;
                return (
                  <li
                    key={row.key}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 py-3.5 last:border-b-0"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="size-4 shrink-0 text-slate-400" aria-hidden />
                      <span className="text-sm text-slate-500">{row.label}</span>
                    </span>
                    <span className="min-w-0 max-w-[60%] truncate text-right text-sm font-semibold text-slate-900">
                      {row.value}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function MembersTab() {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [hasTeamFilter, setHasTeamFilter] = useState<HasTeamFilter>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [memberPage, setMemberPage] = useState(1);
  const [recruitOpen, setRecruitOpen] = useState(false);
  const [active, setActive] = useState<OfficeStaffMember | null>(null);

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

  useOutsideClick(panelRef, () => setActive(null));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActive(null);
    }

    if (active) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [active]);

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

  const activeColorClass =
    AVATAR_COLORS[
      Math.max(
        0,
        members.findIndex(m => m.userId === active?.userId)
      ) % AVATAR_COLORS.length
    ] ?? AVATAR_COLORS[0];

  return (
    <>
      <header className="mb-6 shrink-0">
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <GooeyInput
              value={search}
              onValueChange={handleSearch}
              placeholder="Tìm tên, email..."
              collapsedWidth={160}
              expandedWidth={320}
              className="justify-start"
            />
            {isFetching && !isLoadingMembers ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-slate-400" aria-hidden />
            ) : null}

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
          </div>

          <MovingBorderButton
            type="button"
            onClick={() => setRecruitOpen(true)}
            borderRadius="0.5rem"
            duration={2500}
            containerClassName="h-8 w-auto shrink-0"
            borderClassName="bg-[radial-gradient(#10b981_40%,transparent_60%)]"
            className="gap-1.5 border-neutral-200 bg-white px-3 text-[0.8125rem] font-medium text-emerald-700 hover:bg-slate-50"
          >
            <Plus className="size-3.5" aria-hidden />
            Thêm
          </MovingBorderButton>
        </div>
      </header>

      <RecruitStaffDialog
        open={recruitOpen}
        onClose={() => setRecruitOpen(false)}
        onRecruited={() => setMemberPage(1)}
      />

      <AnimatePresence>
        {active ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 h-full w-full bg-black/20"
            aria-hidden
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 z-[100] grid place-items-center">
            <motion.button
              type="button"
              key={`close-${active.userId}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-white lg:hidden"
              onClick={() => setActive(null)}
              aria-label="Đóng"
            >
              <CloseIcon />
            </motion.button>

            <StaffProfileExpandPanel
              member={active}
              colorClass={activeColorClass}
              layoutKey={`${active.userId}-${id}`}
              panelRef={panelRef}
              onClose={() => setActive(null)}
            />
          </div>
        ) : null}
      </AnimatePresence>

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
                members.map((member, idx) => {
                  const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
                  const layoutKey = `${member.userId}-${id}`;
                  return (
                    <TableRow
                      key={member.userId}
                      onClick={() => setActive(member)}
                      className="cursor-pointer border-slate-100 hover:bg-sky-50/40"
                    >
                      <TableCell className="px-3 py-2">
                        <motion.div
                          layoutId={`card-${layoutKey}`}
                          className="flex items-center gap-2.5"
                        >
                          <motion.div layoutId={`image-${layoutKey}`}>
                            <MemberAvatar member={member} colorClass={colorClass} size="sm" />
                          </motion.div>
                          <div className="min-w-0">
                            <motion.h3
                              layoutId={`title-${layoutKey}`}
                              className="truncate text-sm font-medium text-slate-800"
                            >
                              {member.fullName}
                            </motion.h3>
                            {member.isLeader ? (
                              <span className="text-[11px] font-medium text-amber-600">
                                Trưởng nhóm
                              </span>
                            ) : null}
                          </div>
                        </motion.div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-slate-600">
                        {member.email}
                      </TableCell>
                      <TableCell className="px-3 py-6 text-sm text-slate-600">
                        <motion.p layoutId={`description-${layoutKey}`}>
                          {member.teamName ?? '—'}
                        </motion.p>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          {staffRoleLabel(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-slate-600">
                        {formatJoinedDateVi(member.createdAt)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <motion.button
                          type="button"
                          layoutId={`button-${layoutKey}`}
                          className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-emerald-500 hover:text-white"
                          onClick={e => {
                            e.stopPropagation();
                            setActive(member);
                          }}
                        >
                          Chi tiết
                        </motion.button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-2">
            {pagination.totalPages > 1 ? (
              <PaginationSimple
                page={memberPage}
                totalPages={pagination.totalPages}
                onPageChange={setMemberPage}
                className="w-auto"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
