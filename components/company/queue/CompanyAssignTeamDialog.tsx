'use client';

import { useCompanyTeamOptions, useAssignCompanyTeam } from '@/hooks/useCompany';
import { getCompanyMutationError } from '@/utils/companyUi';
import { Loader2, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CompanyAssignTeamDialogProps {
  open: boolean;
  reportId: string | null;
  reportCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CompanyAssignTeamDialog({
  open,
  reportId,
  reportCode,
  onClose,
  onSuccess,
}: CompanyAssignTeamDialogProps) {
  const [teamId, setTeamId] = useState('');
  const [note, setNote] = useState('');

  const { options: teams, isPending: teamsLoading } = useCompanyTeamOptions();
  const assign = useAssignCompanyTeam();

  if (!open || !reportId) return null;

  const handleClose = () => {
    setTeamId('');
    setNote('');
    onClose();
  };

  const handleSubmit = () => {
    if (!teamId) {
      toast.error('Vui lòng chọn đội xử lý');
      return;
    }
    assign.mutate(
      {
        reportId,
        body: {
          teams: [{ teamId, ...(note.trim() ? { note: note.trim() } : {}) }],
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã phân công đội xử lý');
          onSuccess();
          handleClose();
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể phân công đội')),
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
        aria-labelledby="assign-team-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl dark:border-border dark:bg-card"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id="assign-team-title" className="text-lg font-semibold">
              Phân công đội
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Báo cáo <span className="font-semibold text-emerald-800">{reportCode}</span>
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

        <div className="space-y-4">
          <div>
            <label htmlFor="assign-team" className="mb-1.5 block text-sm font-medium">
              Đội dọn dẹp
            </label>
            {teamsLoading ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Đang tải đội…
              </div>
            ) : teams.length === 0 ? (
              <p className="rounded-lg border border-dashed border-emerald-200 px-3 py-4 text-sm text-muted-foreground">
                Chưa có đội hoạt động. Tạo đội trước khi phân công.
              </p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {teams.map(team => (
                  <label
                    key={team.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                      teamId === team.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-emerald-100 hover:border-emerald-300 dark:border-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name="team"
                      value={team.id}
                      checked={teamId === team.id}
                      onChange={() => setTeamId(team.id)}
                      className="sr-only"
                    />
                    <UsersRound className="size-4 shrink-0 text-emerald-700" aria-hidden />
                    <span className="text-sm font-medium">{team.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="assign-note" className="mb-1.5 block text-sm font-medium">
              Ghi chú <span className="font-normal text-muted-foreground">(tuỳ chọn)</span>
            </label>
            <textarea
              id="assign-note"
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Hướng dẫn cho đội xử lý…"
              className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-border dark:bg-background"
            />
          </div>
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
            Phân công
          </button>
        </div>
      </div>
    </div>
  );
}
