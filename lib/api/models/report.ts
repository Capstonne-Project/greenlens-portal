import type { ReportSeverity } from '@/lib/api/models/adminReport';
import type { ReportStatus } from '@/lib/constants/reportStatus';

export type { ReportSeverity } from '@/lib/api/models/adminReport';
export type { ReportStatus } from '@/lib/constants/reportStatus';

export type SeveritySetBy = 'User' | 'AI' | 'Officer';
export type MediaType = 'Image' | 'Video';

export interface ReportMedia {
  id: string;
  mediaType: MediaType;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/** Record gán đội xử lý cho một báo cáo — audit trail.
 *  Khớp response của POST /v1/reports/{id}/assign. */
export interface ReportAssignment {
  id: string;
  teamId: string;
  teamName: string;
  note: string | null;
  assignedAt: string;
  assignedByUserId: string;
  assignedByName: string | null;
}

export interface ReportQueueItem {
  id: string;
  code: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverity;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  priorityScore: number;
  createdAt: string;
  slaVerifyDueAt: string;
}

export interface ReportQueueParams {
  page: number;
  pageSize: number;
}

export interface ReportQueueData {
  items: ReportQueueItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ReportDetail {
  id: string;
  code: string;
  isAnonymous: boolean;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverity;
  severitySetBy: SeveritySetBy;
  status: ReportStatus;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  provinceCode: string;
  priorityScore: number;
  reporterCount: number;
  reopenedCount: number;
  assignedOfficeId: string | null;
  media: ReportMedia[];
  assignments: ReportAssignment[];
  createdAt: string;
  slaVerifyDueAt: string;
}
