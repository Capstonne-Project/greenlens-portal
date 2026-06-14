'use client';

import { Button } from '@/components/ui/button';
import { Building2, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
// import { DeoOfficesTable } from './DeoOfficesTable';

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

function AssignOfficeDialogContent({
  onClose,
  // onSubmit,
  submitting,
}: Omit<AssignOfficeDialogProps, 'open'>) {
  // const [selectedOfficeIds, setSelectedOfficeIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  // const [departmentName, setDepartmentName] = useState<string | undefined>();

  // const canSubmit = selectedOfficeIds.length > 0 && !submitting;

  /* const toggleOffice = (officeId: string) => {
    setSelectedOfficeIds(prev =>
      prev.includes(officeId) ? prev.filter(id => id !== officeId) : [...prev, officeId]
    );
  }; */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (!submitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);

  const handleSubmit = () => {
    // if (!canSubmit) return;
    // void onSubmit(selectedOfficeIds, note.trim());
  };

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
      <div className="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2
              id="assign-office-dialog-title"
              className="flex items-center gap-2 text-base font-semibold text-foreground"
            >
              <Building2 className="size-4 text-emerald-600" />
              Phân công đơn vị xử lý
            </h2>
            {/* {departmentName ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">{departmentName}</p>
            ) : null} */}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* <DeoOfficesTable
          selectable
          paginationMode="infinite"
          selectedOfficeIds={selectedOfficeIds}
          onToggleOffice={toggleOffice}
          onMetaChange={meta => setDepartmentName(meta.departmentName)}
          className="min-h-0 flex-1"
        /> */}

        <div className="shrink-0 border-t border-border px-5 py-3">
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
            className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
          <Button
            variant="outline"
            onClick={onClose} // disabled={submitting}
          >
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            // disabled={!canSubmit}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            <UserPlus className="mr-1.5 size-4" />
            {submitting ? 'Đang phân công...' : 'Phân công'}
          </Button>
        </div>
      </div>
    </div>
  );
}
