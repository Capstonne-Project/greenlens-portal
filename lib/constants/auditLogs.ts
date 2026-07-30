/** BR-ADM-010 — nhật ký kiểm toán admin (immutable, retention ≥ 12 tháng). */

export const AUDIT_LOGS_DEFAULT_PAGE_SIZE = 20;

export const AUDIT_LOGS_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

export type AuditLogsPageSize = (typeof AUDIT_LOGS_PAGE_SIZE_OPTIONS)[number];

/** @deprecated Dùng AUDIT_LOGS_DEFAULT_PAGE_SIZE */
export const AUDIT_LOGS_PAGE_SIZE = AUDIT_LOGS_DEFAULT_PAGE_SIZE;

/** Catalog entityType — §5 FE Admin Audit Log API Guide */
export const AUDIT_ENTITY_TYPES = [
  'User',
  'Report',
  'Company',
  'PollutionCategory',
  'WasteTag',
  'PenaltyFramework',
  'NotificationTemplate',
  'GamificationConfig',
  'BlockedWord',
  'InspectionReport',
  'PenaltyPayment',
  'ViolatingEntity',
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

/** Catalog action phổ biến — filter dropdown (contains match trên BE). */
export const AUDIT_ACTIONS = [
  'CreateAccount',
  'UpdateUser',
  'DeleteUser',
  'UpdateUserRole',
  'ToggleBanUser',
  'ForceUpdateReportStatus',
  'HideReport',
  'UnhideReport',
  'VerifyReport',
  'RejectReport',
  'AssignTeam',
  'ReassignTeam',
  'DispatchToCompany',
  'AssignCompanyTeam',
  'ConfirmDuplicate',
  'DismissDuplicate',
  'ApproveReopenRequest',
  'RejectReopenRequest',
  'DeleteReport',
  'CreateInspectionReport',
  'AssignInspectionTeam',
  'CloseInspection',
  'CloseNoViolation',
  'DeclineInspection',
  'RecordPayment',
  'DeletePenaltyPayment',
  'DeleteViolatingEntity',
  'CreateCompany',
  'RenewContract',
  'IssuePenalty',
  'BlockedWord.Create',
  'BlockedWord.Update',
  'BlockedWord.Delete',
] as const;

/** Export CSV — tối đa 90 ngày (BE validation). */
export const AUDIT_EXPORT_MAX_DAYS = 90;
