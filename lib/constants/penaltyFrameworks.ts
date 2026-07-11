export const PENALTY_FRAMEWORKS_PAGE_SIZE = 20;

export const PENALTY_VIOLATION_LEVELS = ['Minor', 'Moderate', 'Major', 'Critical'] as const;

export type PenaltyViolationLevel = (typeof PENALTY_VIOLATION_LEVELS)[number];

export const PENALTY_VIOLATION_LEVEL_LABEL_VI: Record<PenaltyViolationLevel, string> = {
  Minor: 'Nhẹ',
  Moderate: 'Trung bình',
  Major: 'Nặng',
  Critical: 'Nghiêm trọng',
};
