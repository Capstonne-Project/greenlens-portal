'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

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
  /**
   * `top` — neo phía trên, box dài xuống (chỉ wizard tạo văn phòng).
   * Mặc định `center` — giữa màn hình như các dialog khác.
   */
  placement?: 'center' | 'top';
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
  placement = 'center',
}: OfficeDialogShellProps) {
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    const blockScroll = (e: WheelEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) {
        e.preventDefault();
        return;
      }
      // Cho phép scroll bên trong panel dialog / listbox portal
      if (
        target.closest('[role="dialog"]') ||
        target.closest('[role="listbox"]') ||
        target.closest('[data-dialog-scroll]')
      ) {
        return;
      }
      e.preventDefault();
    };

    window.addEventListener('wheel', blockScroll, { passive: false });
    window.addEventListener('touchmove', blockScroll, { passive: false });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener('wheel', blockScroll);
      window.removeEventListener('touchmove', blockScroll);
    };
  }, [open]);

  if (!open) return null;

  const size = resolveSize(sizeProp, wide, xl);
  const isTop = placement === 'top';

  return (
    <div
      className={
        isTop
          ? 'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-10 sm:p-6 sm:pt-12'
          : 'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4 sm:p-6'
      }
      role="presentation"
      onClick={onClose}
      onWheel={e => {
        // Overlay nhận wheel — không lan ra document nếu không scroll trong dialog
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-dialog-scroll
        className={`${
          isTop ? 'mb-10' : ''
        } w-full overflow-visible rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8 ${SIZE_CLASS[size]}`}
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
