'use client';

import type { CompanyStaffItem } from '@/lib/api/models/company';
import { Loader2, UserMinus, X } from 'lucide-react';

interface CompanyStaffLeaveTeamDialogProps {
  open: boolean;
  staff: CompanyStaffItem | null;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function CompanyStaffLeaveTeamDialog({
  open,
  staff,
  submitting,
  onConfirm,
  onClose,
}: CompanyStaffLeaveTeamDialogProps) {
  if (!open || !staff) return null;

  const teamLabel = staff.teamName ?? 'hiện tại';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Đóng"
        disabled={submitting}
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-team-title"
        aria-describedby="leave-team-desc"
        className="relative z-10 w-full max-w-md rounded-2xl border border-amber-100 bg-white p-6 shadow-xl dark:border-border dark:bg-card"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40">
              <UserMinus className="size-5" aria-hidden />
            </span>
            <div>
              <h2 id="leave-team-title" className="text-lg font-semibold">
                Rời đội
              </h2>
              <p id="leave-team-desc" className="mt-1 text-sm text-muted-foreground">
                Cho <span className="font-semibold text-foreground">{staff.fullName}</span> rời đội{' '}
                <span className="font-semibold text-foreground">{teamLabel}</span>? Nhân viên vẫn
                thuộc công ty.
              </p>
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
            className="rounded-xl border border-emerald-100 px-4 py-2 text-sm font-medium hover:bg-emerald-50 disabled:opacity-50 dark:border-border"
          >
            Huỷ
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Xác nhận rời đội
          </button>
        </div>
      </div>
    </div>
  );
}
