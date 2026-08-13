import type {
  AssignInspectionTeamResponseDto,
  CreateInspectionReportResponseDto,
  InspectionChecklistEvidenceDto,
  InspectionDetailDto,
  InspectionDetailResponseDto,
  InspectionOfficerQueueDataDto,
  InspectionOfficerQueueItemDto,
  InspectionOfficerQueuePaginationDto,
  InspectionPaymentDto,
  InspectionPaymentsHistoryDto,
  InspectionPaymentsHistoryResponseDto,
  RecordInspectionPaymentResponseDto,
  ReportInspectionListItemDto,
  ReportInspectionsListResponseDto,
  ViolatingEntityDto,
} from '@/lib/api/dto/inspectionReport.dto';
import type {
  AssignInspectionTeamResult,
  CreateInspectionReportResult,
  InspectionChecklistEvidence,
  InspectionDetail,
  InspectionOfficerQueueData,
  InspectionOfficerQueueItem,
  InspectionPayment,
  InspectionPaymentsHistory,
  RecordInspectionPaymentResult,
  ReportInspectionSummary,
  ReportInspectionsList,
  ViolatingEntity,
} from '@/lib/api/models/inspectionReport';
import type { PaginationMeta } from '@/lib/api/models/office';

export function mapCreateInspectionReportResponse(
  dto: CreateInspectionReportResponseDto
): CreateInspectionReportResult {
  return {
    code: dto.code ?? '',
    message: dto.message ?? '',
    status: Number(dto.status) || 0,
    inspectionId: dto.data ?? '',
  };
}

