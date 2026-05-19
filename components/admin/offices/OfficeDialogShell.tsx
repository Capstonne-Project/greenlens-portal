'use client';

import { X } from 'lucide-react';

type OfficeDialogSize = 'md' | 'wide' | 'xl' | 'full';

interface OfficeDialogShellProps {
  open: boolean;
  title: string;
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  xl?: boolean;
  size?: OfficeDialogSize;
}

function resolveSize(
  size: OfficeDialogSize | undefined,
  wide: boolean,
  xl: boolean
): OfficeDialogSize {
  if (size) return size;
  if (xl) return 'xl';
  if (wide) return 'wide';
  return 'md';
}

const SIZE_CLASS: Record<OfficeDialogSize, string> = {
  md: 'max-w-md',
  wide: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-5xl',
};

export function OfficeDialogShell({
  open,
  title,
  titleId,
  onClose,
  children,
  wide = false,
  xl = false,
  size: sizeProp,
}: OfficeDialogShellProps) {
  if (!open) return null;

  const size = resolveSize(sizeProp, wide, xl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8 ${SIZE_CLASS[size]}`}
        onClick={e => e.stopPropagation()}
      >
        <header className="mb-5 flex shrink-0 items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
