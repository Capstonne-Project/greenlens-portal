'use client';

import { CompanyStaffAssignTeamDialog } from '@/components/company/staff/CompanyStaffAssignTeamDialog';
import { CompanyStaffCreateDialog } from '@/components/company/staff/CompanyStaffCreateDialog';
import { CompanyStaffLeaveTeamDialog } from '@/components/company/staff/CompanyStaffLeaveTeamDialog';
import { CompanyStaffTempPasswordDialog } from '@/components/company/staff/CompanyStaffTempPasswordDialog';
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
import { MovingBorderButton } from '@/components/ui/moving-border';
import { GreenLensLookupSpinner } from '@/components/ui/greenlens-lookup-spinner';
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
import {
  useCompanyStaffList,
  useRemoveCompanyTeamMember,
  useUpdateCompanyStaffStatus,
} from '@/hooks/useCompany';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import type { CompanyStaffItem, CreateCompanyStaffResult } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import { deferOpenFromMenu, restoreBodyPointerEvents } from '@/lib/utils/radixUi';
import { formatCompanyDate, getCompanyMutationError } from '@/utils/companyUi';
import {
  Briefcase,
  CalendarDays,
  ChevronDown,
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  Power,
  Search,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import { toast } from 'sonner';

const MEMBERS_PER_PAGE = 10;
/** API chỉ có isActive — load đủ để search / hasTeam client-side. */
const FETCH_PAGE_SIZE = 100;

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

type ColumnKey = 'name' | 'email' | 'team' | 'position' | 'joined' | 'status' | 'actions';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'name', label: 'Họ tên', className: 'min-w-[180px]' },
  { key: 'email', label: 'Email', className: 'min-w-[200px]' },
  { key: 'team', label: 'Đội', className: 'min-w-[140px]' },
  { key: 'position', label: 'Chức vụ', className: 'w-[140px]' },
  { key: 'joined', label: 'Ngày tham gia', className: 'w-[120px]' },
  { key: 'status', label: 'Trạng thái', className: 'w-[120px]' },
  { key: 'actions', label: '', className: 'w-[56px]' },
];

/** Cột chức vụ luôn «Thành viên» — trưởng nhóm đã có badge riêng. */
function positionLabel(_position: string): string {
  return 'Thành viên';
}

type ActiveFilter = 'all' | 'active' | 'inactive';
type HasTeamFilter = 'all' | 'true' | 'false';

const ACTIVE_FILTER_LABEL: Record<ActiveFilter, string> = {
  all: 'Trạng thái',
  active: 'Đang hoạt động',
  inactive: 'Ngưng hoạt động',
};

const HAS_TEAM_LABEL: Record<HasTeamFilter, string> = {
  all: 'Đội xử lý',
  true: 'Có đội',
  false: 'Chưa có đội',
};

const FILTER_BTN_CLASS =
  'h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-brand shadow-none outline-none ring-0 ring-offset-0 focus:border-slate-300 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-slate-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 active:border-slate-300 active:outline-none data-[state=open]:border-slate-300 data-[state=open]:ring-0';

function staffHasTeam(row: CompanyStaffItem): boolean {
  return Boolean(row.teamId);
}

