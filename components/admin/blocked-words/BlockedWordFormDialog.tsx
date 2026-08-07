'use client';

import type { BlockedWord } from '@/lib/api/models/blockedWord';
import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';
import { useEffect } from 'react';

export type BlockedWordFormValues = {
  word: string;
};

interface BlockedWordFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: BlockedWord | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: BlockedWordFormValues) => void;
}

export function BlockedWordFormDialog({
  open,
  mode,
  initial,
  busy,
  onClose,
  onSubmit,
}: BlockedWordFormDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const word = String(fd.get('word') ?? '').trim();
    if (!word) return;
    onSubmit({ word });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Đóng"
        disabled={busy}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {mode === 'create' ? 'Thêm từ cấm' : 'Sửa từ cấm'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="blocked-word" className="mb-1.5 block text-sm font-medium">
              Từ / cụm từ
            </label>
            <input
              id="blocked-word"
              name="word"
              defaultValue={initial?.word ?? ''}
              required
              minLength={1}
              maxLength={120}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              placeholder="vd: spam, tục tĩu…"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={busy}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50'
              )}
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {mode === 'create' ? 'Thêm' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
