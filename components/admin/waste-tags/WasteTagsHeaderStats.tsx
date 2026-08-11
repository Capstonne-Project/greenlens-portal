'use client';

import { useAdminWasteTagsList } from '@/hooks/useWasteTags';
import { ADMIN_WASTE_TAGS_LIST_FETCH_SIZE } from '@/lib/constants/adminWasteTags';

/** Thống kê inline cạnh tiêu đề trang — dùng chung query cache với AdminWasteTagsView. */
export function WasteTagsHeaderStats() {
  const activeQuery = useAdminWasteTagsList({
    isActive: true,
    page: 1,
    pageSize: ADMIN_WASTE_TAGS_LIST_FETCH_SIZE,
    sortBy: 'displayOrder',
    sortDesc: false,
  });
  const inactiveQuery = useAdminWasteTagsList({
    isActive: false,
    page: 1,
    pageSize: ADMIN_WASTE_TAGS_LIST_FETCH_SIZE,
    sortBy: 'displayOrder',
    sortDesc: false,
  });

  const activeCount = activeQuery.data?.items.length ?? 0;
  const inactiveCount = inactiveQuery.data?.items.length ?? 0;
  const loading = activeQuery.isPending || inactiveQuery.isPending;

  return (
    <span className="truncate text-sm font-normal text-muted-foreground">
      {loading ? '· …' : `· ${activeCount} đang dùng · ${inactiveCount} đã tắt`}
    </span>
  );
}
