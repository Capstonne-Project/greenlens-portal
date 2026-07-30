/** FE models — nhật ký kiểm toán hệ thống (admin). */

export type AuditJsonValue = string | number | boolean | null | AuditJsonObject | AuditJsonValue[];

export interface AuditJsonObject {
  [key: string]: AuditJsonValue;
}

export interface AuditLogPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AuditLogsListParams {
  page?: number;
  pageSize?: number;
  /** Actor (admin/officer) — query param BE: `userId`. */
  userId?: string;
  actorRole?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AuditLogsExportParams {
  fromDate: string;
  toDate: string;
  userId?: string;
  actorRole?: string;
  entityType?: string;
  action?: string;
}

export interface AuditLogsStatsParams {
  fromDate: string;
  toDate: string;
}

export interface AuditLogActionCount {
  action: string;
  count: number;
}

export interface AuditLogDayCount {
  date: string;
  count: number;
}

export interface AuditLogsStats {
  totalCount: number;
  byAction: AuditLogActionCount[];
  byDay: AuditLogDayCount[];
}

export interface AuditLogListItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  actorRole: string | null;
  /** Tên hiển thị nếu BE trả (legacy). */
  actorName: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogDetail extends AuditLogListItem {
  /** Raw JSON string from BE. */
  oldValuesRaw: string | null;
  newValuesRaw: string | null;
  /** Parsed via safeParseJson. */
  oldValues: AuditJsonValue | null;
  newValues: AuditJsonValue | null;
}

export interface AuditLogsList {
  items: AuditLogListItem[];
  pagination: AuditLogPagination;
}
