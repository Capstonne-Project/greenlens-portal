'use client';

import { X } from 'lucide-react';

interface AdminUserDialogShellProps {
  open: boolean;
  title: string;
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function AdminUserDialogShell({
  open,
  title,
  titleId,
  onClose,
  children,
}: AdminUserDialogShellProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-card border border-border bg-card p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <DialogHeader title={title} titleId={titleId} onClose={onClose} />
        {children}
      </div>
    </div>
  );
}

function DialogHeader({
  title,
  titleId,
  onClose,
}: {
  title: string;
  titleId: string;
  onClose: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        aria-label="Đóng"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
