import type { PaginationMeta } from '@/lib/api/models/office';

/** POST /v1/reports/{id}/inspections — body tạo hồ sơ nháp (BR-INS-001). */
export interface CreateInspectionReportInput {
  assignedTeamId: string;
  violationDescription?: string;
  violatorName?: string;
  violatorAddress?: string;
  violatorIdentity?: string;
}

/** POST /v1/reports/{id}/inspections — kết quả tạo hồ sơ. */
export interface CreateInspectionReportResult {
  code: string;
  message: string;
  status: number;
  /** Id hồ sơ InspectionReport vừa tạo. */
  inspectionId: string;
}

/** PUT /v1/inspections/{id}/assign-team — body gán đội kiểm tra. */
export interface AssignInspectionTeamInput {
  assignedTeamId: string;
}

/** PUT /v1/inspections/{id}/assign-team — kết quả gán đội. */
export interface AssignInspectionTeamResult {
  code: string;
  message: string;
  status: number;
  /** Có mặt khi BE trả `data` dạng string. */
  data?: string;
}

/**
 * PUT /v1/inspections/{id}/record-payment — body ghi nhận nộp phạt [LEO] (BR-INS-020, BR-ORG-012).
 * multipart/form-data — `receipt` (ảnh biên lai) bắt buộc.
 */
export interface RecordInspectionPaymentInput {
  paidAmount: number;
  /** ISO string. */
  paidAt: string;
  receipt: File;
  note?: string;
  /**
   * UUID sinh 1 lần khi mở dialog và giữ nguyên qua các lần retry —
   * chặn ghi phạt trùng khi 401-refresh replay request hoặc user thử lại sau timeout.
   */
  idempotencyKey?: string;
}

/** PUT /v1/inspections/{id}/record-payment — kết quả. Không có payload cụ thể. */
export interface RecordInspectionPaymentResult {
  code: string;
  message: string;
  status: number;
}

/**
 * GET /v1/reports/{id}/inspections — hồ sơ xử phạt gắn báo cáo.
 * BE trả mảng; nghiệp vụ hiện tại: tối đa 1 hồ sơ / báo cáo.
 * Amounts / level thường null khi Draft — không tin mock Swagger `0`.
 */
export interface ReportInspectionSummary {
  id: string;
  /** Trạng thái hồ sơ xử phạt — xem `InspectionStatus`. */
  status: string;
  violatorName: string | null;
  /** Null khi chưa issue-penalty. */
  violationLevel: string | null;
  /** Null khi chưa issue-penalty. */
  penaltyAmount: number | null;
  /** Null/0 trước khi có thanh toán. */
  paidAmount: number | null;
  isRepeatOffender: boolean;
  violatingEntityId: string | null;
  violatingEntityName: string | null;
  createdByOfficerId: string | null;
  createdByOfficerName: string | null;
  slaInspectionDueAt: string | null;
  closedAt: string | null;
  createdAt: string | null;
}

export interface ReportInspectionsList {
  items: ReportInspectionSummary[];
}

/**
 * Trạng thái hồ sơ xử phạt (BE).
 * Draft → InProgress → PenaltyIssued → PartiallyPaid | Paid | Overdue → Closed
 * Nhánh: ClosedNoViolation.
 */
export type InspectionStatus =
  | 'Draft'
  | 'InProgress'
  | 'PenaltyIssued'
  | 'PartiallyPaid'
  | 'Paid'
  | 'Overdue'
  | 'Closed'
  | 'ClosedNoViolation'
  | (string & {});

/** Mức độ vi phạm — null khi chưa issue-penalty. */
export type ViolationLevel = 'Minor' | 'Moderate' | 'Severe' | 'Critical' | (string & {});

/** Loại đối tượng vi phạm. */
export type ViolatingEntityType = 'Individual' | 'Organization' | (string & {});

/** GET /v1/inspections/{id} — đối tượng vi phạm. */
export interface ViolatingEntity {
  id: string;
  name: string | null;
  type: ViolatingEntityType | null;
  address: string | null;
  taxCode: string | null;
  identityNumber: string | null;
  phoneNumber: string | null;
}

/** GET /v1/inspections/{id} — bản ghi thanh toán. */
export interface InspectionPayment {
  id: string;
  amount: number | null;
  paidAt: string | null;
  evidenceUrl: string | null;
  note: string | null;
  recordedByUserId: string | null;
  recordedByUserName: string | null;
  createdAt: string | null;
}

