/** POST /v1/reports/{id}/inspections — request body (Swagger). */
export interface CreateInspectionReportBodyDto {
  assignedTeamId: string;
  violationDescription?: string | null;
  violatorName?: string | null;
  violatorAddress?: string | null;
  violatorIdentity?: string | null;
}

/**
 * POST /v1/reports/{id}/inspections — envelope 200.
 * `data` = id hồ sơ xử phạt (UUID string).
 */
export interface CreateInspectionReportResponseDto {
  code: string;
  message: string;
  status: number;
  data: string;
}

/**
 * GET /v1/reports/{id}/inspections — một InspectionReport liên kết báo cáo
 * [LEO/Inspector] (Swagger list item).
 */
export interface ReportInspectionListItemDto {
  id: string;
  status: string;
  violatorName?: string | null;
  /** Nullable khi Draft. Enum: Minor | Moderate | Severe | Critical. */
  violationLevel?: string | null;
  penaltyAmount?: number | null;
  paidAmount?: number | null;
  isRepeatOffender?: boolean | null;
  violatingEntityId?: string | null;
  violatingEntityName?: string | null;
  createdByOfficerId?: string | null;
  createdByOfficerName?: string | null;
  slaInspectionDueAt?: string | null;
  closedAt?: string | null;
  createdAt?: string | null;
}

/** GET /v1/reports/{id}/inspections — envelope 200. */
export interface ReportInspectionsListResponseDto {
  code: string;
  message: string;
  status: number;
  data: {
    items: ReportInspectionListItemDto[];
  };
}

/** GET /v1/inspections/{id} — đối tượng vi phạm gắn hồ sơ. */
export interface ViolatingEntityDto {
  id: string;
  name?: string | null;
  /** Individual | Organization (hoặc giá trị BE trả). */
  type?: string | null;
  address?: string | null;
  taxCode?: string | null;
  identityNumber?: string | null;
  phoneNumber?: string | null;
}

/** GET /v1/inspections/{id} — bản ghi thanh toán. */
export interface InspectionPaymentDto {
  id: string;
  amount?: number | null;
  paidAt?: string | null;
  evidenceUrl?: string | null;
  note?: string | null;
  recordedByUserId?: string | null;
  recordedByUserName?: string | null;
  createdAt?: string | null;
}

/**
 * GET /v1/inspections/{id}/payments — [Inspector/LEO] lịch sử nộp phạt (BR-INS-020).
 */
export interface InspectionPaymentsHistoryDto {
  inspectionId?: string | null;
  penaltyAmount?: number | null;
  paidAmount?: number | null;
  remainingAmount?: number | null;
  payments?: InspectionPaymentDto[] | null;
}

/** GET /v1/inspections/{id}/payments — envelope 200. */
export interface InspectionPaymentsHistoryResponseDto {
  code: string;
  message: string;
  status: number;
  data: InspectionPaymentsHistoryDto;
}

/** GET /v1/inspections/{id} — bằng chứng checklist hiện trường. */
export interface InspectionChecklistEvidenceDto {
  id: string;
  category?: string | null;
  mediaUrl?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  description?: string | null;
  durationSeconds?: number | null;
  uploadedAt?: string | null;
}

/**
 * GET /v1/inspections/{id} — [InspectionLEO] chi tiết hồ sơ xử phạt (Swagger data).
 * Amounts / level thường null khi Draft — không tin mock Swagger `0`.
 */
