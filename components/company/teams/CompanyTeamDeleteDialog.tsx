'use client';

import { cn } from '@/lib/utils';
import { Loader2, Trash2, X } from 'lucide-react';

export type CompanyTeamDeleteTarget = {
  id: string;
  name: string;
  memberCount: number;
};

interface CompanyTeamDeleteDialogProps {
  open: boolean;
  team: CompanyTeamDeleteTarget | null;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function CompanyTeamDeleteDialog({
  open,
  team,
  submitting,
  onConfirm,
  onClose,
}: CompanyTeamDeleteDialogProps) {
  if (!open || !team) return null;

  const hasMembers = team.memberCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Đóng"
        disabled={submitting}
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="team-delete-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-xl dark:border-border dark:bg-card"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40">
              <Trash2 className="size-5" aria-hidden />
            </span>
            <div>
              <h2 id="team-delete-title" className="text-lg font-semibold">
                Xóa đội
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Xóa mềm đội <span className="font-semibold text-foreground">{team.name}</span>? Đội
                sẽ không còn xuất hiện trên hệ thống (dữ liệu vẫn được lưu).
              </p>
              {hasMembers ? (
                <p className="mt-2 text-sm font-medium text-red-700">
                  Đội còn {team.memberCount} thành viên — gỡ hết thành viên trước khi xóa.
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-emerald-100 px-4 py-2 text-sm font-medium hover:bg-emerald-50 dark:border-border"
          >
            Huỷ
          </button>
          <button
            type="button"
            disabled={submitting || hasMembers}
            onClick={onConfirm}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50'
            )}
          >
            {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Xóa đội
          </button>
        </div>
      </div>
    </div>
  );
}
