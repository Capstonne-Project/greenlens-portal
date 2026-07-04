'use client';

import { useAssignCompanyStaffTeam, useCompanyAllTeamOptions } from '@/hooks/useCompany';
import type { CompanyStaffItem } from '@/lib/api/models/company';
import { getCompanyMutationError } from '@/utils/companyUi';
import { Loader2, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CompanyStaffAssignTeamDialogProps {
  open: boolean;
  staff: CompanyStaffItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CompanyStaffAssignTeamDialog({
  open,
  staff,
  onClose,
  onSuccess,
}: CompanyStaffAssignTeamDialogProps) {
  const [teamId, setTeamId] = useState('');

  const { options: teams, isPending: teamsLoading } = useCompanyAllTeamOptions();
  const assign = useAssignCompanyStaffTeam();

  if (!open || !staff) return null;

  const handleClose = () => {
    setTeamId('');
    onClose();
  };

  const handleSubmit = () => {
    if (!teamId) {
      toast.error('Vui lòng chọn đội');
      return;
    }
    assign.mutate(
      { userId: staff.userId, body: { teamId } },
      {
        onSuccess: env => {
          toast.success(env.message ?? 'Đã gán nhân viên vào đội');
          onSuccess();
          handleClose();
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể gán đội')),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Đóng"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-staff-team-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl dark:border-border dark:bg-card"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id="assign-staff-team-title" className="text-lg font-semibold">
              Gán đội
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nhân viên <span className="font-semibold text-emerald-800">{staff.fullName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">Chọn đội dọn dẹp</p>
          {teamsLoading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Đang tải danh sách đội…
            </div>
          ) : teams.length === 0 ? (
            <p className="rounded-lg border border-dashed border-emerald-200 px-3 py-4 text-sm text-muted-foreground">
              Chưa có đội nào. Hãy tạo đội trước khi gán nhân viên.
            </p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {teams.map(team => (
                <label
                  key={team.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                    teamId === team.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-emerald-100 hover:border-emerald-300 dark:border-border'
                  } ${!team.isActive ? 'opacity-70' : ''}`}
                >
                  <input
                    type="radio"
                    name="staff-team"
                    value={team.id}
                    checked={teamId === team.id}
                    onChange={() => setTeamId(team.id)}
                    className="sr-only"
                  />
                  <UsersRound className="size-4 shrink-0 text-emerald-700" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{team.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {team.memberCount} thành viên
                      {!team.isActive ? ' · Ngưng hoạt động' : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-emerald-100 px-4 py-2 text-sm font-medium hover:bg-emerald-50 dark:border-border"
          >
            Huỷ
          </button>
          <button
            type="button"
            disabled={assign.isPending || !teamId || teams.length === 0}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {assign.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Gán đội
          </button>
        </div>
      </div>
    </div>
  );
}