export interface InspectionDetailDto {
  id: string;
  reportId?: string | null;
  reportCode?: string | null;
  /** Tọa độ báo cáo gốc (GPS báo cáo). */
  latitude?: number | null;
  longitude?: number | null;
  /** Draft | InProgress | PenaltyIssued | PartiallyPaid | Paid | Overdue | Closed | ClosedNoViolation */
  status?: string | null;
  assignedTeamId?: string | null;
  assignedTeamName?: string | null;
  violationDescription?: string | null;
  violatorName?: string | null;
  violatorAddress?: string | null;
  violatorIdentity?: string | null;
  /** Minor | Moderate | Severe | Critical — null khi chưa issue-penalty. */
  violationLevel?: string | null;
  penaltyAmount?: number | null;
  penaltyDecisionNumber?: string | null;
  penaltyIssuedAt?: string | null;
  penaltyDueDate?: string | null;
  paidAmount?: number | null;
  additionalPenaltyMeasures?: string | null;
  isRepeatOffender?: boolean | null;
  violatingEntityId?: string | null;
  violatingEntity?: ViolatingEntityDto | null;
  payments?: InspectionPaymentDto[] | null;
  acceptedAt?: string | null;
  acceptedByUserId?: string | null;
  acceptedByUserName?: string | null;
  acceptedByName?: string | null;
  arrivalConfirmedAt?: string | null;
  arrivalLatitude?: number | null;
  arrivalLongitude?: number | null;
  arrivalNote?: string | null;
  fieldInvestigationSubmittedAt?: string | null;
  fieldInvestigationSubmittedByUserId?: string | null;
  checklistEvidence?: InspectionChecklistEvidenceDto[] | null;
  createdByOfficerId?: string | null;
  createdByOfficerName?: string | null;
  issuedByInspectorId?: string | null;
  issuedByInspectorName?: string | null;
  slaInspectionDueAt?: string | null;
  closedAt?: string | null;
  closedReason?: string | null;
  createdAt?: string | null;
  canAcceptTask?: boolean | null;
  canConfirmArrival?: boolean | null;
  canEditChecklist?: boolean | null;
  canSubmitFieldReport?: boolean | null;
  canEditDetails?: boolean | null;
  canIssuePenalty?: boolean | null;
  canCloseNoViolation?: boolean | null;
  canRecordPayment?: boolean | null;
  canClose?: boolean | null;
}

/** GET /v1/inspections/{id} — envelope 200. */
export interface InspectionDetailResponseDto {
  code: string;
  message: string;
  status: number;
  data: InspectionDetailDto;
}

/** PUT /v1/inspections/{id}/assign-team — request body. */
export interface AssignInspectionTeamBodyDto {
  assignedTeamId: string;
}

/**
 * PUT /v1/inspections/{id}/assign-team — envelope.
 * `data` may be null/unknown depending on BE.
 */
export interface AssignInspectionTeamResponseDto {
  code: string;
  message: string;
  status: number;
  data?: unknown;
}

/**
 * GET /v1/inspections/officer-queue — một item hàng đợi hồ sơ xử phạt [LEO/DEO].
 * Amounts / level thường null khi Draft — không tin mock Swagger `0`.
 */
export interface InspectionOfficerQueueItemDto {
  id: string;
  reportId?: string | null;
  reportCode?: string | null;
  /** Trạng thái báo cáo gốc (Swagger: Submitted, …). */
  reportStatus?: string | null;
  /** Draft | InProgress | PenaltyIssued | Paid | PartiallyPaid | Overdue | Closed | ClosedNoViolation */
  status?: string | null;
  address?: string | null;
  wardCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  violatorName?: string | null;
  violationDescription?: string | null;
  /** Minor | Moderate | Severe | Critical — null khi chưa issue-penalty. */
  violationLevel?: string | null;
  penaltyAmount?: number | null;
  paidAmount?: number | null;
  isRepeatOffender?: boolean | null;
  assignedTeamId?: string | null;
  assignedTeamName?: string | null;
  createdByOfficerId?: string | null;
  createdByOfficerName?: string | null;
  slaInspectionDueAt?: string | null;
  slaInspectionBreached?: boolean | null;
  penaltyDueDate?: string | null;
  createdAt?: string | null;
}

export interface InspectionOfficerQueuePaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** GET /v1/inspections/officer-queue — data envelope. */
export interface InspectionOfficerQueueDataDto {
  items: InspectionOfficerQueueItemDto[];
  pagination: InspectionOfficerQueuePaginationDto;
}

/** GET /v1/inspections/officer-queue — envelope 200. */
export interface InspectionOfficerQueueResponseDto {
  code: string;
  message: string;
  status: number;
  data: InspectionOfficerQueueDataDto;
}

/**
 * PUT /v1/inspections/{id}/record-payment — envelope.
 * Không trả payload cụ thể — chỉ `code`/`message`/`status`.
 */
export interface RecordInspectionPaymentResponseDto {
  code: string;
  message: string;
  status: number;
  data?: unknown;
}

/** GET /v1/inspections/officer-queue — query params (all optional). */
export interface InspectionOfficerQueueParamsDto {
  page?: number;
  pageSize?: number;
  status?: string;
  assignedTeamId?: string;
  unassignedOnly?: boolean;
  slaBreached?: boolean;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc' | string;
}
