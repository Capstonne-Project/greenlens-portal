'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CompanyStaffItem } from '@/lib/api/models/company';
import { Loader2, UserMinus } from 'lucide-react';

interface CompanyStaffLeaveTeamDialogProps {
  open: boolean;
  staff: CompanyStaffItem | null;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function CompanyStaffLeaveTeamDialog({
  open,
  staff,
  submitting,
  onConfirm,
  onClose,
}: CompanyStaffLeaveTeamDialogProps) {
  const teamLabel = staff?.teamName ?? 'hiện tại';

  return (
    <Dialog
      open={open && Boolean(staff)}
      onOpenChange={nextOpen => {
        if (!nextOpen && !submitting) onClose();
      }}
    >
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        onInteractOutside={e => {
          if (submitting) e.preventDefault();
        }}
        onEscapeKeyDown={e => {
          if (submitting) e.preventDefault();
        }}
      >
        <div className="space-y-4 p-6 md:p-8">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <UserMinus className="size-4" aria-hidden />
              </span>
              Rời đội
            </DialogTitle>
            <DialogDescription>
              Cho <span className="font-medium text-foreground">{staff?.fullName}</span> rời đội{' '}
              <span className="font-medium text-foreground">{teamLabel}</span>? Thành viên vẫn thuộc
              công ty.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="gap-2 border-t border-border bg-slate-50 px-6 py-4 sm:space-x-0">
          <Button type="button" variant="outline" disabled={submitting} onClick={onClose}>
            Huỷ
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="bg-amber-600 text-white hover:bg-amber-500"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận rời đội'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
