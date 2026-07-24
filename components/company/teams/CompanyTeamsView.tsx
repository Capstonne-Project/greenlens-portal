'use client';

import {
  CompanyTeamArchiveDialog,
  type CompanyTeamArchiveTarget,
} from '@/components/company/teams/CompanyTeamArchiveDialog';
import { CompanyTeamCreateDialog } from '@/components/company/teams/CompanyTeamCreateDialog';
import { CompanyTeamRenameDialog } from '@/components/company/teams/CompanyTeamRenameDialog';
import { useArchiveCompanyTeam, useCompanyTeamsList } from '@/hooks/useCompany';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCompanyDate, getCompanyMutationError } from '@/utils/companyUi';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type ActiveFilter = 'all' | 'active' | 'inactive';

const PAGE_SIZE = 12;

export function CompanyTeamsView() {
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CompanyTeamArchiveTarget | null>(null);

  const isActiveParam =
    activeFilter === 'all' ? undefined : activeFilter === 'active' ? true : false;

  const { data, isPending, isError, refetch } = useCompanyTeamsList({
    page,
    pageSize: PAGE_SIZE,
    isActive: isActiveParam,
  });

  const archiveTeam = useArchiveCompanyTeam();
  const teams = data?.items ?? [];
  const pagination = data?.pagination;

  const confirmArchiveToggle = () => {
    if (!archiveTarget) return;

    const nextActive = !archiveTarget.isActive;
    archiveTeam.mutate(
      { id: archiveTarget.id, body: { isActive: nextActive } },
      {
        onSuccess: env => {
          toast.success(
            env.message ?? (nextActive ? 'Đã kích hoạt lại đội' : 'Đã vô hiệu hóa đội')
          );
          setArchiveTarget(null);
        },
        onError: err =>
          toast.error(
            getCompanyMutationError(
              err,
              nextActive ? 'Không thể kích hoạt đội' : 'Không thể vô hiệu hóa đội'
            )
          ),
      }
    );
  };

  return (
    <div className="relative space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Đội Cleanup được gán theo nhiệm vụ khi có báo cáo từ LEO.
        </p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="size-4" aria-hidden />
          Tạo đội
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={activeFilter}
          onValueChange={v => {
            setActiveFilter(v as ActiveFilter);
            setPage(1);
          }}
        >
          <SelectTrigger
            id="teams-active-filter"
            className="h-10 w-[14rem] rounded-lg"
            aria-label="Trạng thái đội"
          >
            <SelectValue placeholder="Trạng thái: Tất cả" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Vô hiệu</SelectItem>
            <SelectItem value="all">Trạng thái: Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Đang tải…
          </div>
        ) : isError ? (
          <div className="flex items-start gap-3 p-6 text-sm">
            <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />
            <div className="space-y-3">
              <p className="font-semibold text-destructive">Không tải được danh sách đội</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted"
              >
                <RefreshCw className="size-4" aria-hidden />
                Thử lại
              </button>
            </div>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <UsersRound className="size-10 text-emerald-200" aria-hidden />
            <p className="text-sm text-muted-foreground">Chưa có đội nào.</p>
          </div>
        ) : (
          <ul className="divide-y divide-emerald-50 dark:divide-border">
            {teams.map(team => (
              <li
                key={team.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-lg font-bold text-white shadow-sm">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{team.name}</h3>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                        {team.teamType}
                      </span>
                      {!team.isActive && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          Vô hiệu
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {team.memberCount} thành viên · {formatCompanyDate(team.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 sm:pl-4">
                  <button
                    type="button"
                    onClick={() => setRenameTarget({ id: team.id, name: team.name })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 px-3 py-1.5 text-xs font-medium hover:bg-emerald-50 dark:border-border"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Đổi tên
                  </button>
                  <button
                    type="button"
                    disabled={archiveTeam.isPending && archiveTarget?.id === team.id}
                    onClick={() =>
                      setArchiveTarget({ id: team.id, name: team.name, isActive: team.isActive })
                    }
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50',
                      team.isActive
                        ? 'border-red-100 text-red-700 hover:bg-red-50'
                        : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                    )}
                  >
                    {archiveTeam.isPending && archiveTarget?.id === team.id ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Power className="size-3.5" aria-hidden />
                    )}
                    {team.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-emerald-50 px-4 py-3 text-sm dark:border-border">
            <p className="text-muted-foreground">
              {pagination.page}/{pagination.totalPages} · {pagination.totalItems} đội
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={!pagination.hasPrev}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-lg p-2 hover:bg-emerald-50 disabled:opacity-30"
                aria-label="Trang trước"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setPage(p => p + 1)}
                className="rounded-lg p-2 hover:bg-emerald-50 disabled:opacity-30"
                aria-label="Trang sau"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <CompanyTeamCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <CompanyTeamRenameDialog
        open={Boolean(renameTarget)}
        team={renameTarget}
        onClose={() => setRenameTarget(null)}
      />

      <CompanyTeamArchiveDialog
        open={Boolean(archiveTarget)}
        team={archiveTarget}
        submitting={archiveTeam.isPending}
        onConfirm={confirmArchiveToggle}
        onClose={() => {
          if (!archiveTeam.isPending) setArchiveTarget(null);
        }}
      />
    </div>
  );
}
