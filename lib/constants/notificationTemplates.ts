/** Nhãn channel / type cho admin notification templates. */

export const NOTIFICATION_TEMPLATE_CHANNELS = ['Push', 'Email', 'Both'] as const;

export type NotificationTemplateChannel = (typeof NOTIFICATION_TEMPLATE_CHANNELS)[number];

export const NOTIFICATION_CHANNEL_LABEL_VI: Record<string, string> = {
  Push: 'Push',
  Email: 'Email',
  Both: 'Push + Email',
};

export const NOTIFICATION_TEMPLATE_TYPES = [
  'ReportStatusChanged',
  'PenaltyIssued',
  'SlaBreachWarning',
  'SlaVerificationBreachedLeo',
  'SlaVerificationEscalatedDeo',
  'SlaResolutionBreached',
  'SlaInspectionBreached',
  'CleanupProgressStale',
  'CleanupTaskAssigned',
  'NearbyReport',
  'NewComment',
  'ReportAutoClosed',
  'ContractExpiry',
  'ContractExpired',
  'ContractExpiryWarning',
  'CompanyReportDispatched',
  'CompanyTeamAssigned',
  'ReportUnassigned',
  'BadgeEarned',
  'ReportOverdue',
  'LevelUp',
  'DuplicateReviewNeeded',
  'CommunityCleanupOpened',
  'CommunityCleanupLeaderAssigned',
  'CommunityCleanupStarted',
  'CommunityCleanupProgressUpdated',
  'InspectionProgressUpdated',
  'InspectionTaskCompleted',
  'CommunityCleanupVerificationSubmitted',
  'CommunityCleanupVerificationRejected',
  'CommunityCleanupVerified',
  'CommunityCleanupCheckInReminder',
  'BadgeProgressNear',
] as const;

export type NotificationTemplateType = (typeof NOTIFICATION_TEMPLATE_TYPES)[number];

export const NOTIFICATION_TYPE_LABEL_VI: Record<string, string> = {
  ReportStatusChanged: 'Đổi trạng thái báo cáo',
  PenaltyIssued: 'Ban hành xử phạt',
  SlaBreachWarning: 'Cảnh báo vi phạm SLA',
  SlaVerificationBreachedLeo: 'SLA xác minh vi phạm (LEO)',
  SlaVerificationEscalatedDeo: 'SLA xác minh escalated (DEO)',
  SlaResolutionBreached: 'SLA xử lý vi phạm',
  SlaInspectionBreached: 'SLA kiểm tra vi phạm',
  CleanupProgressStale: 'Tiến độ cleanup chậm',
  CleanupTaskAssigned: 'Có task cleanup mới',
  CleanupTaskAccepted: 'Đội đã nhận task cleanup',
  CleanupTaskDeclined: 'Đội từ chối task cleanup',
  CleanupTaskCompleted: 'Đội hoàn thành task cleanup',
  NearbyReport: 'Báo cáo gần bạn',
  NewComment: 'Bình luận mới',
  ReportAutoClosed: 'Tự động đóng báo cáo',
  ContractExpiry: 'Hợp đồng sắp hết hạn',
  ContractExpired: 'Hợp đồng đã hết hạn',
  ContractExpiryWarning: 'Cảnh báo hợp đồng sắp hết hạn',
  CompanyReportDispatched: 'Báo cáo đã phân về công ty',
  CompanyTeamAssigned: 'Công ty đã phân đội xử lý',
  ReportUnassigned: 'Báo cáo chưa phân công',
  BadgeEarned: 'Nhận huy hiệu',
  ReportOverdue: 'Báo cáo quá hạn',
  LevelUp: 'Lên cấp',
  DuplicateReviewNeeded: 'Cần duyệt trùng lặp',
  ReopenReviewNeeded: 'Citizen xin mở lại',
  ReopenRequestDecided: 'Kết quả duyệt mở lại',
  ReportVerificationNeeded: 'Báo cáo mới cần xác minh',
  StaffInvitationReceived: 'Lời mời vào ward team',
  StaffInvitationAccepted: 'Chấp nhận lời mời',
  StaffInvitationDeclined: 'Từ chối lời mời',
  CommunityCleanupOpened: 'Chương trình dọn cộng đồng mở',
  CommunityCleanupLeaderAssigned: 'Được chỉ định làm Leader',
  CommunityCleanupStarted: 'Dọn cộng đồng bắt đầu',
  CommunityCleanupProgressUpdated: 'Cập nhật tiến độ dọn cộng đồng',
  InspectionProgressUpdated: 'Cập nhật tiến độ hồ sơ xử phạt',
  InspectionTaskCompleted: 'Hoàn thành nhiệm vụ hồ sơ xử phạt',
  CommunityCleanupVerificationSubmitted: 'Cần duyệt hoàn thành dọn cộng đồng',
  CommunityCleanupVerificationRejected: 'Minh chứng dọn cộng đồng bị từ chối',
  CommunityCleanupVerified: 'Dọn cộng đồng đã hoàn thành',
  CommunityCleanupCheckInReminder: 'Nhắc check-in dọn cộng đồng',
  BadgeProgressNear: 'Sắp đạt huy hiệu',
};

export const NOTIFICATION_TEMPLATE_PAGE_SIZE = 8;

export function notificationChannelLabel(channel: string): string {
  return NOTIFICATION_CHANNEL_LABEL_VI[channel] ?? channel;
}

export function notificationTypeLabel(type: string): string {
  return NOTIFICATION_TYPE_LABEL_VI[type] ?? type;
}
