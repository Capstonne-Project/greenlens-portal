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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
import { useTeamDetail, useTeamsList } from '@/hooks/useTeams';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TabToolbar } from './TabToolbar';

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
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: teamsData, isLoading: teamsLoading } = useTeamsList({ page: 1, pageSize: 100 });
  const {
    data: teamDetail,
    isLoading: membersLoading,
    isError: membersError,
    refetch,
  } = useTeamDetail(selectedTeamId);

  const filtered = useMemo(() => {
    const allMembers = teamDetail?.members ?? [];
    if (!search) return allMembers;
    const q = search.toLowerCase();
    return allMembers.filter(
      m => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [teamDetail?.members, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / MEMBERS_PER_PAGE));
  const pagedMembers = filtered.slice(
    (memberPage - 1) * MEMBERS_PER_PAGE,
    memberPage * MEMBERS_PER_PAGE
  );

  const handleRefresh = () => {
    if (!selectedTeamId) return;
    setIsRefreshing(true);
    refetch().finally(() => setIsRefreshing(false));
  };

  const handleTeamChange = (id: string) => {
    setSelectedTeamId(id);
    setMemberPage(1);
    setSearch('');
  };

  const handleSearchChange = (s: string) => {
    setSearch(s);
    setMemberPage(1);
  };

  const footerText = () => {
    if (!selectedTeamId) return 'Chưa chọn đội';
    if (membersLoading) return 'Đang tải...';
    return `${filtered.length} thành viên`;
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <TabToolbar
        search={search}
        onSearch={handleSearchChange}
        searchPlaceholder="Tìm tên, email..."
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        filterOpen={filterOpen}
        onFilterToggle={() => setFilterOpen(v => !v)}
        actionSlot={
          <>
            <Select
              value={selectedTeamId ?? ''}
              onValueChange={handleTeamChange}
              disabled={teamsLoading}
            >
              <SelectTrigger className="h-8 w-52 text-sm">
                <SelectValue placeholder="Chọn đội..." />
              </SelectTrigger>
              <SelectContent>
                {(teamsData?.items ?? []).map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Plus className="mr-1.5 size-4" />
              Thêm thành viên
            </Button>
          </>
        }
      />

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
              Vai trò
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Ngày tham gia
            </TableHead>
            <TableHead className="w-12 px-5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {!selectedTeamId && (
            <TableRow>
              <TableCell colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                Chọn một đội để xem danh sách thành viên.
              </TableCell>
            </TableRow>
          )}
          {selectedTeamId && membersLoading && <SkeletonRows />}
          {selectedTeamId && membersError && (
            <TableRow>
              <TableCell colSpan={5} className="px-5 py-10 text-center text-destructive">
                Không thể tải dữ liệu. Vui lòng thử lại.
              </TableCell>
            </TableRow>
          )}
          {selectedTeamId && !membersLoading && !membersError && pagedMembers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                Không có thành viên nào phù hợp.
              </TableCell>
            </TableRow>
          )}
          {selectedTeamId &&
            !membersLoading &&
            !membersError &&
            pagedMembers.map((member, idx) => (
              <TableRow key={member.userId} className="cursor-pointer">
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

      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <span className="text-xs text-muted-foreground">{footerText()}</span>
        {selectedTeamId && !membersLoading && totalPages > 1 && (
          <Pagination className="w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    if (memberPage > 1) setMemberPage(memberPage - 1);
                  }}
                  className={memberPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === memberPage}
                    onClick={e => {
                      e.preventDefault();
                      setMemberPage(p);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    if (memberPage < totalPages) setMemberPage(memberPage + 1);
                  }}
                  className={memberPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
