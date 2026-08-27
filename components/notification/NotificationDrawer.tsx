'use client';

import { NotificationDrawerPanel } from './NotificationDrawerPanel';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useNotificationUiStore } from '@/lib/store/notificationUiStore';
import { releaseOverlayLock } from '@/lib/utils/radixUi';
import { resolveNotificationPortal } from '@/utils/notificationUi';
import { usePathname } from 'next/navigation';

/**
 * Drawer trượt từ phải — mount 1 lần trong AppSidebar.
 * Data: REST qua React Query. Realtime: SignalR (`lib/realtime`) → `useNotificationRealtime` ở bell/nav.
 */
export function NotificationDrawer() {
  const pathname = usePathname();
  const isOpen = useNotificationUiStore(s => s.isDrawerOpen);
  const closeDrawer = useNotificationUiStore(s => s.closeDrawer);
  const portal = resolveNotificationPortal(pathname);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          closeDrawer();
          releaseOverlayLock();
        }
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">Thông báo</SheetTitle>
        <SheetDescription className="sr-only">
          Danh sách thông báo gần đây. Có thể đánh dấu đã đọc hoặc mở chi tiết.
        </SheetDescription>
        <NotificationDrawerPanel portal={portal} />
      </SheetContent>
    </Sheet>
  );
}