function trimOrNull(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

/** Giữ `null` thật — không ép `0` từ Swagger mock khi field chưa set. */
function toNullableNumber(value: number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mapReportInspectionListItemDto(
  dto: ReportInspectionListItemDto
): ReportInspectionSummary {
  return {
    id: dto.id ?? '',
    status: dto.status ?? '',
    violatorName: trimOrNull(dto.violatorName),
    violationLevel: trimOrNull(dto.violationLevel),
    penaltyAmount: toNullableNumber(dto.penaltyAmount),
    paidAmount: toNullableNumber(dto.paidAmount),
    isRepeatOffender: Boolean(dto.isRepeatOffender),
    violatingEntityId: trimOrNull(dto.violatingEntityId),
    violatingEntityName: trimOrNull(dto.violatingEntityName),
    createdByOfficerId: trimOrNull(dto.createdByOfficerId),
    createdByOfficerName: trimOrNull(dto.createdByOfficerName),
    slaInspectionDueAt: trimOrNull(dto.slaInspectionDueAt),
    closedAt: trimOrNull(dto.closedAt),
    createdAt: trimOrNull(dto.createdAt),
  };
}

export function mapReportInspectionsListResponse(
  dto: ReportInspectionsListResponseDto
): ReportInspectionsList {
  return {
    items: (dto.data?.items ?? []).map(mapReportInspectionListItemDto),
  };
}

export function mapViolatingEntityDto(
  dto: ViolatingEntityDto | null | undefined
): ViolatingEntity | null {
  if (dto == null) return null;
  return {
    id: dto.id ?? '',
    name: trimOrNull(dto.name),
    type: trimOrNull(dto.type),
    address: trimOrNull(dto.address),
    taxCode: trimOrNull(dto.taxCode),
    identityNumber: trimOrNull(dto.identityNumber),
    phoneNumber: trimOrNull(dto.phoneNumber),
  };
}

export function mapInspectionPaymentDto(dto: InspectionPaymentDto): InspectionPayment {
  return {
    id: dto.id ?? '',
    amount: toNullableNumber(dto.amount),
    paidAt: trimOrNull(dto.paidAt),
    evidenceUrl: trimOrNull(dto.evidenceUrl),
    note: trimOrNull(dto.note),
    recordedByUserId: trimOrNull(dto.recordedByUserId),
    recordedByUserName: trimOrNull(dto.recordedByUserName),
    createdAt: trimOrNull(dto.createdAt),
  };
}

/** GET /v1/inspections/{id}/payments — data. */
export function mapInspectionPaymentsHistoryDto(
  dto: InspectionPaymentsHistoryDto
): InspectionPaymentsHistory {
  return {
    inspectionId: dto.inspectionId?.trim() || '',
    penaltyAmount: toNullableNumber(dto.penaltyAmount),
    paidAmount: toNullableNumber(dto.paidAmount),
    remainingAmount: toNullableNumber(dto.remainingAmount),
    payments: (dto.payments ?? []).map(mapInspectionPaymentDto),
  };
}

export function mapInspectionPaymentsHistoryResponse(
  dto: InspectionPaymentsHistoryResponseDto
): InspectionPaymentsHistory {
  return mapInspectionPaymentsHistoryDto(dto.data);
}

export function mapInspectionChecklistEvidenceDto(
  dto: InspectionChecklistEvidenceDto
): InspectionChecklistEvidence {
  return {
    id: dto.id ?? '',
    category: trimOrNull(dto.category),
    mediaUrl: trimOrNull(dto.mediaUrl),
    mimeType: trimOrNull(dto.mimeType),
    sizeBytes: toNullableNumber(dto.sizeBytes),
    description: trimOrNull(dto.description),
    durationSeconds: toNullableNumber(dto.durationSeconds),
    uploadedAt: trimOrNull(dto.uploadedAt),
  };
}

export function mapInspectionDetailDto(dto: InspectionDetailDto): InspectionDetail {
  return {
    id: dto.id ?? '',
    reportId: trimOrNull(dto.reportId),
    reportCode: trimOrNull(dto.reportCode),
    latitude: toNullableNumber(dto.latitude),
    longitude: toNullableNumber(dto.longitude),
    status: dto.status ?? '',
    assignedTeamId: trimOrNull(dto.assignedTeamId),
    assignedTeamName: trimOrNull(dto.assignedTeamName),
    violationDescription: trimOrNull(dto.violationDescription),
    violatorName: trimOrNull(dto.violatorName),
    violatorAddress: trimOrNull(dto.violatorAddress),
    violatorIdentity: trimOrNull(dto.violatorIdentity),
    violationLevel: trimOrNull(dto.violationLevel),
    penaltyAmount: toNullableNumber(dto.penaltyAmount),
    penaltyDecisionNumber: trimOrNull(dto.penaltyDecisionNumber),
    penaltyIssuedAt: trimOrNull(dto.penaltyIssuedAt),
    penaltyDueDate: trimOrNull(dto.penaltyDueDate),
    paidAmount: toNullableNumber(dto.paidAmount),
    additionalPenaltyMeasures: trimOrNull(dto.additionalPenaltyMeasures),
    isRepeatOffender: Boolean(dto.isRepeatOffender),
    violatingEntityId: trimOrNull(dto.violatingEntityId),
    violatingEntity: mapViolatingEntityDto(dto.violatingEntity),
    payments: (dto.payments ?? []).map(mapInspectionPaymentDto),
    acceptedAt: trimOrNull(dto.acceptedAt),
    acceptedByUserId: trimOrNull(dto.acceptedByUserId),
    acceptedByUserName: trimOrNull(dto.acceptedByUserName ?? dto.acceptedByName),
    arrivalConfirmedAt: trimOrNull(dto.arrivalConfirmedAt),
    arrivalLatitude: toNullableNumber(dto.arrivalLatitude),
    arrivalLongitude: toNullableNumber(dto.arrivalLongitude),
    arrivalNote: trimOrNull(dto.arrivalNote),
    fieldInvestigationSubmittedAt: trimOrNull(dto.fieldInvestigationSubmittedAt),
    fieldInvestigationSubmittedByUserId: trimOrNull(dto.fieldInvestigationSubmittedByUserId),
    checklistEvidence: (dto.checklistEvidence ?? []).map(mapInspectionChecklistEvidenceDto),
    createdByOfficerId: trimOrNull(dto.createdByOfficerId),
    createdByOfficerName: trimOrNull(dto.createdByOfficerName),
    issuedByInspectorId: trimOrNull(dto.issuedByInspectorId),
    issuedByInspectorName: trimOrNull(dto.issuedByInspectorName),
    slaInspectionDueAt: trimOrNull(dto.slaInspectionDueAt),
    closedAt: trimOrNull(dto.closedAt),
    closedReason: trimOrNull(dto.closedReason),
    createdAt: trimOrNull(dto.createdAt),
    canAcceptTask: Boolean(dto.canAcceptTask),
    canConfirmArrival: Boolean(dto.canConfirmArrival),
    canEditChecklist: Boolean(dto.canEditChecklist),
    canSubmitFieldReport: Boolean(dto.canSubmitFieldReport),
    canEditDetails: Boolean(dto.canEditDetails),
    canIssuePenalty: Boolean(dto.canIssuePenalty),
    canCloseNoViolation: Boolean(dto.canCloseNoViolation),
    canRecordPayment: Boolean(dto.canRecordPayment),
    canClose: Boolean(dto.canClose),
  };
}

export function mapInspectionDetailResponse(dto: InspectionDetailResponseDto): InspectionDetail {
  return mapInspectionDetailDto(dto.data);
}

export function mapAssignInspectionTeamResponse(
  dto: AssignInspectionTeamResponseDto
): AssignInspectionTeamResult {
  return {
    code: dto.code ?? '',
    message: dto.message ?? '',
    status: Number(dto.status) || 0,
    ...(typeof dto.data === 'string' ? { data: dto.data } : {}),
  };
}

export function mapRecordInspectionPaymentResponse(
  dto: RecordInspectionPaymentResponseDto
): RecordInspectionPaymentResult {
  return {
    code: dto.code ?? '',
    message: dto.message ?? '',
    status: Number(dto.status) || 0,
  };
}

function mapInspectionOfficerQueuePagination(
  dto: InspectionOfficerQueuePaginationDto | null | undefined
): PaginationMeta {
  const page = Math.max(1, dto?.page ?? 1);
  const pageSize = Math.max(1, dto?.pageSize ?? 8);
  const totalItems = Math.max(0, dto?.totalItems ?? 0);
  const totalPages = Math.max(1, dto?.totalPages ?? (Math.ceil(totalItems / pageSize) || 1));
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext: dto?.hasNext ?? page < totalPages,
    hasPrev: dto?.hasPrev ?? page > 1,
  };
}

export function mapInspectionOfficerQueueItemDto(
  dto: InspectionOfficerQueueItemDto
): InspectionOfficerQueueItem {
  return {
    id: dto.id ?? '',
    reportId: trimOrNull(dto.reportId),
    reportCode: trimOrNull(dto.reportCode),
    reportStatus: trimOrNull(dto.reportStatus),
    status: dto.status ?? '',
    address: trimOrNull(dto.address),
    wardCode: trimOrNull(dto.wardCode),
    latitude: toNullableNumber(dto.latitude),
    longitude: toNullableNumber(dto.longitude),
    violatorName: trimOrNull(dto.violatorName),
    violationDescription: trimOrNull(dto.violationDescription),
    violationLevel: trimOrNull(dto.violationLevel),
    penaltyAmount: toNullableNumber(dto.penaltyAmount),
    paidAmount: toNullableNumber(dto.paidAmount),
    isRepeatOffender: Boolean(dto.isRepeatOffender),
    assignedTeamId: trimOrNull(dto.assignedTeamId),
    assignedTeamName: trimOrNull(dto.assignedTeamName),
    createdByOfficerId: trimOrNull(dto.createdByOfficerId),
    createdByOfficerName: trimOrNull(dto.createdByOfficerName),
    slaInspectionDueAt: trimOrNull(dto.slaInspectionDueAt),
    slaInspectionBreached: Boolean(dto.slaInspectionBreached),
    penaltyDueDate: trimOrNull(dto.penaltyDueDate),
    createdAt: trimOrNull(dto.createdAt),
  };
}

export function mapInspectionOfficerQueueDataDto(
  data: InspectionOfficerQueueDataDto
): InspectionOfficerQueueData {
  return {
    items: (data?.items ?? []).map(mapInspectionOfficerQueueItemDto),
    pagination: mapInspectionOfficerQueuePagination(data?.pagination),
  };
}
