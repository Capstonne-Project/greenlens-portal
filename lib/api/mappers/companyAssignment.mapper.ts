import type {
  CompanyAssignmentCitizenMediaDto,
  CompanyAssignmentDetailAssignmentDto,
  CompanyAssignmentDetailDto,
  CompanyAssignmentDispatchSourceDto,
  CompanyAssignmentHistoryEntryDto,
  CompanyAssignmentListItemDto,
  CompanyAssignmentMediaItemDto,
  CompanyAssignmentProgressUpdateDto,
  CompanyAssignmentTeamDetailDto,
  CompanyAssignmentTeamWasteTagDto,
  CompanyAssignmentTimelineEntryDto,
  CompanyAssignmentWasteTagDto,
  CompanyAssignmentsListDto,
} from '@/lib/api/dto/companyAssignment.dto';
import type {
  CompanyAssignmentCitizenMedia,
  CompanyAssignmentDetail,
  CompanyAssignmentDispatchSource,
  CompanyAssignmentFirstMedia,
  CompanyAssignmentHistoryEntry,
  CompanyAssignmentListItem,
  CompanyAssignmentMedia,
  CompanyAssignmentMediaItem,
  CompanyAssignmentProgressUpdate,
  CompanyAssignmentTeamDetail,
  CompanyAssignmentTeamMember,
  CompanyAssignmentTeamWasteTag,
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

function mapDispatchSource(
  dto: CompanyAssignmentDispatchSourceDto | null | undefined
): CompanyAssignmentDispatchSource | null {
  if (!dto || typeof dto !== 'object') return null;
  const localOfficeId = typeof dto.localOfficeId === 'string' ? dto.localOfficeId.trim() : '';
  const leoUserId = typeof dto.leoUserId === 'string' ? dto.leoUserId.trim() : '';
  if (!localOfficeId && !leoUserId && !dto.localOfficeName?.trim() && !dto.leoFullName?.trim()) {
    return null;
  }
  return {
    localOfficeId,
    localOfficeName: dto.localOfficeName?.trim() ?? '',
    wardCode: dto.wardCode?.trim() ?? '',
    wardName: dto.wardName?.trim() ?? '',
    leoUserId,
    leoFullName: dto.leoFullName?.trim() ?? '',
  };
}

function mapTeamWasteTag(
  dto: CompanyAssignmentTeamWasteTagDto | CompanyAssignmentWasteTagDto | null | undefined
): CompanyAssignmentTeamWasteTag | null {
  if (!dto || typeof dto !== 'object') return null;
  if (!dto.tagId?.trim() && !dto.code?.trim()) return null;
  return {
    tagId: dto.tagId ?? '',
    code: dto.code ?? '',
    nameVi: dto.nameVi ?? '',
    nameEn: dto.nameEn?.trim() || null,
    iconUrl: dto.iconUrl ?? null,
  };
}

function mapFirstMedia(
  report: CompanyAssignmentListItemDto['report']
): CompanyAssignmentFirstMedia | null {
  const firstMedia =
    report.firstMedia ??
    (readRecordValue(report, ['firstMedia', 'FirstMedia']) as
      | CompanyAssignmentListItemDto['report']['firstMedia']
      | undefined);

  if (!firstMedia || typeof firstMedia !== 'object') return null;

  const url = asOptionalUrl(firstMedia.url);
  if (!url) return null;

  const id =
    typeof firstMedia.id === 'string' && firstMedia.id.trim()
      ? firstMedia.id
      : `first-media-${url}`;

  return {
    id,
    url,
    thumbnailUrl: asOptionalUrl(firstMedia.thumbnailUrl),
    type: typeof firstMedia.type === 'string' && firstMedia.type.trim() ? firstMedia.type : 'Image',
    uploadedAt: firstMedia.uploadedAt ?? new Date(0).toISOString(),
  };
}

function mapReportImages(
  report: CompanyAssignmentListItemDto['report'],
  firstMedia: CompanyAssignmentFirstMedia | null
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

  // Canonical Swagger: report.firstMedia (thumbnailUrl then url)
  if (firstMedia && isImageMediaType(firstMedia.type)) {
    push(firstMedia.thumbnailUrl ?? firstMedia.url, firstMedia.uploadedAt);
  }

  // Legacy fallbacks
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
  firstMedia: CompanyAssignmentFirstMedia | null,
  itemThumbnail?: string | null,
  reportImages: CompanyAssignmentMediaItem[] = []
): string | null {
  // Prefer firstMedia thumbnailUrl → url
  if (firstMedia && isImageMediaType(firstMedia.type)) {
    const fromFirst = asOptionalUrl(firstMedia.thumbnailUrl) ?? asOptionalUrl(firstMedia.url);
    if (fromFirst) return fromFirst;
  }

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
      const url =
        asOptionalUrl(readRecordValue(item, ['thumbnailUrl', 'ThumbnailUrl'])) ??
        asOptionalUrl(readRecordValue(item, ['url', 'Url']));
      if (url) return url;
    }
  }

  return null;
}

