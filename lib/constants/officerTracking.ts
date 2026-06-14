import type { ReportStatus } from '@/lib/api/models/report';

/** Theo dõi tiến độ — không hiển thị Submitted / Verified / Dispatched. */
export const TRACKING_EXCLUDED_STATUSES: ReportStatus[] = ['Submitted', 'Verified', 'Dispatched'];

export const STALE_UPDATE_DAYS = 3;
