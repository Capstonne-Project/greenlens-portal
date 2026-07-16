'use client';

import { cn } from '@/lib/utils';
import { Loader2, Power, X } from 'lucide-react';

export type CompanyTeamArchiveTarget = {
  id: string;
  name: string;
  isActive: boolean;
};

interface CompanyTeamArchiveDialogProps {
  open: boolean;
  team: CompanyTeamArchiveTarget | null;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function CompanyTeamArchiveDialog({
  open,
  team,
  submitting,
  onConfirm,
  onClose,
}: CompanyTeamArchiveDialogProps) {
  if (!open || !team) return null;

  const isDeactivating = team.isActive;

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
        aria-labelledby="team-archive-title"
        aria-describedby="team-archive-desc"
        className={cn(
          'relative z-10 w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl dark:bg-card',
          isDeactivating
            ? 'border-red-100 dark:border-border'
            : 'border-emerald-100 dark:border-border'
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                isDeactivating
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/40'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
              )}
            >
              <Power className="size-5" aria-hidden />
            </span>
            <div>
              <h2 id="team-archive-title" className="text-lg font-semibold">
                {isDeactivating ? 'Vô hiệu hóa đội' : 'Kích hoạt lại đội'}
              </h2>
              <p id="team-archive-desc" className="mt-1 text-sm text-muted-foreground">
                {isDeactivating ? (
                  <>
                    Vô hiệu hóa đội{' '}
                    <span className="font-semibold text-foreground">{team.name}</span>? Đội sẽ không
                    nhận task mới cho đến khi được kích hoạt lại.
                  </>
                ) : (
                  <>
                    Kích hoạt lại đội{' '}
                    <span className="font-semibold text-foreground">{team.name}</span>? Đội có thể
                    được phân công task mới.
                  </>
                )}
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
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50',
              isDeactivating ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            )}
          >
            {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isDeactivating ? 'Vô hiệu hóa' : 'Kích hoạt'}
          </button>
        </div>
      </div>
    </div>
  );
}
