'use client';

import { TeamDetailDialog } from '@/components/admin/teams/TeamDetailDialog';
import { useOfficesList } from '@/hooks/useOffices';
import { useTeamsList } from '@/hooks/useTeams';
import {
  ADMIN_TEAMS_OFFICE_PAGE_SIZE,
  ADMIN_TEAMS_PAGE_SIZE,
  getTeamTypeClasses,
  getTeamTypeLabel,
  TEAM_TYPE_OPTIONS,
} from '@/lib/constants/adminTeams';
import type { TeamListItem } from '@/lib/api/models/team';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  LayoutGrid,
  RadioTower,
  Search,
  ShieldCheck,
  Table2,
  UsersRound,
  Waves,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

type ActiveFilter = 'active' | 'inactive' | 'all';
type ViewMode = 'cards' | 'table';

function formatDate(iso: string): string {
  if (!iso?.trim() || iso.startsWith('0001-01-01')) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

function getTeamAccent(teamType: string): string {
  switch (teamType) {
    case 'Cleanup':
      return 'from-emerald-500/20 to-emerald-500/0';
    case 'Inspection':
      return 'from-sky-500/20 to-sky-500/0';
    case 'Response':
      return 'from-amber-500/20 to-amber-500/0';
    case 'Monitoring':
      return 'from-violet-500/20 to-violet-500/0';
    default:
      return 'from-muted to-transparent';
  }
}

interface TeamSpotlightCardProps {
  team: TeamListItem;
  onOpen: (id: string) => void;
}

function TeamSpotlightCard({ team, onOpen }: TeamSpotlightCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(team.id)}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${getTeamAccent(
          team.teamType
        )}`}
        aria-hidden
      />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
            <UsersRound className="size-5" />
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTeamTypeClasses(
              team.teamType
            )}`}
          >
            {getTeamTypeLabel(team.teamType)}
          </span>
        </div>
        <h3 className="line-clamp-2 font-semibold leading-snug">{team.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{team.officeName}</p>
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-xs text-muted-foreground">Thành viên</span>
          <span className="text-xl font-bold tabular-nums">{team.memberCount}</span>
        </div>
      </div>
    </button>
  );
}

function TeamSearchControls({
  searchQ,
  onApply,
}: {
  searchQ: string;
  onApply: (trimmed: string) => void;
}) {
  const [localSearch, setLocalSearch] = useState(searchQ);
  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="team-search"
          type="search"
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onApply(localSearch.trim())}
          placeholder="Cleanup HCM, văn phòng, loại team…"
          className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        />
      </div>
      <button
        type="button"
        onClick={() => onApply(localSearch.trim())}
        className="h-10 shrink-0 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
      >
        Tìm
      </button>
    </div>
  );
}

