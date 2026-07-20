/** FE models — user notifications (BR-NTF-001). */

export type NotificationType =
  | 'ReportStatusChanged'
  | 'NewComment'
  | 'BadgeEarned'
  | 'LevelUp'
  | 'SlaBreachWarning'
  | 'NearbyReport'
  | 'PenaltyIssued'
  | 'ContractExpiry'
  | 'ReportOverdue'
  | 'ReportUnassigned'
  | 'ReportAutoClosed'
  | 'DuplicateReviewNeeded'
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
}

export interface NotificationsList {
  items: NotificationItem[];
  totalCount: number;
  unreadCount: number;
}

export interface NotificationsListParams {
  page?: number;
  pageSize?: number;
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
