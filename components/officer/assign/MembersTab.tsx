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
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PaginationSimple } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTeamDetails, useTeamsList } from '@/hooks/useTeams';
import type { TeamMember } from '@/lib/api/models/team';
import { ChevronDown, MoreHorizontal, Search } from 'lucide-react';
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

type RoleFilter = 'all' | 'leader' | 'member';

const ROLE_LABEL: Record<RoleFilter, string> = {
  all: 'Tất cả vai trò',
  leader: 'Trưởng nhóm',
  member: 'Thành viên',
};

type MemberRow = TeamMember & { teamId: string; teamName: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {['s1', 's2', 's3', 's4', 's5'].map(key => (
        <TableRow key={key} className="animate-pulse">
          <TableCell className="px-5">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-muted" />
              <div className="h-3 w-28 rounded bg-muted" />
            </div>
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-40 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-24 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-5 w-20 rounded-full bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-20 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5" />
        </TableRow>
      ))}
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MembersTab() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [memberPage, setMemberPage] = useState(1);

  const { data: teamsData, isLoading: teamsLoading } = useTeamsList({ page: 1, pageSize: 100 });
  const teams = useMemo(() => teamsData?.items ?? [], [teamsData?.items]);
  const teamIds = useMemo(() => teams.map(team => team.id), [teams]);
  const detailQueries = useTeamDetails(teamIds);

  const isLoadingMembers = teamsLoading || detailQueries.some(q => q.isLoading);

  const allMembers: MemberRow[] = useMemo(() => {
    const result: MemberRow[] = [];
    teams.forEach((team, i) => {
      const detail = detailQueries[i]?.data;
      if (detail) {
        detail.members.forEach(m => result.push({ ...m, teamId: team.id, teamName: team.name }));
      }
    });
    return result;
  }, [detailQueries, teams]);

  const filtered: MemberRow[] = useMemo(() => {
    let result = allMembers;
    if (selectedTeamId !== 'all') result = result.filter(m => m.teamId === selectedTeamId);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        m => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      );
    }
    if (roleFilter === 'leader') result = result.filter(m => m.isLeader);
    if (roleFilter === 'member') result = result.filter(m => !m.isLeader);
    return result;
  }, [allMembers, selectedTeamId, debouncedSearch, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / MEMBERS_PER_PAGE));
  const pagedMembers = filtered.slice(
    (memberPage - 1) * MEMBERS_PER_PAGE,
    memberPage * MEMBERS_PER_PAGE
  );

  const handleSearch = (v: string) => {
    setSearch(v);
    setMemberPage(1);
  };

  const handleTeamChange = (id: string) => {
    setSelectedTeamId(id);
    setMemberPage(1);
  };

  const handleRoleChange = (r: RoleFilter) => {
    setRoleFilter(r);
    setMemberPage(1);
  };

  const selectedTeamLabel =
    selectedTeamId === 'all'
      ? 'Tất cả đội'
      : (teams.find(t => t.id === selectedTeamId)?.name ?? 'Đội');

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        {/* Search */}
        <div className="relative flex w-64 items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm tên, email..."
            className="h-9 rounded-lg pl-9 text-sm"
          />
        </div>

        {/* Team filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg px-3 text-sm">
              {selectedTeamLabel}
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 w-52 overflow-y-auto">
            <DropdownMenuItem
              onClick={() => handleTeamChange('all')}
              className={selectedTeamId === 'all' ? 'font-medium text-emerald-700' : ''}
            >
              Tất cả đội
            </DropdownMenuItem>
            {teams.map(team => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleTeamChange(team.id)}
                className={selectedTeamId === team.id ? 'font-medium text-emerald-700' : ''}
              >
                {team.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Role filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg px-3 text-sm">
              {ROLE_LABEL[roleFilter]}
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {(Object.keys(ROLE_LABEL) as RoleFilter[]).map(key => (
              <DropdownMenuItem
                key={key}
                onClick={() => handleRoleChange(key)}
                className={roleFilter === key ? 'font-medium text-emerald-700' : ''}
              >
                {ROLE_LABEL[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Họ tên
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Email
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Đội
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Vai trò
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Ngày tham gia
            </TableHead>
            <TableHead className="w-12 px-5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoadingMembers && <SkeletonRows />}
          {!isLoadingMembers && filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                Không có thành viên nào phù hợp.
              </TableCell>
            </TableRow>
          )}
          {!isLoadingMembers &&
            pagedMembers.map((member, idx) => (
              <TableRow key={`${member.teamId}-${member.userId}`} className="cursor-pointer">
                <TableCell className="px-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLORS[((memberPage - 1) * MEMBERS_PER_PAGE + idx) % AVATAR_COLORS.length]}`}
                    >
                      {getInitials(member.fullName)}
                    </div>
                    <span className="font-medium text-foreground">{member.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="px-5 text-muted-foreground">{member.email}</TableCell>
                <TableCell className="px-5 text-sm text-muted-foreground">
                  {member.teamName}
                </TableCell>
                <TableCell className="px-5">
                  {member.isLeader ? (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-200"
                    >
                      Trưởng nhóm
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500"
                    >
                      Thành viên
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="px-5 text-muted-foreground">
                  {formatDate(member.joinedAt)}
                </TableCell>
                <TableCell className="px-5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
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
            ))}
        </TableBody>
      </Table>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <span className="text-xs text-muted-foreground">
          {isLoadingMembers ? 'Đang tải...' : `${filtered.length} thành viên`}
        </span>
        {!isLoadingMembers && totalPages > 1 && (
          <PaginationSimple
            page={memberPage}
            totalPages={totalPages}
            onPageChange={setMemberPage}
            className="w-auto"
          />
        )}
      </div>
    </div>
  );
}
