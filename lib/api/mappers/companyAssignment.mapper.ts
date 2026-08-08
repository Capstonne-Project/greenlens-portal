import type {
  CompanyAssignmentDetailDto,
  CompanyAssignmentListItemDto,
  CompanyAssignmentMediaItemDto,
  CompanyAssignmentTeamDetailDto,
  CompanyAssignmentTimelineEntryDto,
  CompanyAssignmentWasteTagDto,
  CompanyAssignmentsListDto,
} from '@/lib/api/dto/companyAssignment.dto';
import type {
  CompanyAssignmentDetail,
  CompanyAssignmentListItem,
  CompanyAssignmentMedia,
  CompanyAssignmentMediaItem,
  CompanyAssignmentTeamDetail,
  CompanyAssignmentTimelineEntry,
  CompanyAssignmentWasteTag,
  CompanyAssignmentsList,
} from '@/lib/api/models/company';
import { normalizeReportStatus } from '@/lib/constants/reportStatus';
import { normalizeMediaUrl, pickAssignmentDetailMediaUrl } from '@/utils/reportThumbnail';

function isImageMediaType(type: unknown): boolean {
  if (typeof type !== 'string' || !type.trim()) return true;
  const normalized = type.trim().toLowerCase();
  return normalized.includes('image') || normalized.includes('photo');
}

function asOptionalUrl(value: unknown): string | null {
  return normalizeMediaUrl(value);
}

function readRecordValue(source: unknown, keys: string[]): unknown {
  if (!source || typeof source !== 'object') return undefined;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (record[pascal] !== undefined) return record[pascal];
  }
  return undefined;
}

function pickStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function mapReportImages(
  report: CompanyAssignmentListItemDto['report']
): CompanyAssignmentMediaItem[] {
  const images: CompanyAssignmentMediaItem[] = [];
  const seen = new Set<string>();

  const push = (url: unknown, uploadedAt?: string | null) => {
    const normalized = asOptionalUrl(url);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    images.push({
      url: normalized,
      uploadedAt: uploadedAt ?? new Date(0).toISOString(),
    });
  };

  for (const item of report.media ?? []) {
    const mediaType = item.type ?? item.mediaType;
    if (!isImageMediaType(mediaType)) continue;
    push(item.thumbnailUrl ?? item.url, item.uploadedAt);
    break;
  }

  for (const thumb of report.thumbnails ?? []) {
    push(thumb);
  }

  push(report.thumbnailUrl);
  push(report.coverImageUrl);
  push(report.imageUrl);

  return images;
}

function pickReportThumbnail(
  report: CompanyAssignmentListItemDto['report'],
  itemThumbnail?: string | null,
  reportImages: CompanyAssignmentMediaItem[] = []
): string | null {
  if (reportImages[0]?.url) return reportImages[0].url;

  const rawReport = report as unknown as Record<string, unknown>;
  const rawItemThumb = itemThumbnail ?? readRecordValue(report, ['thumbnailUrl', 'ThumbnailUrl']);

  const direct =
    asOptionalUrl(rawItemThumb) ??
    asOptionalUrl(readRecordValue(report, ['thumbnailUrl', 'ThumbnailUrl'])) ??
    asOptionalUrl(readRecordValue(report, ['coverImageUrl', 'CoverImageUrl'])) ??
    asOptionalUrl(readRecordValue(report, ['imageUrl', 'ImageUrl'])) ??
    asOptionalUrl(readRecordValue(report, ['reportImageUrl', 'ReportImageUrl'])) ??
    asOptionalUrl(readRecordValue(rawReport, ['thumbnailUrl', 'ThumbnailUrl']));

  if (direct) return direct;

  const thumbs = pickStringArray(
    readRecordValue(report, ['thumbnails', 'Thumbnails']) ??
      readRecordValue(rawReport, ['thumbnails', 'Thumbnails'])
  );
  for (const thumb of thumbs) {
    const url = asOptionalUrl(thumb);
    if (url) return url;
  }

  const media =
    readRecordValue(report, ['media', 'Media']) ?? readRecordValue(rawReport, ['media', 'Media']);
  if (Array.isArray(media)) {
    for (const item of media) {
      if (!item || typeof item !== 'object') continue;
      const url = asOptionalUrl(
        readRecordValue(item, ['url', 'Url', 'thumbnailUrl', 'ThumbnailUrl'])
      );
      if (url) return url;
    }
  }

  return null;
}