function isTeamLeader(row: CompanyStaffItem): boolean {
  return row.position === 'Team Leader';
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

function paginateClient<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function StaffAvatar({
  member,
  colorClass,
  size,
}: {
  member: CompanyStaffItem;
  colorClass: string;
  size: 'sm' | 'profile';
}) {
  const dim = size === 'profile' ? 'size-[5.5rem]' : 'size-7';
  const textSize = size === 'profile' ? 'text-2xl' : 'text-[11px]';
  const ring =
    size === 'profile' ? 'ring-[3px] ring-white shadow-[0_2px_10px_rgb(15_23_42/12%)]' : '';

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        dim,
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

function buildStaffInfoRows(member: CompanyStaffItem): InfoRow[] {
  return [
    {
      key: 'position',
      label: 'Chức vụ',
      value: positionLabel(member.position),
      icon: Briefcase,
    },
    { key: 'email', label: 'Email', value: member.email || '—', icon: Mail },
    {
      key: 'team',
      label: 'Đội',
      value: member.teamName?.trim() || 'Chưa có đội',
      icon: Users,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      value: member.isActive ? 'Hoạt động' : 'Ngưng hoạt động',
      icon: Power,
    },
    {
      key: 'joined',
      label: 'Ngày tham gia',
      value: formatCompanyDate(member.createdAt),
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
  member: CompanyStaffItem;
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
      <motion.div layoutId={`image-${layoutKey}`} className="relative shrink-0">
        <div className="relative h-40 bg-[#1e293b] sm:h-44">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_40%)]"
            aria-hidden
          />
        </div>
        <div className="absolute inset-x-0 -bottom-11 flex justify-center">
          <StaffAvatar member={member} colorClass={colorClass} size="profile" />
        </div>
      </motion.div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative flex flex-col items-center px-5 pt-14 pb-4 text-center">
          <div className="flex flex-wrap items-start justify-center gap-1.5">
            <motion.h3
              layoutId={`title-${layoutKey}`}
              className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
            >
              {member.fullName}
            </motion.h3>
            {isTeamLeader(member) ? (
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

          <motion.button
            type="button"
            layoutId={`button-${layoutKey}`}
            onClick={onClose}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          >
            Menu
          </motion.button>
        </div>

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

export function CompanyStaffView({ enabled = true }: { enabled?: boolean }) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [hasTeamFilter, setHasTeamFilter] = useState<HasTeamFilter>('all');
  const [active, setActive] = useState<CompanyStaffItem | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createdStaff, setCreatedStaff] = useState<CreateCompanyStaffResult | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<CompanyStaffItem | null>(null);
  const [assignTarget, setAssignTarget] = useState<CompanyStaffItem | null>(null);

  const updateStatus = useUpdateCompanyStaffStatus();
  const removeTeamMember = useRemoveCompanyTeamMember();

  const isActiveParam =
    activeFilter === 'all' ? undefined : activeFilter === 'active' ? true : false;

  const { data, isPending, isError, isFetching, refetch } = useCompanyStaffList(
    {
      page: 1,
      pageSize: FETCH_PAGE_SIZE,
      isActive: isActiveParam,
    },
    { enabled }
  );

  const allItems = useMemo(() => data?.items ?? [], [data?.items]);

  const filtered = useMemo(() => {
    let list = allItems;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        s => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    }
    if (hasTeamFilter === 'true') list = list.filter(staffHasTeam);
    if (hasTeamFilter === 'false') list = list.filter(s => !staffHasTeam(s));
    return list;
  }, [allItems, debouncedSearch, hasTeamFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / MEMBERS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => paginateClient(filtered, safePage, MEMBERS_PER_PAGE),
    [filtered, safePage]
  );

  useOutsideClick(panelRef, () => setActive(null));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActive(null);
    }

    if (active) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      restoreBodyPointerEvents();
    };
  }, [active]);

  const handleCreated = useCallback((result: CreateCompanyStaffResult) => {
    setCreateOpen(false);
    setCreatedStaff(result);
    setPage(1);
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleActiveFilter = (value: ActiveFilter) => {
    setActiveFilter(value);
    setPage(1);
    setActive(null);
  };

  const handleHasTeamFilter = (value: HasTeamFilter) => {
    setHasTeamFilter(value);
    setPage(1);
    setActive(null);
  };

  const handleToggleStatus = (row: CompanyStaffItem) => {
    const nextActive = !row.isActive;
    setTogglingId(row.userId);
    updateStatus.mutate(
      { userId: row.userId, body: { isActive: nextActive } },
      {
        onSuccess: env => {
          toast.success(
            env.message ?? (nextActive ? 'Đã kích hoạt nhân viên' : 'Đã vô hiệu hóa nhân viên')
          );
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể cập nhật trạng thái')),
        onSettled: () => setTogglingId(null),
      }
    );
  };

  const handleConfirmLeaveTeam = () => {
    if (!leaveTarget?.userId) return;
    if (!leaveTarget.teamId?.trim()) {
      toast.error('Không xác định được đội hiện tại của thành viên');
      return;
    }

    removeTeamMember.mutate(
      { teamId: leaveTarget.teamId, userId: leaveTarget.userId },
      {
        onSuccess: env => {
          toast.success(env.message?.trim() || 'Đã cho thành viên rời đội');
          setLeaveTarget(null);
        },
        onError: err =>
          toast.error(getCompanyMutationError(err, 'Không thể cho thành viên rời đội')),
      }
    );
  };

  const activeColorClass =
    AVATAR_COLORS[
      Math.max(
        0,
        pageItems.findIndex(m => m.userId === active?.userId)
      ) % AVATAR_COLORS.length
    ] ?? AVATAR_COLORS[0];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 py-3 sm:py-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full min-w-0 sm:w-72 sm:max-w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Tìm tên, email..."
              className={cn(
                'h-8 w-full border-slate-200 bg-white pl-9 text-sm shadow-none',
                isFetching && !isPending && 'pr-8'
              )}
              aria-label="Tìm tên, email thành viên"
            />
            {isFetching && !isPending ? (
              <Loader2
                className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-slate-400"
                aria-hidden
              />
            ) : null}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
                {ACTIVE_FILTER_LABEL[activeFilter]}
                <ChevronDown className="size-3.5 opacity-60" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {(Object.keys(ACTIVE_FILTER_LABEL) as ActiveFilter[]).map(key => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleActiveFilter(key)}
                  className={
                    activeFilter === key
                      ? 'cursor-pointer font-medium text-brand'
                      : 'cursor-pointer'
                  }
                >
                  {ACTIVE_FILTER_LABEL[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
                  onClick={() => handleHasTeamFilter(key)}
                  className={
                    hasTeamFilter === key
                      ? 'cursor-pointer font-medium text-brand'
                      : 'cursor-pointer'
                  }
                >
                  {HAS_TEAM_LABEL[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <MovingBorderButton
              type="button"
              onClick={() => setCreateOpen(true)}
              borderRadius="0.5rem"
              duration={2500}
              containerClassName="h-8 w-auto shrink-0"
              borderClassName="bg-[radial-gradient(#3f6b32_40%,transparent_60%)]"
              className="gap-1.5 border-brand/25 bg-white px-3 text-[0.8125rem] font-medium text-slate-600 hover:bg-slate-50"
            >
              <Plus className="size-3.5" aria-hidden />
              Thêm
            </MovingBorderButton>
          </div>
        </div>
      </header>

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
          <div className="fixed inset-0 z-100 grid place-items-center">
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/4%)]">
        <div className="min-h-0 flex-1 overflow-auto [&_table]:border-collapse">
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
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 text-center">
                    <GreenLensLookupSpinner className="mx-auto size-8" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 text-center">
                    <p className="text-sm text-destructive">Không tải được danh sách nhân sự.</p>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : pageItems.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-lg font-medium text-slate-500">
                      <UsersIcon size={44} className="opacity-30" />
                      <span>Không có thành viên.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((member, idx) => {
                  const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
                  const layoutKey = `${member.userId}-${id}`;
                  const hasTeam = staffHasTeam(member);
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
                            <StaffAvatar member={member} colorClass={colorClass} size="sm" />
                          </motion.div>
                          <div className="min-w-0">
                            <motion.h3
                              layoutId={`title-${layoutKey}`}
                              className="truncate text-sm font-medium text-slate-800"
                            >
                              {member.fullName}
                            </motion.h3>
                            {isTeamLeader(member) ? (
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
                          {positionLabel(member.position)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-slate-600">
                        {formatCompanyDate(member.createdAt)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                            member.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {member.isActive ? 'Hoạt động' : 'Ngưng'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div
                          className="flex items-center justify-end"
                          onClick={e => e.stopPropagation()}
                        >
                          <motion.div layoutId={`button-${layoutKey}`}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-slate-500 hover:text-slate-700"
                                  aria-label="Thao tác nhân sự"
                                  disabled={togglingId === member.userId}
                                >
                                  {togglingId === member.userId ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="size-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                {hasTeam ? (
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => deferOpenFromMenu(() => setLeaveTarget(member))}
                                  >
                                    <UserMinus className="mr-2 size-3.5" />
                                    Rời đội
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => deferOpenFromMenu(() => setAssignTarget(member))}
                                  >
                                    <UserPlus className="mr-2 size-3.5" />
                                    Gán đội
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className={cn(
                                    'cursor-pointer',
                                    member.isActive
                                      ? 'text-destructive focus:text-destructive'
                                      : 'text-emerald-700 focus:text-emerald-700'
                                  )}
                                  onClick={() => handleToggleStatus(member)}
                                >
                                  <Power className="mr-2 size-3.5" />
                                  {member.isActive ? 'Vô hiệu hoá' : 'Kích hoạt'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </motion.div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-2">
            <PaginationSimple
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              className="w-auto"
            />
          </div>
        ) : null}
      </div>

      <CompanyStaffCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <CompanyStaffTempPasswordDialog
        open={Boolean(createdStaff)}
        result={createdStaff}
        onClose={() => setCreatedStaff(null)}
      />

      <CompanyStaffAssignTeamDialog
        key={assignTarget?.userId ?? 'assign-team'}
        open={Boolean(assignTarget)}
        staff={assignTarget}
        onClose={() => setAssignTarget(null)}
        onSuccess={() => setAssignTarget(null)}
      />

      <CompanyStaffLeaveTeamDialog
        open={Boolean(leaveTarget)}
        staff={leaveTarget}
        submitting={removeTeamMember.isPending}
        onConfirm={handleConfirmLeaveTeam}
        onClose={() => {
          if (!removeTeamMember.isPending) setLeaveTarget(null);
        }}
      />
    </div>
  );
}
