import type {
  ReportAssignmentDto,
  // ReportAssignmentStatusDto,
  ReportDetailDto,
  // ReportWasteTagDto,
} from '@/lib/api/dto/report.dto';
import type {
  ReportAssignment,
  // ReportAssignmentStatus,
  ReportDetail,
  // ReportWasteTag,
} from '@/lib/api/models/report';

// const ASSIGNMENT_STATUSES: ReportAssignmentStatus[] = [
//   'Assigned',
//   'Declined',
//   'InProgress',
//   'Completed',
// ];

// function mapAssignmentStatus(raw?: string | ReportAssignmentStatusDto): ReportAssignmentStatus {
//   if (raw && ASSIGNMENT_STATUSES.includes(raw as ReportAssignmentStatus)) {
//     return raw as ReportAssignmentStatus;
//   }
//   return 'Assigned';
// }

// function mapMediaType(raw: string): MediaType {
//   return raw === 'Video' ? 'Video' : 'Image';
// }

// function mapReportMediaDto(dto: ReportMediaDto): ReportMedia {
//   return {
//     id: dto.id,
//     mediaType: mapMediaType(dto.mediaType),
//     url: dto.url,
//     mimeType: dto.mimeType,
//     sizeBytes: dto.sizeBytes,
//   };
// }

// function mapReportWasteTagDto(dto: ReportWasteTagDto): ReportWasteTag {
//   return {
//     tagId: dto.tagId,
//     code: dto.code,
//     nameVi: dto.nameVi,
//     nameEn: dto.nameEn,
//     iconUrl: dto.iconUrl,
//   };
// }

function mapReportAssignmentDto(dto: ReportAssignmentDto): ReportAssignment {
  return {
    id: dto.id,
    teamId: dto.teamId,
    teamName: dto.teamName,
    // teamType: dto.teamType ?? null,
    // teamType: 'XEM LAI TEAM TYPE',
    // status: mapAssignmentStatus(dto.status),
    // status: 'XEM LAI STATUS',
    note: dto.note ?? null,
    assignedAt: dto.assignedAt,
    assignedByUserId: dto.assignedByUserId ?? '',
    assignedByName: dto.assignedByName ?? null,
  };
}

/** GET /v1/reports/{id} → `data` */
export function mapReportDetailDto(dto: ReportDetailDto): ReportDetail {
  return {
    id: dto.id,
    code: dto.code,
    reporterId: dto.reporterId ?? '',
    isAnonymous: dto.isAnonymous ?? false,
    categoryId: dto.categoryId,
    categoryCode: dto.categoryCode,
    categoryName: dto.categoryName,
    severity: dto.severity,
    severitySetBy: dto.severitySetBy,
    status: dto.status,
    description: dto.description,
    slaVerifyDueAt: dto.slaVerifyDueAt,
    assignments: dto.assignments.map(mapReportAssignmentDto),
    latitude: dto.latitude,
    longitude: dto.longitude,
    media: dto.media,
    assignedOfficeId: dto.assignedOfficeId ?? null,
    address: dto.address,
    wardCode: dto.wardCode,
    provinceCode: dto.provinceCode,
    priorityScore: dto.priorityScore,
    reporterCount: dto.reporterCount,
    reopenedCount: dto.reopenedCount,
    createdAt: dto.createdAt,
    verifiedAt: dto.verifiedAt,
    dispatchedAt: dto.dispatchedAt,
    resolvedAt: dto.resolvedAt,
    closedAt: dto.closedAt,
    slaResolveDueAt: dto.slaResolveDueAt,
    updatedAt: dto.updatedAt,
  };
}
