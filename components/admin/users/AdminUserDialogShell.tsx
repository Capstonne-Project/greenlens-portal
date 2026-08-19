'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  return (
    <Dialog open={open} onOpenChange={nextOpen => { if (!nextOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md" aria-labelledby={titleId}>
        <DialogHeader>
          <DialogTitle id={titleId}>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