/**
 * GET /v1/inspections/{id}/payments — lịch sử nộp phạt (BR-INS-020).
 * Tổng phạt / đã nộp / còn lại + từng lần nộp.
 */
export interface InspectionPaymentsHistory {
  inspectionId: string;
  penaltyAmount: number | null;
  paidAmount: number | null;
  remainingAmount: number | null;
  payments: InspectionPayment[];
}

/** GET /v1/inspections/{id} — bằng chứng checklist hiện trường. */
export interface InspectionChecklistEvidence {
  id: string;
  category: string | null;
  mediaUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  description: string | null;
  durationSeconds: number | null;
  uploadedAt: string | null;
}

/**
 * GET /v1/inspections/{id} — [InspectionLEO] chi tiết hồ sơ xử phạt.
 * Amounts / level null khi Draft; lat/lng giữ 0 nếu BE gửi 0.
 */
export interface InspectionDetail {
  id: string;
  reportId: string | null;
  reportCode: string | null;
  /** Tọa độ báo cáo gốc (GPS báo cáo). */
  latitude: number | null;
  longitude: number | null;
  status: InspectionStatus;
  assignedTeamId: string | null;
  assignedTeamName: string | null;
  violationDescription: string | null;
  violatorName: string | null;
  violatorAddress: string | null;
  violatorIdentity: string | null;
  violationLevel: ViolationLevel | null;
  penaltyAmount: number | null;
  penaltyDecisionNumber: string | null;
  penaltyIssuedAt: string | null;
  penaltyDueDate: string | null;
  paidAmount: number | null;
  additionalPenaltyMeasures: string | null;
  isRepeatOffender: boolean;
  violatingEntityId: string | null;
  violatingEntity: ViolatingEntity | null;
  payments: InspectionPayment[];
  acceptedAt: string | null;
  acceptedByUserId: string | null;
  arrivalConfirmedAt: string | null;
  arrivalLatitude: number | null;
  arrivalLongitude: number | null;
  arrivalNote: string | null;
  fieldInvestigationSubmittedAt: string | null;
  fieldInvestigationSubmittedByUserId: string | null;
  checklistEvidence: InspectionChecklistEvidence[];
  createdByOfficerId: string | null;
  createdByOfficerName: string | null;
  issuedByInspectorId: string | null;
  issuedByInspectorName: string | null;
  slaInspectionDueAt: string | null;
  closedAt: string | null;
  closedReason: string | null;
  createdAt: string | null;
  canAcceptTask: boolean;
  canConfirmArrival: boolean;
  canEditChecklist: boolean;
  canSubmitFieldReport: boolean;
  canEditDetails: boolean;
  canIssuePenalty: boolean;
  canCloseNoViolation: boolean;
  canRecordPayment: boolean;
  canClose: boolean;
}

/**
 * GET /v1/inspections/officer-queue — một item [LEO/DEO].
 * Amounts / level null khi Draft.
 */
export interface InspectionOfficerQueueItem {
  id: string;
  reportId: string | null;
  reportCode: string | null;
  reportStatus: string | null;
  status: InspectionStatus;
  address: string | null;
  wardCode: string | null;
  latitude: number | null;
  longitude: number | null;
  violatorName: string | null;
  violationDescription: string | null;
  violationLevel: ViolationLevel | null;
  penaltyAmount: number | null;
  paidAmount: number | null;
  isRepeatOffender: boolean;
  assignedTeamId: string | null;
  assignedTeamName: string | null;
  createdByOfficerId: string | null;
  createdByOfficerName: string | null;
  slaInspectionDueAt: string | null;
  slaInspectionBreached: boolean;
  penaltyDueDate: string | null;
  createdAt: string | null;
}

/** GET /v1/inspections/officer-queue — data envelope. */
export interface InspectionOfficerQueueData {
  items: InspectionOfficerQueueItem[];
  pagination: PaginationMeta;
}

export type InspectionOfficerQueueSortDir = 'asc' | 'desc' | 'Asc' | 'Desc' | (string & {});

/** GET /v1/inspections/officer-queue — query params (FE mặc định pageSize=8 khi gọi). */
export interface InspectionOfficerQueueParams {
  page?: number;
  pageSize?: number;
  /** Draft | InProgress | PenaltyIssued | Paid | PartiallyPaid | Overdue | Closed | ClosedNoViolation */
  status?: InspectionStatus;
  assignedTeamId?: string;
  unassignedOnly?: boolean;
  slaBreached?: boolean;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sortBy?: string;
  sortDir?: InspectionOfficerQueueSortDir;
}
