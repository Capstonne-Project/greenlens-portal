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
  actorId?: string;
  entityType?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AuditLogListItem {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
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