function mapAssignmentListItem(dto: CompanyAssignmentListItemDto): CompanyAssignmentListItem {
  const itemThumb =
    dto.thumbnailUrl ??
    (readRecordValue(dto, ['thumbnailUrl', 'ThumbnailUrl']) as string | null | undefined);

  const reportImages = mapReportImages(dto.report);
  const thumbnailUrl = pickReportThumbnail(dto.report, itemThumb, reportImages);

  return {
    assignmentId: dto.assignmentId,
    assignmentStatus: dto.assignmentStatus,
    assignedAt: dto.assignedAt,
    startedAt: dto.startedAt ?? null,
    completedAt: dto.completedAt ?? null,
    progressPercent: dto.progressPercent,
    progressNote: dto.progressNote ?? null,
    progressUpdatedAt: dto.progressUpdatedAt ?? null,
    note: dto.note ?? null,
    assignedByName: dto.assignedByName,
    report: {
      reportId: dto.report.reportId,
      code: dto.report.code,
      address: dto.report.address,
      wardCode: dto.report.wardCode,
      categoryName: dto.report.categoryName,
      severity: dto.report.severity,
      status: dto.report.status,
      slaResolveDueAt: dto.report.slaResolveDueAt,
      thumbnailUrl,
      reportImages,
    },
    team: {
      teamId: dto.team.teamId,
      teamName: dto.team.teamName,
      memberCount: dto.team.memberCount,
    },
  };
}

export function mapCompanyAssignmentsListDto(
  dto: CompanyAssignmentsListDto
): CompanyAssignmentsList {
  return {
    items: (dto.items ?? []).map(mapAssignmentListItem),
    pagination: dto.pagination,
  };
}

export function assignmentListMissingThumbnailIds(items: CompanyAssignmentListItem[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (!item.report.thumbnailUrl?.trim() && (item.report.reportImages?.length ?? 0) === 0) {
      ids.push(item.report.reportId);
    }
  }
  return ids;
}

function mapMediaItem(dto: CompanyAssignmentMediaItemDto): CompanyAssignmentMediaItem | null {
  const url = asOptionalUrl(dto.url);
  if (!url) return null;
  return {
    url,
    uploadedAt: dto.uploadedAt,
  };
}

function mapMedia(
  dto: CompanyAssignmentDetailDto['media'] | null | undefined
): CompanyAssignmentMedia {
  return {
    beforeImages: (dto?.beforeImages ?? [])
      .map(mapMediaItem)
      .filter((item): item is CompanyAssignmentMediaItem => item !== null),
    progressImages: (dto?.progressImages ?? [])
      .map(mapMediaItem)
      .filter((item): item is CompanyAssignmentMediaItem => item !== null),
    afterImages: (dto?.afterImages ?? [])
      .map(mapMediaItem)
      .filter((item): item is CompanyAssignmentMediaItem => item !== null),
  };
}

function mapTeamDetail(dto: CompanyAssignmentTeamDetailDto): CompanyAssignmentTeamDetail {
  return {
    assignmentId: dto.assignmentId,
    status: dto.status,
    assignedAt: dto.assignedAt,
    startedAt: dto.startedAt ?? null,
    completedAt: dto.completedAt ?? null,
    note: dto.note ?? null,
    declineReason: dto.declineReason ?? null,
    progressPercent: dto.progressPercent,
    progressNote: dto.progressNote ?? null,
    progressUpdatedAt: dto.progressUpdatedAt ?? null,
    progressUpdatedByName: dto.progressUpdatedByName ?? null,
    teamId: dto.teamId,
    teamName: dto.teamName,
    members: (dto.members ?? []).map(m => ({
      userId: m.userId,
      fullName: m.fullName,
      isLeader: m.isLeader,
    })),
    assignedByName: dto.assignedByName,
  };
}

