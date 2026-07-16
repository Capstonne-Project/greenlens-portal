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
  'NearbyReport',
  'NewComment',
  'ReportAutoClosed',
  'ContractExpiry',
  'ReportUnassigned',
  'BadgeEarned',
  'ReportOverdue',
  'LevelUp',
  'DuplicateReviewNeeded',
] as const;

export type NotificationTemplateType = (typeof NOTIFICATION_TEMPLATE_TYPES)[number];

export const NOTIFICATION_TYPE_LABEL_VI: Record<string, string> = {
  ReportStatusChanged: 'Đổi trạng thái báo cáo',
  PenaltyIssued: 'Ban hành xử phạt',
  SlaBreachWarning: 'Cảnh báo vi phạm SLA',
  NearbyReport: 'Báo cáo gần bạn',
  NewComment: 'Bình luận mới',
  ReportAutoClosed: 'Tự động đóng báo cáo',
  ContractExpiry: 'Hợp đồng sắp hết hạn',
  ReportUnassigned: 'Báo cáo chưa phân công',
  BadgeEarned: 'Nhận huy hiệu',
  ReportOverdue: 'Báo cáo quá hạn',
  LevelUp: 'Lên cấp',
  DuplicateReviewNeeded: 'Cần duyệt trùng lặp',
};

export const NOTIFICATION_TEMPLATE_PAGE_SIZE = 20;

export function notificationChannelLabel(channel: string): string {
  return NOTIFICATION_CHANNEL_LABEL_VI[channel] ?? channel;
}

export function notificationTypeLabel(type: string): string {
  return NOTIFICATION_TYPE_LABEL_VI[type] ?? type;
}
