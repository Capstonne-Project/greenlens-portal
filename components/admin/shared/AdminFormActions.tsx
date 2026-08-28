'use client';

import { ADMIN_DIALOG_PRIMARY_BTN } from '@/components/admin/shared/adminUiTokens';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, type LucideIcon } from 'lucide-react';

interface AdminFormAction {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  variant?: 'ghost' | 'outline' | 'default' | 'destructive';
  type?: 'button' | 'submit';
}

interface AdminFormActionsProps {
  message?: React.ReactNode;
  actions: AdminFormAction[];
  className?: string;
  sticky?: boolean;
}

/** Thanh hành động form (sticky hoặc inline) — shadcn Button h-10. */
export function AdminFormActions({
  message,
  actions,
  className,
  sticky = false,
}: AdminFormActionsProps) {
  return (
    <div
      className={cn(
        sticky &&
          'sticky bottom-0 z-10 border-t border-border/90 bg-app-panel/95 py-3 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {message ? <div className="text-sm text-muted-foreground">{message}</div> : <span />}
        <div className="flex flex-wrap items-center gap-2">
          {actions.map(action => {
            const Icon = action.icon;
            const variant = action.variant ?? 'ghost';
            const isPrimary = variant === 'default';
            return (
              <Button
                key={action.label}
                type={action.type ?? 'button'}
                variant={variant}
                size="default"
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={isPrimary ? ADMIN_DIALOG_PRIMARY_BTN : undefined}
              >
                {action.loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {Icon ? <Icon className="size-4" aria-hidden /> : null}
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