function mapTimelineEntry(dto: CompanyAssignmentTimelineEntryDto): CompanyAssignmentTimelineEntry {
  return {
    timestamp: dto.timestamp,
    fromStatus: dto.fromStatus ?? null,
    toStatus: dto.toStatus,
    changedByName: dto.changedByName ?? null,
    reason: dto.reason ?? null,
  };
}

function mapWasteTag(dto: CompanyAssignmentWasteTagDto): CompanyAssignmentWasteTag {
  return {
    tagId: dto.tagId,
    code: dto.code,
    nameVi: dto.nameVi,
    iconUrl: dto.iconUrl ?? null,
  };
}

function mapCitizenImages(dto: CompanyAssignmentDetailDto): CompanyAssignmentMediaItem[] {
  const images: CompanyAssignmentMediaItem[] = [];
  const seen = new Set<string>();

  const push = (url: unknown, uploadedAt?: string | null) => {
    const normalized = asOptionalUrl(url);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    images.push({
      url: normalized,
      uploadedAt: uploadedAt ?? new Date(0).toISOString(),
    });
  };

  for (const group of [dto.images, dto.reportImages, dto.reportMedia]) {
    for (const item of group ?? []) {
      push(item.url, item.uploadedAt);
    }
  }

  const raw = dto as unknown as Record<string, unknown>;
  const flatMedia = readRecordValue(raw, ['media', 'Media']);
  if (Array.isArray(flatMedia)) {
    for (const item of flatMedia) {
      if (!item || typeof item !== 'object') continue;
      push(
        readRecordValue(item, ['url', 'Url']),
        readRecordValue(item, ['uploadedAt', 'UploadedAt']) as string
      );
    }
  }

  return images;
}

export function mapCompanyAssignmentDetailDto(
  dto: CompanyAssignmentDetailDto
): CompanyAssignmentDetail {
  const reportImages = mapCitizenImages(dto);

  return {
    reportId: dto.reportId,
    code: dto.code,
    status: normalizeReportStatus(dto.status),
    severity: dto.severity,
    categoryName: dto.categoryName,
    description: dto.description,
    address: dto.address,
    wardCode: dto.wardCode ?? null,
    latitude: dto.latitude,
    longitude: dto.longitude,
    createdAt: dto.createdAt,
    dispatchedToCompanyAt: dto.dispatchedToCompanyAt ?? null,
    resolvedAt: dto.resolvedAt ?? null,
    closedAt: dto.closedAt ?? null,
    reopenedCount: dto.reopenedCount,
    sla: {
      resolveDueAt: dto.sla.resolveDueAt,
      hoursRemaining: dto.sla.hoursRemaining,
      isBreached: dto.sla.isBreached,
      severityLabel: dto.sla.severityLabel,
    },
    summary: {
      totalTeams: dto.summary.totalTeams,
      acceptedTeams: dto.summary.acceptedTeams,
      completedTeams: dto.summary.completedTeams,
      declinedTeams: dto.summary.declinedTeams,
      pendingTeams: dto.summary.pendingTeams,
      overallProgressPercent: dto.summary.overallProgressPercent,
      startedAt: dto.summary.startedAt ?? null,
    },
    media: mapMedia(dto.media),
    reportImages,
    teamAssignments: (dto.teamAssignments ?? []).map(mapTeamDetail),
    timeline: (dto.timeline ?? []).map(mapTimelineEntry),
    wasteTags: (dto.wasteTags ?? []).map(mapWasteTag),
  };
}

/** Lấy thumbnail đầu tiên từ media detail (before → progress → after). */
export function pickAssignmentDetailThumbnail(detail: CompanyAssignmentDetail): string | null {
  return pickAssignmentDetailMediaUrl(detail);
}
