'use client';

import { CompanyStaffAssignTeamDialog } from '@/components/company/staff/CompanyStaffAssignTeamDialog';
import { CompanyStaffCreateDialog } from '@/components/company/staff/CompanyStaffCreateDialog';
import { CompanyStaffLeaveTeamDialog } from '@/components/company/staff/CompanyStaffLeaveTeamDialog';
import { CompanyStaffTempPasswordDialog } from '@/components/company/staff/CompanyStaffTempPasswordDialog';
import {
  useCompanyStaffList,
  useRemoveCompanyTeamMember,
  useUpdateCompanyStaffStatus,
} from '@/hooks/useCompany';
import type { CompanyStaffItem, CreateCompanyStaffResult } from '@/lib/api/models/company';
import { formatCompanyDate, getCompanyMutationError } from '@/utils/companyUi';
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Power,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

type ActiveFilter = 'all' | 'active' | 'inactive';

const PAGE_SIZE = 20;

function staffHasTeam(row: CompanyStaffItem): boolean {
  return Boolean(row.teamId);
}

export function CompanyStaffView() {
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [createdStaff, setCreatedStaff] = useState<CreateCompanyStaffResult | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<CompanyStaffItem | null>(null);
  const [assignTarget, setAssignTarget] = useState<CompanyStaffItem | null>(null);

  const updateStatus = useUpdateCompanyStaffStatus();
  const removeTeamMember = useRemoveCompanyTeamMember();

  const isActiveParam =
    activeFilter === 'all' ? undefined : activeFilter === 'active' ? true : false;

  const { data, isPending, isError } = useCompanyStaffList({
    page,
    pageSize: PAGE_SIZE,
    isActive: isActiveParam,
  });

  const handleCreated = useCallback((result: CreateCompanyStaffResult) => {
    setCreateOpen(false);
    setCreatedStaff(result);
  }, []);

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
    if (!leaveTarget?.teamId) return;

    removeTeamMember.mutate(
      { teamId: leaveTarget.teamId, userId: leaveTarget.userId },
      {
        onSuccess: env => {
          toast.success(env.message ?? 'Đã cho nhân viên rời đội');
          setLeaveTarget(null);
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể rời đội')),
      }
    );
  };

  const pagination = data?.pagination;
  const items = data?.items ?? [];

  return (
    <div className="relative space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mật khẩu tạm chỉ hiển thị một lần sau khi tạo tài khoản.
        </p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="size-4" aria-hidden />
          Thêm nhân viên
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'all', label: 'Tất cả' },
            { key: 'active', label: 'Đang hoạt động' },
            { key: 'inactive', label: 'Ngưng hoạt động' },
          ] as const
        ).map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              setActiveFilter(opt.key);
              setPage(1);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              activeFilter === opt.key
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                : 'border-emerald-100 bg-white text-muted-foreground hover:border-emerald-300 hover:text-emerald-800 dark:border-border dark:bg-card'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Đang tải danh sách…
          </div>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-destructive">
            Không tải được danh sách nhân sự.
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="size-10 text-emerald-200" aria-hidden />
            <p className="text-sm text-muted-foreground">Chưa có nhân viên nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-emerald-50 bg-emerald-50/60 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:border-border dark:bg-muted/40 dark:text-muted-foreground">
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Chức vụ</th>
                  <th className="px-4 py-3">Đội</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map(row => (
                  <tr
                    key={row.userId}
                    className="border-b border-emerald-50/80 last:border-0 dark:border-border/60"
                  >
                    <td className="px-4 py-3 font-medium">{row.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                    <td className="px-4 py-3">{row.position}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.teamName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          row.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {row.isActive ? 'Hoạt động' : 'Ngưng'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCompanyDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {staffHasTeam(row) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setAssignTarget(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                            >
                              <ArrowRightLeft className="size-3.5" aria-hidden />
                              Đổi đội
                            </button>
                            <button
                              type="button"
                              onClick={() => setLeaveTarget(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                            >
                              <UserMinus className="size-3.5" aria-hidden />
                              Rời đội
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAssignTarget(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                          >
                            <UserPlus className="size-3.5" aria-hidden />
                            Gán đội
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={togglingId === row.userId}
                          onClick={() => handleToggleStatus(row)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                            row.isActive
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {togglingId === row.userId ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          ) : (
                            <Power className="size-3.5" aria-hidden />
                          )}
                          {row.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-emerald-50 px-4 py-3 text-sm dark:border-border">
            <p className="text-muted-foreground">
              Trang {pagination.page} / {pagination.totalPages} · {pagination.totalItems} nhân viên
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrev}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 px-3 py-1.5 disabled:opacity-40 dark:border-border"
              >
                <ChevronLeft className="size-4" aria-hidden />
                Trước
              </button>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 px-3 py-1.5 disabled:opacity-40 dark:border-border"
              >
                Sau
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
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
