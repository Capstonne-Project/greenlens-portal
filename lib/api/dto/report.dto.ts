import type { ReportStatus } from '@/lib/constants/reportStatus';

export type ReportStatusDto = ReportStatus;

export type ReportSeverityDto = 'Low' | 'Medium' | 'High' | 'Critical';
export type SeveritySetByDto = 'User' | 'AI' | 'Officer';
export type MediaTypeDto = 'Image' | 'Video';

export interface ReportMediaDto {
  id: string;
  mediaType: MediaTypeDto;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/** Một record gán đội cho báo cáo — audit trail từ BE.
 *  Shape khớp response của POST /v1/reports/{id}/assign. */
export interface ReportAssignmentDto {
  id: string;
  teamId: string;
  teamName: string;
  note: string | null;
  assignedAt: string;
  assignedByUserId: string;
  assignedByName: string | null;
}

export interface ReportQueueItemDto {
  id: string;
  code: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverityDto;
  status: ReportStatusDto;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  priorityScore: number;
  createdAt: string;
  slaVerifyDueAt: string;
}

export interface ReportQueueDataDto {
  items: ReportQueueItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ReportQueueResponseDto {
  code: string;
  message: string;
  status: number;
  data: ReportQueueDataDto;
}

export interface ReportDetailDto {
  id: string;
  code: string;
  isAnonymous: boolean;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverityDto;
  severitySetBy: SeveritySetByDto;
  status: ReportStatusDto;
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
  media: ReportMediaDto[];
  assignments: ReportAssignmentDto[];
  createdAt: string;
  slaVerifyDueAt: string;
}

export interface ReportDetailResponseDto {
  code: string;
  message: string;
  status: number;
  data: ReportDetailDto;
}
