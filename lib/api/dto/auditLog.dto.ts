/** DTO khớp Swagger BE — nhật ký kiểm toán hệ thống (admin). */

export interface AuditLogDto {
  id?: string;
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
  actorId?: string;
  entityType?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export type AuditLogDetailDto = AuditLogDto;
