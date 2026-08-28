'use client';

import { ADMIN_DIALOG_PRIMARY_BTN } from '@/components/admin/shared/adminUiTokens';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, type LucideIcon } from 'lucide-react';

interface AdminDialogFooterProps {
  onCancel: () => void;
  onConfirm?: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  cancelDisabled?: boolean;
  confirmVariant?: 'default' | 'destructive';
  confirmType?: 'button' | 'submit';
  confirmIcon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
}

/** Chuẩn footer dialog admin — shadcn Button, h-10, emerald primary. */
export function AdminDialogFooter({
  onCancel,
  onConfirm,
  cancelLabel = 'Hủy',
  confirmLabel = 'Xác nhận',
  confirmDisabled = false,
  confirmLoading = false,
  cancelDisabled = false,
  confirmVariant = 'default',
  confirmType = 'button',
  confirmIcon: ConfirmIcon,
  className,
  children,
}: AdminDialogFooterProps) {
  return (
    <div className={cn('flex flex-wrap justify-end gap-2 pt-1', className)}>
      {children}
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={cancelDisabled || confirmLoading}
      >
        {cancelLabel}
      </Button>
      {onConfirm || confirmType === 'submit' ? (
        <Button
          type={confirmType}
          variant={confirmVariant}
          onClick={confirmType === 'submit' ? undefined : onConfirm}
          disabled={confirmDisabled || confirmLoading}
          className={confirmVariant === 'default' ? ADMIN_DIALOG_PRIMARY_BTN : undefined}
        >
          {confirmLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {ConfirmIcon ? <ConfirmIcon className="size-4" aria-hidden /> : null}
          {confirmLabel}
        </Button>
      ) : null}
    </div>
  );
}
