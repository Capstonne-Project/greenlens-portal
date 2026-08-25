import type {
  ReportProgressAssignedCompanyDto,
  ReportProgressAssignmentDto,
  ReportProgressDataDto,
  ReportProgressImageDto,
  ReportProgressMediaDto,
  ReportProgressMemberDto,
  ReportProgressStatusHistoryDto,
  ReportProgressUpdateDto,
  ReportProgressWasteTagDto,
} from '@/lib/api/dto/reportProgress.dto';
import type {
  ReportProgress,
  ReportProgressAssignedCompany,
  ReportProgressAssignment,
  ReportProgressImage,
  ReportProgressMedia,
  ReportProgressMember,
  ReportProgressStatusHistory,
  ReportProgressUpdate,
  ReportProgressWasteTag,
} from '@/lib/api/models/reportProgress';

function mapProgressImageDto(dto: ReportProgressImageDto): ReportProgressImage {
  return {
    id: dto.id,
    mediaType: dto.mediaType ?? '',
    url: dto.url ?? '',
    thumbnailUrl: dto.thumbnailUrl ?? null,
    mimeType: dto.mimeType ?? '',
    sizeBytes: dto.sizeBytes ?? 0,
    uploadedAt: dto.uploadedAt ?? '',
  };
}

function mapProgressUpdateDto(dto: ReportProgressUpdateDto): ReportProgressUpdate {
  return {
    id: dto.id,
    progressPercent: dto.progressPercent ?? 0,
    progressNote: dto.progressNote ?? null,
    updatedAt: dto.updatedAt ?? '',
    updatedByUserId: dto.updatedByUserId ?? '',
    updatedByName: dto.updatedByName ?? '',
    images: (dto.images ?? []).map(mapProgressImageDto),
  };
}

function mapProgressMemberDto(dto: ReportProgressMemberDto): ReportProgressMember {
  return {
    userId: dto.userId,
    fullName: dto.fullName ?? '',
    email: dto.email ?? '',
    phoneNumber: dto.phoneNumber ?? null,
    avatarUrl: dto.avatarUrl ?? null,
    isLeader: Boolean(dto.isLeader),
    joinedAt: dto.joinedAt ?? '',
  };
}

function mapAssignedCompanyDto(
  dto: ReportProgressAssignedCompanyDto | null | undefined
): ReportProgressAssignedCompany | null {
  if (!dto?.companyId) return null;
  return {
    companyId: dto.companyId,
    companyName: dto.companyName ?? '',
    dispatchedAt: dto.dispatchedAt ?? '',
  };
}

function mapProgressWasteTagDto(dto: ReportProgressWasteTagDto): ReportProgressWasteTag {
  return {
    tagId: dto.tagId,
    code: dto.code,
    nameVi: dto.nameVi,
    nameEn: dto.nameEn ?? null,
    iconUrl: dto.iconUrl ?? null,
  };
}

function mapProgressAssignmentDto(
  dto: ReportProgressAssignmentDto | null | undefined
): ReportProgressAssignment | null {
  if (!dto?.assignmentId) return null;
  return {
    assignmentId: dto.assignmentId,
    teamId: dto.teamId ?? '',
    teamName: dto.teamName ?? '',
    teamType: dto.teamType ?? '',
    isCompanyTeam: Boolean(dto.isCompanyTeam),
    companyId: dto.companyId ?? null,
    companyName: dto.companyName ?? null,
    localOfficeId: dto.localOfficeId ?? null,
    localOfficeName: dto.localOfficeName ?? null,
    teamLeaderName: dto.teamLeaderName ?? '',
    assignedById: dto.assignedById ?? '',
    assignedByName: dto.assignedByName ?? '',
    status: dto.status ?? '',
    assignedAt: dto.assignedAt ?? '',
    acceptedAt: dto.acceptedAt ?? null,
    completedAt: dto.completedAt ?? null,
    declineReason: dto.declineReason ?? null,
    progressPercent: dto.progressPercent ?? 0,
    progressNote: dto.progressNote ?? null,
    progressUpdatedAt: dto.progressUpdatedAt ?? null,
    teamWasteTags: (dto.teamWasteTags ?? []).map(mapProgressWasteTagDto),
    members: (dto.members ?? []).map(mapProgressMemberDto),
    progressUpdates: (dto.progressUpdates ?? []).map(mapProgressUpdateDto),
  };
}

function mapProgressMediaDto(dto: ReportProgressMediaDto | null | undefined): ReportProgressMedia {
  return {
    submissionImages: (dto?.submissionImages ?? []).map(mapProgressImageDto),
    beforeImages: (dto?.beforeImages ?? []).map(mapProgressImageDto),
    afterImages: (dto?.afterImages ?? []).map(mapProgressImageDto),
    inspectionImages: (dto?.inspectionImages ?? []).map(mapProgressImageDto),
    reopenEvidenceImages: (dto?.reopenEvidenceImages ?? []).map(mapProgressImageDto),
  };
}

function mapStatusHistoryDto(dto: ReportProgressStatusHistoryDto): ReportProgressStatusHistory {
  return {
    fromStatus: dto.fromStatus,
    toStatus: dto.toStatus,
    changedAt: dto.changedAt ?? '',
    changedByName: dto.changedByName ?? '',
    note: dto.note ?? null,
  };
}

export function mapReportProgressDataDto(dto: ReportProgressDataDto): ReportProgress {
  const sla = dto.sla;
  const latitude =
    typeof dto.latitude === 'number' && Number.isFinite(dto.latitude) ? dto.latitude : 0;
  const longitude =
    typeof dto.longitude === 'number' && Number.isFinite(dto.longitude) ? dto.longitude : 0;

  return {
    reportId: dto.reportId,
    code: dto.code ?? '',
    status: dto.status,
    severity: dto.severity,
    categoryName: dto.categoryName ?? '',
    address: dto.address ?? '',
    wardCode: dto.wardCode ?? '',
    latitude,
    longitude,
    description: dto.description ?? '',
    sla: {
      resolveDueAt: sla?.resolveDueAt || null,
      hoursRemaining: sla?.hoursRemaining ?? 0,
      isBreached: Boolean(sla?.isBreached),
      severityLabel: sla?.severityLabel ?? '',
    },
    assignedCompany: mapAssignedCompanyDto(dto.assignedCompany),
    assignment: mapProgressAssignmentDto(dto.assignment),
    media: mapProgressMediaDto(dto.media),
    statusHistory: (dto.statusHistory ?? []).map(mapStatusHistoryDto),
  };
}
