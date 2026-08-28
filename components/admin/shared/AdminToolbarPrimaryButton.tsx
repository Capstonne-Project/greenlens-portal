'use client';

import { ADMIN_TOOLBAR_CTA } from '@/components/admin/shared/adminUiTokens';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AdminToolbarPrimaryButtonProps = Omit<ButtonProps, 'size'> & {
  size?: never;
};

/** Primary CTA trong toolbar admin — chuẩn users: `size="sm"` + `h-9`. */
export function AdminToolbarPrimaryButton({
  className,
  children,
  ...props
}: AdminToolbarPrimaryButtonProps) {
  return (
    <Button type="button" size="sm" className={cn(ADMIN_TOOLBAR_CTA, className)} {...props}>
      {children}
    </Button>
  );
}
