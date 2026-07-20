import type {
  ReportProgressAssignmentDto,
  ReportProgressDataDto,
  ReportProgressImageDto,
  ReportProgressMediaDto,
  ReportProgressStatusHistoryDto,
} from '@/lib/api/dto/reportProgress.dto';
import type {
  ReportProgress,
  ReportProgressAssignment,
  ReportProgressImage,
  ReportProgressMedia,
  ReportProgressStatusHistory,
} from '@/lib/api/models/reportProgress';

function mapProgressImageDto(dto: ReportProgressImageDto): ReportProgressImage {
  return {
    url: dto.url,
    uploadedAt: dto.uploadedAt,
  };
}

function mapProgressAssignmentDto(dto: ReportProgressAssignmentDto): ReportProgressAssignment {
  return {
    assignmentId: dto.assignmentId,
    teamId: dto.teamId,
    teamName: dto.teamName,
    teamType: dto.teamType,
    teamLeaderName: dto.teamLeaderName,
    status: dto.status,
    assignedAt: dto.assignedAt,
    acceptedAt: dto.acceptedAt ?? null,
    completedAt: dto.completedAt ?? null,
    declineReason: dto.declineReason ?? null,
    progressPercent: dto.progressPercent,
    progressNote: dto.progressNote ?? null,
    progressUpdatedAt: dto.progressUpdatedAt ?? null,
  };
}

function mapProgressMediaDto(dto: ReportProgressMediaDto): ReportProgressMedia {
  return {
    beforeImages: (dto.beforeImages ?? []).map(mapProgressImageDto),
    progressImages: (dto.progressImages ?? []).map(mapProgressImageDto),
    afterImages: (dto.afterImages ?? []).map(mapProgressImageDto),
  };
}

function mapStatusHistoryDto(dto: ReportProgressStatusHistoryDto): ReportProgressStatusHistory {
  return {
    fromStatus: dto.fromStatus,
    toStatus: dto.toStatus,
    changedAt: dto.changedAt,
    changedByName: dto.changedByName,
    note: dto.note ?? null,
  };
}

export function mapReportProgressDataDto(dto: ReportProgressDataDto): ReportProgress {
  return {
    reportId: dto.reportId,
    code: dto.code,
    status: dto.status,
    severity: dto.severity,
    categoryName: dto.categoryName,
    address: dto.address,
    wardCode: dto.wardCode,
    description: dto.description,
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
      startedAt: dto.summary.startedAt,
    },
    assignments: (dto.assignments ?? []).map(mapProgressAssignmentDto),
    media: mapProgressMediaDto(dto.media),
    statusHistory: (dto.statusHistory ?? []).map(mapStatusHistoryDto),
  };
}
