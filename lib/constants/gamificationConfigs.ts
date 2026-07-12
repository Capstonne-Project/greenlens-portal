/** Nhãn hành động gamification (BR-GAM). */

export const GAMIFICATION_ACTION_LABEL_VI: Record<string, string> = {
  ReportVerified: 'Xác minh báo cáo',
  ReportResolved: 'Giải quyết báo cáo',
  PenaltyIssued: 'Ban hành xử phạt',
  DuplicateReport: 'Báo cáo trùng',
  ReportRejected: 'Từ chối báo cáo',
  FraudPenalty: 'Phạt gian lận',
};

export function gamificationActionLabel(actionType: string): string {
  return GAMIFICATION_ACTION_LABEL_VI[actionType] ?? actionType;
}
