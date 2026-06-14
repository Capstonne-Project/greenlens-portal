'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useRemoveTeamMember, useTeamDetail, useTeamsList } from '@/hooks/useTeams';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import type { TeamListItem, TeamsListParams } from '@/lib/api/models/team';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Crown,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

// ── Constants (list view) ─────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const TYPE_CLASS: Record<string, string> = {
  Cleanup: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Inspection: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Survey: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
};

const TYPE_LABEL: Record<string, string> = {
  Cleanup: 'Dọn dẹp',
  Inspection: 'Kiểm tra',
  Survey: 'Khảo sát',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  const a = parts[parts.length - 2]?.[0] ?? '';
  const b = parts[parts.length - 1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

/** BE: `currentStatus` Available = rảnh, Busy = đang xử lý báo cáo. */
function isTeamAvailable(currentStatus: string): boolean {
  return currentStatus.trim().toLowerCase() === 'available';
}

function teamAvailabilityBadge(currentStatus: string) {
  const available = isTeamAvailable(currentStatus);
  return {
    label: available ? '● Sẵn sàng' : '● Đang xử lý',
    className: available ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
  };
}

// ── Add Member Dialog ─────────────────────────────────────────────────────────
function AddMemberDialog({
  teamId: _teamId,
  teamName,
  onClose,
}: {
  teamId: string;
  teamName: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    // TODO: wire addTeamMember mutation when endpoint is ready
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <UserPlus className="size-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Thêm thành viên</h2>
            <p className="text-sm text-muted-foreground">{teamName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Email thành viên
            </label>
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vd: nguyenvana@example.com"
              type="email"
              autoFocus
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Thành viên sẽ nhận thông báo qua email sau khi được thêm
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!email.trim() || submitting}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {submitting ? 'Đang thêm...' : 'Thêm vào đội'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Remove member confirm ─────────────────────────────────────────────────────
function RemoveMemberConfirmDialog({
  memberName,
  submitting,
  onConfirm,
  onClose,
}: {
  memberName: string;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-foreground">Xóa thành viên</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn có chắc muốn xóa <span className="font-medium text-foreground">{memberName}</span>{' '}
          khỏi đội này?
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {submitting ? 'Đang xóa...' : 'Xác nhận'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Team Board Card (kanban style) ───────────────────────────────────────────
function TeamCard({
  team,
  isExpanded,
  onToggle,
  onAddMember,
}: {
  team: TeamListItem;
  isExpanded: boolean;
  onToggle: () => void;
  onAddMember: () => void;
}) {
  const { data: detail, isLoading: membersLoading } = useTeamDetail(isExpanded ? team.id : null);
  const removeMemberMutation = useRemoveTeamMember();
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    userId: string;
    fullName: string;
  } | null>(null);

  const members = [...(detail?.members ?? [])].sort(
    (a, b) => Number(b.isLeader) - Number(a.isLeader)
  );
  const availability = teamAvailabilityBadge(team.currentStatus);

  const handleToggle = () => {
    if (isExpanded) {
      setShowMemberActions(false);
      setMemberToRemove(null);
    }
    onToggle();
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      const res = await removeMemberMutation.mutateAsync({
        teamId: team.id,
        userId: memberToRemove.userId,
      });
      toastApiSuccess(res, `Đã xoá ${memberToRemove.fullName} khỏi đội.`);
      setMemberToRemove(null);
      setShowMemberActions(false);
    } catch (err) {
      toastApiError(err, 'Không thể xoá thành viên. Vui lòng thử lại.');
    }
  };

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-200 hover:shadow-md ${
        isExpanded ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-border'
      }`}
    >
      {/* Card body — click to expand */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-muted/20"
      >
        {/* Row 1: name + status + chevron */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold leading-snug text-foreground">{team.name}</span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${availability.className}`}
            >
              {availability.label}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          )}
        </div>

        {/* Row 2: office */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3 shrink-0" />
          <span className="truncate">{team.officeName}</span>
        </div>
      </button>

      {/* Card footer — hidden when expanded */}
      {!isExpanded && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              <span>{team.memberCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{formatDate(team.createdAt)}</span>
          </div>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onAddMember();
            }}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            <Plus className="size-3" />
            Thêm TV
          </button>
        </div>
      )}

      {/* Expanded: member list */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/20 px-4 pb-4 pt-3">
          {memberToRemove && (
            <RemoveMemberConfirmDialog
              memberName={memberToRemove.fullName}
              submitting={removeMemberMutation.isPending}
              onConfirm={() => void handleConfirmRemove()}
              onClose={() => setMemberToRemove(null)}
            />
          )}

          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Thành viên ({membersLoading ? '…' : members.length})
            </p>
            {!membersLoading && members.length > 0 && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setShowMemberActions(prev => !prev);
                }}
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition ${
                  showMemberActions
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title="Quản lý thành viên"
                aria-pressed={showMemberActions}
              >
                <MoreHorizontal className="size-4" />
              </button>
            )}
          </div>

          {membersLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex animate-pulse items-center gap-2.5">
                  <div className="size-8 rounded-full bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-28 rounded bg-muted" />
                    <div className="h-2 w-36 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="py-2 text-center text-xs italic text-muted-foreground">
              Chưa có thành viên
            </p>
          ) : (
            <ul className="space-y-2">
              {members.map(m => (
                <li key={m.userId} className="flex items-center gap-2.5">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      m.isLeader ? 'bg-amber-400' : 'bg-slate-300'
                    }`}
                  >
                    {getInitials(m.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{m.fullName}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{m.email}</p>
                  </div>
                  {m.isLeader && <Crown className="size-3.5 shrink-0 text-amber-400" />}
                  {showMemberActions && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setMemberToRemove({ userId: m.userId, fullName: m.fullName });
                      }}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      title="Xóa thành viên"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onAddMember();
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition hover:border-emerald-300 hover:text-emerald-600"
          >
            <UserPlus className="size-3.5" />
            Thêm thành viên vào đội
          </button>
        </div>
      )}
    </div>
  );
}

// ── Board card skeleton ───────────────────────────────────────────────────────
function TeamCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="flex gap-1.5">
          <div className="h-4 w-16 rounded-full bg-muted" />
          <div className="h-4 w-20 rounded-full bg-muted" />
        </div>
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
      <div className="border-t border-border px-4 py-2.5">
        <div className="flex gap-3">
          <div className="h-3 w-10 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'Tất cả',
  active: 'Hoạt động',
  inactive: 'Tạm dừng',
};

// ── Board view ────────────────────────────────────────────────────────────────
function BoardView() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addMemberTeam, setAddMemberTeam] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [cleanupPage, setCleanupPage] = useState(1);
  const [inspectionPage, setInspectionPage] = useState(1);

  const handleSearch = (v: string) => {
    setSearch(v);
    setCleanupPage(1);
    setInspectionPage(1);
  };

  const handleStatusFilter = (v: StatusFilter) => {
    setStatusFilter(v);
    setCleanupPage(1);
    setInspectionPage(1);
  };

  const boardListBase = useMemo((): Omit<TeamsListParams, 'teamType' | 'page'> => {
    const params: Omit<TeamsListParams, 'teamType' | 'page'> = { pageSize: 8 };
    if (statusFilter === 'active') params.isActive = true;
    if (statusFilter === 'inactive') params.isActive = false;
    return params;
  }, [statusFilter]);

  const { data: cleanupData, isLoading: cleanupLoading } = useTeamsList({
    ...boardListBase,
    teamType: 'Cleanup',
    page: cleanupPage,
  });
  const { data: inspectionData, isLoading: inspLoading } = useTeamsList({
    ...boardListBase,
    teamType: 'Inspection',
    page: inspectionPage,
  });

  const q = search.trim().toLowerCase();

  const cleanupTeams = (cleanupData?.items ?? []).filter(
    t => !q || t.name.toLowerCase().includes(q)
  );

  const inspectionTeams = (inspectionData?.items ?? []).filter(
    t => !q || t.name.toLowerCase().includes(q)
  );

  return (
    <>
      {addMemberTeam && (
        <AddMemberDialog
          teamId={addMemberTeam.id}
          teamName={addMemberTeam.name}
          onClose={() => setAddMemberTeam(null)}
        />
      )}

      {/* Search + status filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex flex-1 max-w-xs items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm tên đội..."
            className="h-9 rounded-lg pl-9 text-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg px-3 text-sm">
              {STATUS_LABEL[statusFilter]}
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            {(Object.keys(STATUS_LABEL) as StatusFilter[]).map(key => (
              <DropdownMenuItem
                key={key}
                onClick={() => handleStatusFilter(key)}
                className={statusFilter === key ? 'font-medium text-emerald-700' : ''}
              >
                {STATUS_LABEL[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 50/50 kanban columns */}
      <div className="mt-4 grid h-[calc(100vh-21rem)] grid-cols-2 gap-4">
        {/* ── Left: Cleanup ── */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
          <div className="flex shrink-0 items-center gap-2 px-4 py-3.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">Đội Dọn dẹp</h3>
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
              {cleanupLoading ? '…' : (cleanupData?.pagination.totalItems ?? 0)}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Thêm đội dọn dẹp"
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>

          <div className="scrollbar-smooth flex-1 overflow-y-auto px-3 pb-3">
            {cleanupLoading ? (
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-3">
                  {[1, 3].map(i => (
                    <TeamCardSkeleton key={i} />
                  ))}
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  {[2, 4].map(i => (
                    <TeamCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : cleanupTeams.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="size-8 opacity-30" />
                <span>Không có đội nào</span>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-3">
                  {cleanupTeams
                    .filter((_, i) => i % 2 === 0)
                    .map(team => (
                      <TeamCard
                        key={`${team.id}-${expandedId === team.id ? 'open' : 'closed'}`}
                        team={team}
                        isExpanded={expandedId === team.id}
                        onToggle={() => setExpandedId(prev => (prev === team.id ? null : team.id))}
                        onAddMember={() => setAddMemberTeam({ id: team.id, name: team.name })}
                      />
                    ))}
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  {cleanupTeams
                    .filter((_, i) => i % 2 !== 0)
                    .map(team => (
                      <TeamCard
                        key={`${team.id}-${expandedId === team.id ? 'open' : 'closed'}`}
                        team={team}
                        isExpanded={expandedId === team.id}
                        onToggle={() => setExpandedId(prev => (prev === team.id ? null : team.id))}
                        onAddMember={() => setAddMemberTeam({ id: team.id, name: team.name })}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Cleanup pagination */}
          {!cleanupLoading && (cleanupData?.pagination.totalPages ?? 1) > 1 && (
            <div className="shrink-0 border-t border-border px-3 py-2.5">
              <PaginationSimple
                page={cleanupPage}
                totalPages={cleanupData?.pagination.totalPages ?? 1}
                onPageChange={setCleanupPage}
                className="justify-center"
              />
            </div>
          )}
        </div>

        {/* ── Right: Inspection ── */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
          <div className="flex shrink-0 items-center gap-2 px-4 py-3.5">
            <span className="size-2.5 rounded-full bg-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">Đội Kiểm tra</h3>
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
              {inspLoading ? '…' : (inspectionData?.pagination.totalItems ?? 0)}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Thêm đội kiểm tra"
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>

          <div className="scrollbar-smooth flex-1 overflow-y-auto px-3 pb-3">
            {inspLoading ? (
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-3">
                  {[1, 3].map(i => (
                    <TeamCardSkeleton key={i} />
                  ))}
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  {[2, 4].map(i => (
                    <TeamCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : inspectionTeams.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="size-8 opacity-30" />
                <span>Không có đội nào</span>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-3">
                  {inspectionTeams
                    .filter((_, i) => i % 2 === 0)
                    .map(team => (
                      <TeamCard
                        key={`${team.id}-${expandedId === team.id ? 'open' : 'closed'}`}
                        team={team}
                        isExpanded={expandedId === team.id}
                        onToggle={() => setExpandedId(prev => (prev === team.id ? null : team.id))}
                        onAddMember={() => setAddMemberTeam({ id: team.id, name: team.name })}
                      />
                    ))}
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  {inspectionTeams
                    .filter((_, i) => i % 2 !== 0)
                    .map(team => (
                      <TeamCard
                        key={`${team.id}-${expandedId === team.id ? 'open' : 'closed'}`}
                        team={team}
                        isExpanded={expandedId === team.id}
                        onToggle={() => setExpandedId(prev => (prev === team.id ? null : team.id))}
                        onAddMember={() => setAddMemberTeam({ id: team.id, name: team.name })}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Inspection pagination */}
          {!inspLoading && (inspectionData?.pagination.totalPages ?? 1) > 1 && (
            <div className="shrink-0 border-t border-border px-3 py-2.5">
              <PaginationSimple
                page={inspectionPage}
                totalPages={inspectionData?.pagination.totalPages ?? 1}
                onPageChange={setInspectionPage}
                className="justify-center"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Team Detail Dialog ────────────────────────────────────────────────────────
function TeamDetailDialog({
  team,
  onClose,
  onAddMember,
}: {
  team: TeamListItem;
  onClose: () => void;
  onAddMember: () => void;
}) {
  const { data: detail, isLoading: membersLoading } = useTeamDetail(team.id);
  const members = [...(detail?.members ?? [])].sort(
    (a, b) => Number(b.isLeader) - Number(a.isLeader)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg border border-border bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-foreground">{team.name}</h2>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="size-3 shrink-0" />
              <span className="truncate">{team.officeName}</span>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              team.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {team.isActive ? '● Hoạt động' : '● Tạm dừng'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-1 shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Member list */}
        <div className="max-h-80 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Thành viên ({membersLoading ? '…' : members.length})
          </p>

          {membersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex animate-pulse items-center gap-2.5">
                  <div className="size-8 rounded-full bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-28 rounded bg-muted" />
                    <div className="h-2 w-36 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="py-4 text-center text-xs italic text-muted-foreground">
              Chưa có thành viên
            </p>
          ) : (
            <ul className="space-y-2.5">
              {members.map(m => (
                <li key={m.userId} className="flex items-center gap-2.5">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      m.isLeader ? 'bg-amber-400' : 'bg-slate-300'
                    }`}
                  >
                    {getInitials(m.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{m.fullName}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{m.email}</p>
                  </div>
                  {m.isLeader && <Crown className="size-3.5 shrink-0 text-amber-400" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onAddMember}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition hover:border-emerald-300 hover:text-emerald-600"
          >
            <UserPlus className="size-3.5" />
            Thêm thành viên vào đội
          </button>
        </div>
      </div>
    </div>
  );
}

// ── List view skeleton rows ───────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {['s1', 's2', 's3', 's4', 's5'].map(key => (
        <TableRow key={key} className="animate-pulse">
          <TableCell className="px-5">
            <div className="size-4 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-36 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-5 w-20 rounded-full bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-48 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-8 rounded bg-muted" />
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

// ── Main component ────────────────────────────────────────────────────────────
export function TeamTab({ viewMode }: Readonly<{ viewMode: 'list' | 'board' }>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailTeam, setDetailTeam] = useState<TeamListItem | null>(null);
  const [addMemberTeam, setAddMemberTeam] = useState<{ id: string; name: string } | null>(null);

  const listParams = useMemo((): TeamsListParams => {
    const params: TeamsListParams = { page, pageSize: PAGE_SIZE };
    if (statusFilter === 'active') params.isActive = true;
    if (statusFilter === 'inactive') params.isActive = false;
    return params;
  }, [page, statusFilter]);

  const { data, isLoading, isError, refetch } = useTeamsList(listParams);

  const totalCount = data?.pagination.totalItems ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
    setSelected(new Set());
  };

  const handleStatusFilter = (v: StatusFilter) => {
    setStatusFilter(v);
    setPage(1);
    setSelected(new Set());
  };

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    if (!debouncedSearch) return items;
    const q = debouncedSearch.toLowerCase();
    return items.filter(
      t => t.name.toLowerCase().includes(q) || t.officeName.toLowerCase().includes(q)
    );
  }, [data?.items, debouncedSearch]);

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const indeterminate = selected.size > 0 && selected.size < filtered.length;

  const toggleAll = () => {
    if (allChecked || indeterminate) setSelected(new Set());
    else setSelected(new Set(filtered.map(t => t.id)));
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().finally(() => setIsRefreshing(false));
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    setSelected(new Set());
  };

  if (viewMode === 'board') return <BoardView />;

  return (
    <div className="space-y-4">
      {detailTeam && (
        <TeamDetailDialog
          team={detailTeam}
          onClose={() => setDetailTeam(null)}
          onAddMember={() => {
            setAddMemberTeam({ id: detailTeam.id, name: detailTeam.name });
            setDetailTeam(null);
          }}
        />
      )}
      {addMemberTeam && (
        <AddMemberDialog
          teamId={addMemberTeam.id}
          teamName={addMemberTeam.name}
          onClose={() => setAddMemberTeam(null)}
        />
      )}
      {/* Toolbar — search + status filter (cùng board view) */}
      <div className="flex items-center gap-2">
        <div className="relative flex max-w-xs flex-1 items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm tên đội, văn phòng..."
            className="h-9 rounded-lg pl-9 text-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg px-3 text-sm">
              {STATUS_LABEL[statusFilter]}
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            {(Object.keys(STATUS_LABEL) as StatusFilter[]).map(key => (
              <DropdownMenuItem
                key={key}
                onClick={() => handleStatusFilter(key)}
                className={statusFilter === key ? 'font-medium text-emerald-700' : ''}
              >
                {STATUS_LABEL[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-9 text-muted-foreground"
        >
          <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-12 px-5">
                <Checkbox
                  checked={indeterminate ? 'indeterminate' : allChecked}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
                Tên đội
              </TableHead>
              <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
                Loại
              </TableHead>
              <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
                Văn phòng quản lý
              </TableHead>
              <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
                Thành viên
              </TableHead>
              <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
                Trạng thái
              </TableHead>
              <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
                Ngày tạo
              </TableHead>
              <TableHead className="w-12 px-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <SkeletonRows />}
            {isError && (
              <TableRow>
                <TableCell colSpan={8} className="px-5 py-10 text-center text-destructive">
                  Không thể tải dữ liệu. Vui lòng thử lại.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                  Không có đội nào phù hợp.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              !isError &&
              filtered.map(team => (
                <TableRow
                  key={team.id}
                  onClick={() => setDetailTeam(team)}
                  className={`cursor-pointer ${selected.has(team.id) ? 'bg-primary/5 hover:bg-primary/5' : ''}`}
                >
                  <TableCell className="px-5" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(team.id)}
                      onCheckedChange={() => toggleOne(team.id)}
                    />
                  </TableCell>
                  <TableCell className="px-5 font-medium">{team.name}</TableCell>
                  <TableCell className="px-5">
                    <Badge
                      variant="secondary"
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TYPE_CLASS[team.teamType] ?? 'bg-gray-100 text-gray-500'}`}
                    >
                      {TYPE_LABEL[team.teamType] ?? team.teamType}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 text-muted-foreground">{team.officeName}</TableCell>
                  <TableCell className="px-5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3.5" />
                      <span>{team.memberCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5">
                    {team.isActive ? (
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-600"
                      >
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500"
                      >
                        Tạm dừng
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-5 text-muted-foreground">
                    {formatDate(team.createdAt)}
                  </TableCell>
                  <TableCell className="px-5" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailTeam(team)}>
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setAddMemberTeam({ id: team.id, name: team.name })}
                        >
                          Phân công thành viên
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          Vô hiệu hoá
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-xs text-muted-foreground">
            {isLoading ? 'Đang tải...' : `${totalCount} đội`}
          </span>
          {totalPages > 1 && (
            <PaginationSimple
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="w-auto"
            />
          )}
        </div>
      </div>
    </div>
  );
}