function mapTeamMembers(
  members: CompanyAssignmentListItemDto['team']['members']
): CompanyAssignmentTeamMember[] {
  return (members ?? [])
    .filter((m): m is NonNullable<typeof m> => Boolean(m && typeof m === 'object'))
    .map(m => ({
      userId: m.userId,
      fullName: m.fullName,
      avatarUrl: asOptionalUrl(m.avatarUrl),
      isLeader: Boolean(m.isLeader),
    }));
}

function mapAssignmentListItem(dto: CompanyAssignmentListItemDto): CompanyAssignmentListItem {
  const itemThumb =
    dto.thumbnailUrl ??
    (readRecordValue(dto, ['thumbnailUrl', 'ThumbnailUrl']) as string | null | undefined);

  const firstMedia = mapFirstMedia(dto.report);
  const reportImages = mapReportImages(dto.report, firstMedia);
  const thumbnailUrl = pickReportThumbnail(dto.report, firstMedia, itemThumb, reportImages);
  const members = mapTeamMembers(dto.team.members);

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
      dispatchSource: mapDispatchSource(dto.report.dispatchSource),
      firstMedia,
      thumbnailUrl,
      reportImages,
    },
    team: {
      teamId: dto.team.teamId,
      teamName: dto.team.teamName,
      memberCount: dto.team.memberCount ?? members.length,
      wasteTags: (dto.team.wasteTags ?? [])
        .map(mapTeamWasteTag)
        .filter((item): item is CompanyAssignmentTeamWasteTag => item !== null),
      members,
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

function mapMediaItem(
  dto: CompanyAssignmentMediaItemDto | null | undefined
): CompanyAssignmentMediaItem | null {
  if (!dto || typeof dto !== 'object') return null;
  const url = asOptionalUrl(dto.url) ?? asOptionalUrl(dto.thumbnailUrl);
  if (!url) return null;
  return {
    id: typeof dto.id === 'string' && dto.id.trim() ? dto.id : undefined,
    url,
    thumbnailUrl: asOptionalUrl(dto.thumbnailUrl),
    mediaType: dto.mediaType ?? null,
    mimeType: dto.mimeType ?? null,
    sizeBytes: typeof dto.sizeBytes === 'number' ? dto.sizeBytes : null,
    uploadedAt: dto.uploadedAt ?? new Date(0).toISOString(),
  };
}

function mapMediaBuckets(
  dto: CompanyAssignmentDetailDto['media'] | null | undefined,
  progressImages: CompanyAssignmentMediaItem[]
): CompanyAssignmentMedia {
  return {
    beforeImages: (dto?.beforeImages ?? [])
      .map(mapMediaItem)
      .filter((item): item is CompanyAssignmentMediaItem => item !== null),
    progressImages,
    afterImages: (dto?.afterImages ?? [])
      .map(mapMediaItem)
      .filter((item): item is CompanyAssignmentMediaItem => item !== null),
  };
}

function mapSla(
  dto: CompanyAssignmentDetailDto['sla'] | null | undefined
): CompanyAssignmentDetail['sla'] {
  return {
    resolveDueAt: dto?.resolveDueAt ?? '',
    hoursRemaining: dto?.hoursRemaining ?? 0,
    isBreached: Boolean(dto?.isBreached),
    severityLabel: dto?.severityLabel ?? '',
  };
}

function mapProgressUpdate(
  dto: CompanyAssignmentProgressUpdateDto | null | undefined
): CompanyAssignmentProgressUpdate | null {
  if (!dto || typeof dto !== 'object') return null;
  const id = typeof dto.id === 'string' && dto.id.trim() ? dto.id : '';
  return {
    id,
    progressPercent: dto.progressPercent ?? 0,
    progressNote: dto.progressNote ?? null,
    updatedAt: dto.updatedAt ?? '',
    updatedByUserId: dto.updatedByUserId ?? '',
    updatedByName: dto.updatedByName ?? '',
    images: (dto.images ?? [])
      .map(mapMediaItem)
      .filter((item): item is CompanyAssignmentMediaItem => item !== null),
  };
}

function mapAssignmentDetail(
  dto: CompanyAssignmentDetailAssignmentDto | CompanyAssignmentTeamDetailDto | null | undefined
): CompanyAssignmentTeamDetail | null {
  if (!dto || typeof dto !== 'object') return null;
  if (!dto.assignmentId && !dto.teamId) return null;

  return {
    assignmentId: dto.assignmentId ?? '',
    status: dto.status ?? '',
    assignedAt: dto.assignedAt ?? '',
    acceptedAt: dto.acceptedAt ?? null,
    startedAt: dto.startedAt ?? null,
    completedAt: dto.completedAt ?? null,
    note: dto.note ?? null,
    declineReason: dto.declineReason ?? null,
    checkedInAt: dto.checkedInAt ?? null,
    checkedInLatitude: dto.checkedInLatitude ?? null,
    checkedInLongitude: dto.checkedInLongitude ?? null,
    checkedInNote: dto.checkedInNote ?? null,
    progressPercent: dto.progressPercent ?? 0,
    progressNote: dto.progressNote ?? null,
    progressUpdatedAt: dto.progressUpdatedAt ?? null,
    progressUpdatedByName: dto.progressUpdatedByName ?? null,
    teamId: dto.teamId ?? '',
    teamName: dto.teamName ?? '',
    teamLeaderName: dto.teamLeaderName?.trim() || null,
    members: (dto.members ?? [])
      .filter((m): m is NonNullable<typeof m> => Boolean(m && typeof m === 'object'))
      .map(m => ({
        userId: m.userId ?? '',
        fullName: m.fullName ?? '',
        avatarUrl: asOptionalUrl(m.avatarUrl),
        isLeader: Boolean(m.isLeader),
        joinedAt: m.joinedAt ?? null,
      })),
    assignedByName: dto.assignedByName ?? '',
    teamWasteTags: (dto.teamWasteTags ?? [])
      .map(mapTeamWasteTag)
      .filter((item): item is CompanyAssignmentTeamWasteTag => item !== null),
    progressUpdates: (dto.progressUpdates ?? [])
      .map(mapProgressUpdate)
      .filter((item): item is CompanyAssignmentProgressUpdate => item !== null),
  };
}

function mapAssignmentHistoryEntry(
  dto: CompanyAssignmentHistoryEntryDto | null | undefined
): CompanyAssignmentHistoryEntry | null {
  if (!dto || typeof dto !== 'object') return null;
  return {
    assignmentId: dto.assignmentId ?? '',
    teamId: dto.teamId ?? '',
    teamName: dto.teamName ?? '',
    status: dto.status ?? '',
    assignedAt: dto.assignedAt ?? '',
    acceptedAt: dto.acceptedAt ?? null,
    completedAt: dto.completedAt ?? null,
    declineReason: dto.declineReason ?? null,
    note: dto.note ?? null,
    teamWasteTags: (dto.teamWasteTags ?? [])
      .map(mapTeamWasteTag)
      .filter((item): item is CompanyAssignmentTeamWasteTag => item !== null),
  };
}

function deriveSummaryFromAssignment(
  assignment: CompanyAssignmentTeamDetail | null
): CompanyAssignmentDetail['summary'] {
  if (!assignment) {
    return {
      totalTeams: 0,
      acceptedTeams: 0,
      completedTeams: 0,
      declinedTeams: 0,
      pendingTeams: 0,
      overallProgressPercent: 0,
      startedAt: null,
    };
  }

  const status = (assignment.status ?? '').trim();
  const isDeclined = status === 'Declined';
  const hasAccepted =
    Boolean(assignment.acceptedAt?.trim()) || status === 'InProgress' || status === 'Completed';

  return {
    totalTeams: 1,
    acceptedTeams: !isDeclined && (hasAccepted || status === 'Assigned') ? 1 : 0,
    completedTeams: status === 'Completed' ? 1 : 0,
    declinedTeams: isDeclined ? 1 : 0,
    pendingTeams: status === 'Assigned' && !assignment.acceptedAt ? 1 : 0,
    overallProgressPercent: assignment.progressPercent ?? 0,
    startedAt: assignment.startedAt ?? null,
  };
}

function mapSummary(
  dto: CompanyAssignmentDetailDto['summary'] | null | undefined,
  assignment: CompanyAssignmentTeamDetail | null
): CompanyAssignmentDetail['summary'] {
  if (dto && typeof dto === 'object') {
    return {
      totalTeams: dto.totalTeams ?? 0,
      acceptedTeams: dto.acceptedTeams ?? 0,
      completedTeams: dto.completedTeams ?? 0,
      declinedTeams: dto.declinedTeams ?? 0,
      pendingTeams: dto.pendingTeams ?? 0,
      overallProgressPercent: dto.overallProgressPercent ?? 0,
      startedAt: dto.startedAt ?? null,
    };
  }
  return deriveSummaryFromAssignment(assignment);
}

function mapTimelineEntry(
  dto: CompanyAssignmentTimelineEntryDto | null | undefined
): CompanyAssignmentTimelineEntry | null {
  if (!dto || typeof dto !== 'object') return null;
  return {
    timestamp: dto.timestamp,
    fromStatus: dto.fromStatus ?? null,
    toStatus: dto.toStatus,
    changedByName: dto.changedByName ?? null,
    reason: dto.reason ?? null,
  };
}

function mapWasteTag(
  dto: CompanyAssignmentWasteTagDto | null | undefined
): CompanyAssignmentWasteTag | null {
  if (!dto || typeof dto !== 'object') return null;
  return {
    tagId: dto.tagId,
    code: dto.code,
    nameVi: dto.nameVi,
    nameEn: dto.nameEn?.trim() || null,
    iconUrl: dto.iconUrl ?? null,
  };
}

function mapCitizenMediaItem(
  dto: CompanyAssignmentCitizenMediaDto | null | undefined
): CompanyAssignmentCitizenMedia | null {
  if (!dto || typeof dto !== 'object') return null;
  const url = asOptionalUrl(dto.url);
  if (!url) return null;
  const id = typeof dto.id === 'string' && dto.id.trim() ? dto.id : `citizen-media-${url}`;
  return {
    id,
    url,
    thumbnailUrl: asOptionalUrl(dto.thumbnailUrl),
    type: typeof dto.type === 'string' && dto.type.trim() ? dto.type : 'Image',
    uploadedAt: dto.uploadedAt ?? new Date(0).toISOString(),
  };
}

/** Prefer citizenMedia; fallback legacy images / reportImages / reportMedia / flat media[]. */
function mapCitizenMedia(dto: CompanyAssignmentDetailDto): CompanyAssignmentCitizenMedia[] {
  const fromWire = (dto.citizenMedia ?? [])
    .map(mapCitizenMediaItem)
    .filter((item): item is CompanyAssignmentCitizenMedia => item !== null);

  if (fromWire.length > 0) return fromWire;

  const images: CompanyAssignmentCitizenMedia[] = [];
  const seen = new Set<string>();

  const pushLegacy = (
    url: unknown,
    uploadedAt?: string | null,
    thumbnailUrl?: string | null,
    type?: string,
    id?: string
  ) => {
    const normalized = asOptionalUrl(url);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    images.push({
      id: id && id.trim() ? id : `legacy-media-${normalized}`,
      url: normalized,
      thumbnailUrl: asOptionalUrl(thumbnailUrl),
      type: type && type.trim() ? type : 'Image',
      uploadedAt: uploadedAt ?? new Date(0).toISOString(),
    });
  };

  for (const group of [dto.images, dto.reportImages, dto.reportMedia]) {
    for (const item of group ?? []) {
      if (!item || typeof item !== 'object') continue;
      pushLegacy(item.url, item.uploadedAt);
    }
  }

  const raw = dto as unknown as Record<string, unknown>;
  const flatMedia = readRecordValue(raw, ['media', 'Media']);
  // Nested media buckets ({ beforeImages, … }) must not be treated as flat URL list.
  if (Array.isArray(flatMedia)) {
    for (const item of flatMedia) {
      if (!item || typeof item !== 'object') continue;
      pushLegacy(
        readRecordValue(item, ['url', 'Url']),
        readRecordValue(item, ['uploadedAt', 'UploadedAt']) as string,
        readRecordValue(item, ['thumbnailUrl', 'ThumbnailUrl']) as string,
        readRecordValue(item, ['type', 'Type']) as string,
        readRecordValue(item, ['id', 'Id']) as string
      );
    }
  }

  return images;
}

/** Derived gallery urls from citizenMedia (images use thumbnailUrl ?? url). */
function mapReportImagesFromCitizenMedia(
  citizenMedia: CompanyAssignmentCitizenMedia[]
): CompanyAssignmentMediaItem[] {
  const images: CompanyAssignmentMediaItem[] = [];
  const seen = new Set<string>();

  for (const item of citizenMedia) {
    if (!isImageMediaType(item.type)) continue;
    const preferred = asOptionalUrl(item.thumbnailUrl) ?? asOptionalUrl(item.url);
    if (!preferred || seen.has(preferred)) continue;
    seen.add(preferred);
    images.push({
      url: preferred,
      uploadedAt: item.uploadedAt ?? new Date(0).toISOString(),
    });
  }

  return images;
}

function mapProgressImages(
  assignment: CompanyAssignmentTeamDetail | null,
  legacyMedia: CompanyAssignmentDetailDto['media'] | null | undefined
): CompanyAssignmentMediaItem[] {
  const fromUpdates: CompanyAssignmentMediaItem[] = [];
  const seen = new Set<string>();

  const push = (item: CompanyAssignmentMediaItem) => {
    if (seen.has(item.url)) return;
    seen.add(item.url);
    fromUpdates.push(item);
  };

  for (const update of assignment?.progressUpdates ?? []) {
    for (const img of update.images) {
      push(img);
    }
  }

  if (fromUpdates.length > 0) return fromUpdates;

  return (legacyMedia?.progressImages ?? [])
    .map(mapMediaItem)
    .filter((item): item is CompanyAssignmentMediaItem => item !== null);
}

export function mapCompanyAssignmentDetailDto(
  dto: CompanyAssignmentDetailDto
): CompanyAssignmentDetail {
  const citizenMedia = mapCitizenMedia(dto);
  const reportImages = mapReportImagesFromCitizenMedia(citizenMedia);

  const assignment = mapAssignmentDetail(dto.assignment);
  const teamAssignments = assignment
    ? [assignment]
    : (dto.teamAssignments ?? [])
        .map(mapAssignmentDetail)
        .filter((item): item is CompanyAssignmentTeamDetail => item !== null);

  // Progress/summary derive from singular wire assignment, else first legacy team.
  const progressSource = assignment ?? teamAssignments[0] ?? null;
  const progressImages = mapProgressImages(progressSource, dto.media);

  return {
    reportId: dto.reportId,
    code: dto.code ?? '',
    status: normalizeReportStatus(dto.status),
    severity: dto.severity,
    categoryName: dto.categoryName ?? '',
    description: dto.description ?? '',
    address: dto.address ?? '',
    wardCode: dto.wardCode ?? null,
    provinceCode: dto.provinceCode ?? null,
    latitude: dto.latitude ?? 0,
    longitude: dto.longitude ?? 0,
    createdAt: dto.createdAt ?? '',
    verifiedAt: dto.verifiedAt ?? null,
    verifiedByName: dto.verifiedByName ?? null,
    dispatchedToCompanyAt: dto.dispatchedToCompanyAt ?? null,
    dispatchSource: mapDispatchSource(dto.dispatchSource),
    resolvedAt: dto.resolvedAt ?? null,
    closedAt: dto.closedAt ?? null,
    reopenedCount: dto.reopenedCount ?? 0,
    priorityScore: dto.priorityScore ?? 0,
    sla: mapSla(dto.sla),
    citizenMedia,
    assignment,
    media: mapMediaBuckets(dto.media, progressImages),
    assignmentHistory: (dto.assignmentHistory ?? [])
      .map(mapAssignmentHistoryEntry)
      .filter((item): item is CompanyAssignmentHistoryEntry => item !== null),
    canReassign: Boolean(dto.canReassign),
    reportImages,
    teamAssignments,
    summary: mapSummary(dto.summary, progressSource),
    timeline: (dto.timeline ?? [])
      .map(mapTimelineEntry)
      .filter((item): item is CompanyAssignmentTimelineEntry => item !== null),
    wasteTags: (dto.wasteTags ?? [])
      .map(mapWasteTag)
      .filter((item): item is CompanyAssignmentWasteTag => item !== null),
  };
}

/** Lấy thumbnail đầu tiên từ media detail (before → progress → after). */
export function pickAssignmentDetailThumbnail(detail: CompanyAssignmentDetail): string | null {
  return pickAssignmentDetailMediaUrl(detail);
}
