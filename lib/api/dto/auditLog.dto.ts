/** DTO khớp Swagger BE — nhật ký kiểm toán hệ thống (admin). */

export interface AuditLogDto {
  id?: string;
  userId?: string | null;
  userEmail?: string | null;
  actorRole?: string | null;
  /** Legacy aliases */
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  entityType?: string;
  entityId?: string | null;
  action?: string;
  ipAddress?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt?: string;
  timestamp?: string;
  oldValues?: string | null;
  newValues?: string | null;
}

export interface AuditLogPaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AuditLogsListDataDto {
  items?: AuditLogDto[];
  pagination?: AuditLogPaginationDto;
}

export interface AuditLogsListParamsDto {
  page?: number;
  pageSize?: number;
  userId?: string;
  actorRole?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AuditLogsExportParamsDto {
  fromDate: string;
  toDate: string;
  userId?: string;
  actorRole?: string;
  entityType?: string;
  action?: string;
}

export interface AuditLogsStatsParamsDto {
  fromDate: string;
  toDate: string;
}

export interface AuditLogActionCountDto {
  action: string;
  count: number;
}

export interface AuditLogDayCountDto {
  date: string;
  count: number;
}

export interface AuditLogsStatsDataDto {
  totalCount?: number;
  byAction?: AuditLogActionCountDto[];
  byDay?: AuditLogDayCountDto[];
}

export type AuditLogDetailDto = AuditLogDto;
