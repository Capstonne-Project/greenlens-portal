/** GET /v1/reports/company-queue — [CompanyManager] list waiting for team assign. */

export type CompanyQueueSeverityDto = 'Low' | 'Medium' | 'High' | 'Critical' | string;

export interface CompanyQueueMediaDto {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: string;
  uploadedAt: string;
}

export interface CompanyQueueItemDto {
  reportId: string;
  code: string;
  address: string;
  wardCode: string;
  provinceCode?: string | null;
  latitude?: number;
  longitude?: number;
  categoryName: string;
  severity: CompanyQueueSeverityDto;
  dispatchedAt: string;
  verifiedAt?: string | null;
  verifiedByName?: string | null;
  slaResolveDueAt: string;
  media?: CompanyQueueMediaDto[];
}

export interface CompanyQueueListDto {
  items: CompanyQueueItemDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
