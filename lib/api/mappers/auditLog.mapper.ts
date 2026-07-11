import type {
  AuditLogDetailDto,
  AuditLogDto,
  AuditLogPaginationDto,
  AuditLogsListDataDto,
} from '@/lib/api/dto/auditLog.dto';
import type {
  AuditJsonValue,
  AuditLogDetail,
  AuditLogListItem,
  AuditLogPagination,
  AuditLogsList,
} from '@/lib/api/models/auditLog';

export function safeParseJson(value?: string | null): AuditJsonValue | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as AuditJsonValue;
  } catch {
    return value;
  }
}

function normalizeText(value?: string | null): string | null {
  return value?.trim() ? value.trim() : null;
}

export function mapAuditLogDto(dto: AuditLogDto): AuditLogListItem {
  return {
    id: dto.id ?? '',
    actorId: normalizeText(dto.actorId),
    actorEmail: normalizeText(dto.actorEmail),
    actorName: normalizeText(dto.actorName),
    entityType: dto.entityType ?? '',
    entityId: normalizeText(dto.entityId),
    action: dto.action ?? '',
    ipAddress: normalizeText(dto.ipAddress ?? dto.ip),
    userAgent: normalizeText(dto.userAgent),
    createdAt: dto.createdAt ?? dto.timestamp ?? '',
  };
}

export function mapAuditLogDetailDto(dto: AuditLogDetailDto): AuditLogDetail {
  const oldValuesRaw = dto.oldValues ?? null;
  const newValuesRaw = dto.newValues ?? null;

  return {
    ...mapAuditLogDto(dto),
    oldValuesRaw,
    newValuesRaw,
    oldValues: safeParseJson(oldValuesRaw),
    newValues: safeParseJson(newValuesRaw),
  };
}

export function mapAuditLogPaginationDto(dto?: AuditLogPaginationDto): AuditLogPagination {
  return {
    page: dto?.page ?? 1,
    pageSize: dto?.pageSize ?? 0,
    totalItems: dto?.totalItems ?? 0,
    totalPages: dto?.totalPages ?? 0,
    hasNext: dto?.hasNext ?? false,
    hasPrev: dto?.hasPrev ?? false,
  };
}

export function mapAuditLogsListDataDto(dto: AuditLogsListDataDto): AuditLogsList {
  return {
    items: (dto.items ?? []).map(mapAuditLogDto),
    pagination: mapAuditLogPaginationDto(dto.pagination),
  };
}
