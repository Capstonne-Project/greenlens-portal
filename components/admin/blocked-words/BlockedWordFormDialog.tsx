'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { ValidatedInput } from '@/components/common/ValidatedField';
import { Button } from '@/components/ui/button';
import type { BlockedWord } from '@/lib/api/models/blockedWord';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

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

type BlockedWordFormDialogContentProps = Omit<BlockedWordFormDialogProps, 'open' | 'initial'> & {
  initialWord: string;
};

function BlockedWordFormDialogContent({
  mode,
  initialWord,
  busy,
  onClose,
  onSubmit,
}: BlockedWordFormDialogContentProps) {
  const [word, setWord] = useState(initialWord);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = word.trim();
    if (!trimmed) return;
    onSubmit({ word: trimmed });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Button
        type="button"
        variant="ghost"
        className="absolute inset-0 h-auto w-full rounded-none bg-black/40 p-0 hover:bg-black/40"
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={busy}
            className="shrink-0 text-muted-foreground"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="blocked-word" className="mb-1.5 block text-sm font-medium">
              Từ / cụm từ
            </label>
            <ValidatedInput
              id="blocked-word"
              value={word}
              onChange={e => setWord(e.target.value)}
              minLength={1}
              maxLength={120}
              required
              placeholder="vd: spam, tục tĩu…"
            />
          </div>

          <AdminDialogFooter
            onCancel={onClose}
            confirmType="submit"
            confirmLabel={mode === 'create' ? 'Thêm' : 'Lưu'}
            confirmLoading={busy}
            cancelDisabled={busy}
            confirmDisabled={busy}
          />
        </form>
      </div>
    </div>
  );
}

export function BlockedWordFormDialog({
  open,
  mode,
  initial,
  busy,
  onClose,
  onSubmit,
}: BlockedWordFormDialogProps) {
  if (!open) return null;

  const formKey = mode === 'edit' ? (initial?.id ?? 'edit') : 'create';

  return (
    <BlockedWordFormDialogContent
      key={formKey}
      mode={mode}
      initialWord={initial?.word ?? ''}
      busy={busy}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
