'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SuccessDialogAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tiêu đề chính — ví dụ "Thành công". */
  title: string;
  /** Mô tả ngắn dưới tiêu đề; có thể truyền JSX nếu cần nhấn mạnh. */
  description: ReactNode;
  /** Nút outline bên trái (vd. Trở về dashboard). */
  secondaryAction: SuccessDialogAction;
  /** Nút đặc bên phải (vd. Xem chi tiết). */
  primaryAction: SuccessDialogAction;
  /**
   * Accent palette cho header / check / CTA chính.
   * `'teal'` (mặc định) dùng mọi nơi; `'emerald'` cho màn verify.
   */
  accent?: 'teal' | 'emerald';
  className?: string;
}

const accentStyles = {
  teal: {
    headerBg: 'bg-teal-700 text-white',
    ringOuter: 'border-teal-500/40',
    ringMid: 'border-teal-400/35',
    ringInner: 'border-teal-300/30',
    dots: '[background-image:radial-gradient(circle,rgba(15,118,110,0.55)_1px,transparent_1.5px)]',
    checkShadow: 'shadow-teal-950/20',
    checkIcon: 'text-teal-700',
    primaryBtn: 'bg-teal-700 hover:bg-teal-600',
  },
  emerald: {
    headerBg: 'bg-emerald-600 text-white',
    ringOuter: 'border-emerald-400/40',
    ringMid: 'border-emerald-300/35',
    ringInner: 'border-emerald-200/30',
    dots: '[background-image:radial-gradient(circle,rgba(5,150,105,0.55)_1px,transparent_1.5px)]',
    checkShadow: 'shadow-emerald-950/20',
    checkIcon: 'text-emerald-600',
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-500',
  },
} as const;

/**
 * Dialog thành công tái sử dụng (header + check, 2 CTA).
 * `accent` đổi palette (teal mặc định / emerald cho verify) — không ảnh hưởng call site cũ.
 * Navigate để ở callback `onClick` của từng action — component không hardcode route.
 */
export function SuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  secondaryAction,
  primaryAction,
  accent = 'teal',
  className,
}: SuccessDialogProps) {
  const styles = accentStyles[accent];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'gap-0 overflow-hidden p-0 sm:max-w-md',
          /* Ẩn nút X mặc định — layout theo mẫu success */
          '[&>button]:hidden',
          className
        )}
        onPointerDownOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        <div
          className={cn(
            'relative flex h-36 items-center justify-center overflow-hidden',
            styles.headerBg
          )}
          aria-hidden
        >
          {/* Vòng tròn đồng tâm trang trí */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className={cn(
                'absolute top-1/2 left-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border',
                styles.ringOuter
              )}
            />
            <div
              className={cn(
                'absolute top-1/2 left-1/2 size-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full border',
                styles.ringMid
              )}
            />
            <div
              className={cn(
                'absolute top-1/2 left-1/2 size-[13rem] -translate-x-1/2 -translate-y-1/2 rounded-full border',
                styles.ringInner
              )}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
            <div
              className={cn('absolute inset-0 opacity-30 [background-size:14px_14px]', styles.dots)}
            />
          </div>

          <div
            className={cn(
              'relative flex size-16 items-center justify-center rounded-full bg-white shadow-md',
              styles.checkShadow
            )}
          >
            <Check className={cn('size-8 stroke-[2.5]', styles.checkIcon)} aria-hidden />
          </div>
        </div>

        <div className="space-y-2 px-6 pt-6 pb-2 text-center">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 pt-4 pb-6">
          <Button
            type="button"
            variant="outline"
            className="h-11 border-border bg-background font-medium text-foreground hover:bg-muted/60"
            disabled={secondaryAction.disabled}
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
          <Button
            type="button"
            className={cn('h-11 font-medium text-white', styles.primaryBtn)}
            disabled={primaryAction.disabled}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
