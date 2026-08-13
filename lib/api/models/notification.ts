/** FE models — user notifications (BR-NTF-001 / BR-NTF-002). */

export type NotificationType =
  | 'ReportStatusChanged'
  | 'NewComment'
  | 'BadgeEarned'
  | 'LevelUp'
  | 'SlaBreachWarning'
  | 'SlaVerificationBreachedLeo'
  | 'SlaVerificationEscalatedDeo'
  | 'SlaResolutionBreached'
  | 'SlaInspectionBreached'
  | 'CleanupProgressStale'
  | 'CleanupProgressUpdated'
  | 'InspectionProgressUpdated'
  | 'InspectionTaskCompleted'
  | 'CleanupTaskAssigned'
  | 'CleanupTaskAccepted'
  | 'CleanupTaskDeclined'
  | 'CleanupTaskCompleted'
  | 'NearbyReport'
  | 'PenaltyIssued'
  | 'ContractExpiry'
  | 'ContractExpired'
  | 'ContractExpiryWarning'
  | 'CompanyReportDispatched'
  | 'CompanyTeamAssigned'
  | 'ReportOverdue'
  | 'ReportUnassigned'
  | 'ReportAutoClosed'
  | 'DuplicateReviewNeeded'
  | 'ReopenReviewNeeded'
  | 'ReopenRequestDecided'
  | 'ReportVerificationNeeded'
  | 'StaffInvitationReceived'
  | 'StaffInvitationAccepted'
  | 'StaffInvitationDeclined'
  | 'CommunityCleanupOpened'
  | 'CommunityCleanupLeaderAssigned'
  | 'CommunityCleanupStarted'
  | 'CommunityCleanupProgressUpdated'
  | 'CommunityCleanupVerificationSubmitted'
  | 'CommunityCleanupVerificationRejected'
  | 'CommunityCleanupVerified'
  | 'CommunityCleanupCheckInReminder'
  | 'BadgeProgressNear'
  | string;

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  /** Loại ô nhiễm liên quan (nếu có). */
  categoryName: string | null;
  /** Ảnh thu nhỏ báo cáo (nếu có). */
  thumbnailUrl: string | null;
}

export interface NotificationsList {
  items: NotificationItem[];
  totalCount: number;
  unreadCount: number;
}

export interface NotificationsListParams {
  page?: number;
  pageSize?: number;
  /** `undefined` = tất cả; `false` = chưa đọc; `true` = đã đọc. */
  isRead?: boolean;
}

export interface NotificationPreference {
  type: NotificationType;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export type NotificationPreferences = NotificationPreference[];

export interface UpdateNotificationPreferencesInput {
  preferences: NotificationPreference[];
}

export interface MarkAllNotificationsReadResult {
  markedCount: number;
}

/** Drawer / inbox mặc định — khớp Swagger default pageSize. */
export const NOTIFICATION_PAGE_SIZE = 20;
