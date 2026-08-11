import type {
  AdminReportListItem,
  AdminReportsListParams,
  PaginationMeta,
} from '@/lib/api/models/adminReport';

/** Status enum BE chấp nhận trên query `status` (Swagger GET /v1/admin/reports). */
export const ADMIN_REPORTS_BE_STATUSES = [
  'Submitted',
  'Verified',
  'InProgress',
  'Resolved',
  'Reopened',
  'Closed',
  'Rejected',
  'Duplicate',
] as const;

export type AdminReportBeStatus = (typeof ADMIN_REPORTS_BE_STATUSES)[number];

export function isBeFilterableAdminReportStatus(status: string): boolean {
  return (ADMIN_REPORTS_BE_STATUSES as readonly string[]).includes(status);
}

export function adminReportSearchHaystack(item: AdminReportListItem): string {
  return [
    item.code,
    item.categoryName,
    item.categoryCode,
    item.address,
    item.wardCode,
    item.provinceCode,
    item.reporterCount > 0 ? `người gửi ${item.reporterCount}` : '',
    item.isAnonymous ? 'ẩn danh' : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function filterAdminReportItems(
  items: AdminReportListItem[],
  params: Pick<
    AdminReportsListParams,
    'search' | 'status' | 'categoryCode' | 'wardCode' | 'provinceCode'
  >
): AdminReportListItem[] {
  let result = items;

  const search = params.search?.trim().toLowerCase();
  if (search) {
    result = result.filter(item => adminReportSearchHaystack(item).includes(search));
  }

  const status = params.status?.trim();
  if (status) {
    result = result.filter(item => item.status === status);
  }

  const categoryCode = params.categoryCode?.trim();
  if (categoryCode) {
    result = result.filter(item => item.categoryCode === categoryCode);
  }

  const wardCode = params.wardCode?.trim().toLowerCase();
  if (wardCode) {
    result = result.filter(item => item.wardCode?.toLowerCase().includes(wardCode));
  }

  const provinceCode = params.provinceCode?.trim().toLowerCase();
  if (provinceCode) {
    result = result.filter(item => item.provinceCode?.toLowerCase().includes(provinceCode));
  }

  return result;
}

export function paginateAdminReportItems(
  items: AdminReportListItem[],
  page: number,
  pageSize: number
): { items: AdminReportListItem[]; pagination: PaginationMeta } {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

/** Có bất kỳ bộ lọc nào — dùng lô client-side thay vì gửi filter lên BE (BE hay trả rỗng). */
export function hasAdminReportListFilters(params?: AdminReportsListParams): boolean {
  if (!params) return false;
  return Boolean(
    params.search?.trim() ||
    params.status?.trim() ||
    params.categoryCode?.trim() ||
    params.wardCode?.trim() ||
    params.provinceCode?.trim()
  );
}

/** @deprecated Dùng `hasAdminReportListFilters`. */
export function needsClientSideAdminReportFilter(params?: AdminReportsListParams): boolean {
  return hasAdminReportListFilters(params);
}
