'use client';

import { Button } from '@/components/ui/button';
import { faBuilding, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AssignOfficeDialogProps {
  open: boolean;
  onClose: () => void;
  reportCount: number;
  onSubmit: (targetLocalOfficeIds: string[], note: string) => Promise<void> | void;
  submitting: boolean;
}

export function AssignOfficeDialog({ open, ...props }: AssignOfficeDialogProps) {
  if (!open) return null;
  return <AssignOfficeDialogContent {...props} />;
}

function AssignOfficeDialogContent({ onClose, submitting }: Omit<AssignOfficeDialogProps, 'open'>) {
  const [note, setNote] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (!submitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);

  const handleSubmit = () => {};

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-office-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex shrink-0 items-start justify-between border-b border-border px-6 pb-4 pt-6">
          <div className="min-w-0 pr-3">
            <h2
              id="assign-office-dialog-title"
              className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-foreground"
            >
              <FontAwesomeIcon icon={faBuilding} className="size-4 text-foreground" aria-hidden />
              Phân công đơn vị xử lý
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="shrink-0 px-6 py-5">
          <label
            htmlFor="assign-office-note"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Ghi chú (tuỳ chọn)
          </label>
          <textarea
            id="assign-office-note"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Yêu cầu xử lý, deadline, lưu ý..."
            className="mt-2 h-18 w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10"
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            <FontAwesomeIcon icon={faUserPlus} className="mr-1.5 size-3.5" aria-hidden />
            {submitting ? 'Đang phân công...' : 'Phân công'}
          </Button>
        </div>
      </div>
    </div>
  );
}
