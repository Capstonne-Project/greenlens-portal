'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { getBadgeDisplay } from '@/lib/constants/adminBadges';
import type { AdminBadge } from '@/lib/api/models/adminBadge';
import { resolveBadgeIconUrl } from '@/utils/adminBadgeUi';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BadgeIconPreviewDialogProps {
  badge: AdminBadge | null;
  open: boolean;
  onClose: () => void;
}

export function BadgeIconPreviewDialog({ badge, open, onClose }: BadgeIconPreviewDialogProps) {
  const url = badge ? resolveBadgeIconUrl(badge.iconUrl) : null;
  const { iconBg } = badge ? getBadgeDisplay(badge.code) : { iconBg: 'bg-zinc-100' };

  return (
    <Dialog
      open={open && badge != null && url != null}
      onOpenChange={next => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className={cn(
          'max-w-[min(22rem,calc(100vw-1.5rem))] gap-0 overflow-hidden p-0 sm:max-w-sm',
          'duration-150 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0',
          'data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0'
        )}
      >
        <DialogTitle className="sr-only">{badge?.nameVi ?? 'Icon huy hiệu'}</DialogTitle>
        <DialogDescription className="sr-only">Xem icon huy hiệu phóng to</DialogDescription>
        {badge && url ? (
          <>
            <div
              className={`flex aspect-square w-full items-center justify-center p-6 sm:p-8 ${iconBg}`}
            >
              <Image
                src={url}
                alt={badge.nameVi}
                width={512}
                height={512}
                className="h-full w-full object-contain drop-shadow-sm"
                unoptimized
                priority
              />
            </div>
            <div className="border-t border-border px-4 py-3 text-center sm:px-5 sm:py-4">
              <p className="font-semibold text-foreground">{badge.nameVi}</p>
              {badge.nameEn ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{badge.nameEn}</p>
              ) : null}
              <p className="mt-1 font-mono text-xs text-muted-foreground">#{badge.code}</p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
