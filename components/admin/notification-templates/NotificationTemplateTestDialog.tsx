'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { ValidatedInput } from '@/components/common/ValidatedField';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';

interface NotificationTemplateTestDialogProps {
  open: boolean;
  templateTitle: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (recipientEmail: string) => void;
}

type NotificationTemplateTestDialogContentProps = Omit<NotificationTemplateTestDialogProps, 'open'>;

function NotificationTemplateTestDialogContent({
  templateTitle,
  busy,
  onClose,
  onSubmit,
}: NotificationTemplateTestDialogContentProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
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
      <div className="relative z-10 w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Gửi thử mẫu</h2>
            <p className="mt-1 text-sm text-muted-foreground">{templateTitle}</p>
          </div>
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
            <label htmlFor="test-email" className="mb-1.5 block text-sm font-medium">
              Email nhận thử
            </label>
            <ValidatedInput
              id="test-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              minLength={1}
              maxLength={254}
              placeholder="admin@greenlens.com.vn"
            />
          </div>
          <AdminDialogFooter
            onCancel={onClose}
            confirmType="submit"
            confirmLabel="Gửi thử"
            confirmLoading={busy}
            cancelDisabled={busy}
            confirmDisabled={busy}
          />
        </form>
      </div>
    </div>
  );
}

export function NotificationTemplateTestDialog({
  open,
  templateTitle,
  busy,
  onClose,
  onSubmit,
}: NotificationTemplateTestDialogProps) {
  if (!open) return null;

  return (
    <NotificationTemplateTestDialogContent
      key={templateTitle}
      templateTitle={templateTitle}
      busy={busy}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
