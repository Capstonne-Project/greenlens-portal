'use client';

import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';

interface NotificationTemplateTestDialogProps {
  open: boolean;
  templateTitle: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (recipientEmail: string) => void;
}

export function NotificationTemplateTestDialog({
  open,
  templateTitle,
  busy,
  onClose,
  onSubmit,
}: NotificationTemplateTestDialogProps) {
  if (!open) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim();
    if (!email) return;
    onSubmit(email);
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
      <div className="relative z-10 w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Gửi thử mẫu</h2>
            <p className="mt-1 text-sm text-muted-foreground">{templateTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1.5 hover:bg-muted"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="test-email" className="mb-1.5 block text-sm font-medium">
              Email nhận thử
            </label>
            <input
              id="test-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              placeholder="admin@greenlens.com.vn"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={busy}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
              )}
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Gửi thử
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