export function AdminTeamsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const searchQ = searchParams.get('q') ?? '';
  const officeId = searchParams.get('officeId') ?? '';
  const teamType = searchParams.get('type') ?? 'all';
  const viewMode: ViewMode = searchParams.get('view') === 'table' ? 'table' : 'cards';
  const activeFilter: ActiveFilter =
    searchParams.get('status') === 'inactive'
      ? 'inactive'
      : searchParams.get('status') === 'all'
        ? 'all'
        : 'active';

  const [detailId, setDetailId] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: ADMIN_TEAMS_PAGE_SIZE,
      ...(officeId ? { localOfficeId: officeId } : {}),
      ...(teamType !== 'all' ? { teamType } : {}),
      ...(activeFilter === 'active'
        ? { isActive: true }
        : activeFilter === 'inactive'
          ? { isActive: false }
          : {}),
    }),
    [activeFilter, officeId, page, teamType]
  );

  const { data, isPending, isError, error, refetch } = useTeamsList(queryParams);
  const statsQuery = useTeamsList({ page: 1, pageSize: 500 });
  const officesQuery = useOfficesList({ page: 1, pageSize: ADMIN_TEAMS_OFFICE_PAGE_SIZE });

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

  const items = useMemo(() => {
    const base = data?.items ?? [];
    const q = searchQ.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      team =>
        team.name.toLowerCase().includes(q) ||
        team.officeName.toLowerCase().includes(q) ||
        team.teamType.toLowerCase().includes(q)
    );
  }, [data, searchQ]);

  const statsItems = statsQuery.data?.items ?? [];
  const totalTeams = statsQuery.data?.pagination.totalItems ?? 0;
  const activeTeams = statsItems.filter(team => team.isActive).length;
  const totalMembers = statsItems.reduce((sum, team) => sum + team.memberCount, 0);
  const cleanupTeams = statsItems.filter(team => team.teamType === 'Cleanup').length;
  const pagination = data?.pagination;

  return (
    <div className="w-full min-w-0">
      <header className="mb-5 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <RadioTower className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Điều phối đội môi trường
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                Theo dõi đội cleanup, kiểm tra và ứng cứu theo từng văn phòng.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Team', value: totalTeams, icon: UsersRound },
                { label: 'Active', value: activeTeams, icon: Activity },
                { label: 'Member', value: totalMembers, icon: ShieldCheck },
                { label: 'Cleanup', value: cleanupTeams, icon: Waves },
              ].map(item => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium"
                >
                  <item.icon className="size-3.5 text-emerald-700" />
                  <span className="text-muted-foreground">{item.label}</span>
                  <strong className="font-semibold tabular-nums text-foreground">
                    {item.value}
                  </strong>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <RadioTower className="size-3.5" />
              Làm mới
            </button>
          </div>
        </div>
      </header>

      <section className="mb-6 rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem_10rem_12rem] lg:items-end">
          <div className="flex flex-col gap-2">
            <label htmlFor="team-search" className="text-sm font-medium">
              Tìm team
            </label>
            <TeamSearchControls
              key={searchQ}
              searchQ={searchQ}
              onApply={q => setQuery({ q: q || null, page: '1' })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="team-office" className="text-sm font-medium">
              Văn phòng
            </label>
            <select
              id="team-office"
              value={officeId}
              onChange={e => setQuery({ officeId: e.target.value || null, page: '1' })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Tất cả văn phòng</option>
              {(officesQuery.data?.items ?? []).map(office => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="team-type" className="text-sm font-medium">
              Loại team
            </label>
            <select
              id="team-type"
              value={teamType}
              onChange={e =>
                setQuery({ type: e.target.value === 'all' ? null : e.target.value, page: '1' })
              }
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="all">Tất cả</option>
              {TEAM_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Trạng thái</span>
            <div className="flex h-10 rounded-lg border border-border bg-background p-1">
              {(
                [
                  ['active', 'Active'],
                  ['inactive', 'Tạm dừng'],
                  ['all', 'Tất cả'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQuery({ status: value === 'active' ? null : value, page: '1' })}
                  className={`flex-1 rounded-md text-xs font-medium ${
                    activeFilter === value
                      ? 'bg-emerald-700 text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-2">
        <div className="px-3">
          <p className="text-sm font-semibold">Chế độ xem</p>
          <p className="text-xs text-muted-foreground">Một tab dạng ô, một tab dạng bảng.</p>
        </div>
        <div className="flex h-10 rounded-xl border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setQuery({ view: null })}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 text-sm font-medium ${
              viewMode === 'cards'
                ? 'bg-emerald-700 text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <LayoutGrid className="size-4" />Ô
          </button>
          <button
            type="button"
            onClick={() => setQuery({ view: 'table' })}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 text-sm font-medium ${
              viewMode === 'table'
                ? 'bg-emerald-700 text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Table2 className="size-4" />
            Bảng
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        {isPending && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Đang tải team…
          </div>
        )}

        {isError && (
          <div className="py-16 text-center">
            <p className="text-sm text-destructive">
              {(error as Error)?.message ?? 'Không tải được danh sách team.'}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {!isPending && !isError && viewMode === 'cards' && (
          <>
            {items.length === 0 ? (
              <div className="px-6 py-16 text-center text-muted-foreground">
                <UsersRound className="mx-auto mb-2 size-8 opacity-30" />
                Chưa có team phù hợp bộ lọc.
              </div>
            ) : (
              <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map(team => (
                  <TeamSpotlightCard key={team.id} team={team} onOpen={setDetailId} />
                ))}
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <span className="text-xs text-muted-foreground">
                  Trang {pagination.page}/{pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPrev}
                    onClick={() => setQuery({ page: String(page - 1) })}
                    className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" />
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={!pagination.hasNext}
                    onClick={() => setQuery({ page: String(page + 1) })}
                    className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs disabled:opacity-40"
                  >
                    Sau
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!isPending && !isError && viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3">Team</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Văn phòng</th>
                  <th className="px-4 py-3">Thành viên</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                      <UsersRound className="mx-auto mb-2 size-8 opacity-30" />
                      Chưa có team phù hợp bộ lọc.
                    </td>
                  </tr>
                )}
                {items.map(team => (
                  <tr key={team.id} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="px-6 py-3 font-semibold">{team.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTeamTypeClasses(
                          team.teamType
                        )}`}
                      >
                        {getTeamTypeLabel(team.teamType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{team.officeName}</td>
                    <td className="px-4 py-3 tabular-nums">{team.memberCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          team.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {team.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(team.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          title="Chi tiết"
                          onClick={() => setDetailId(team.id)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
                        >
                          <Eye className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <span className="text-xs text-muted-foreground">
                  Trang {pagination.page}/{pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPrev}
                    onClick={() => setQuery({ page: String(page - 1) })}
                    className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" />
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={!pagination.hasNext}
                    onClick={() => setQuery({ page: String(page + 1) })}
                    className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs disabled:opacity-40"
                  >
                    Sau
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <TeamDetailDialog
        open={Boolean(detailId)}
        teamId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
