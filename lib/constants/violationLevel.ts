/**
 * ViolationLevel — GET /v1/reports/{id}/inspections
 * Null khi chưa ban hành QĐ (Draft / InProgress / ClosedNoViolation thường null).
 */
export const VIOLATION_LEVELS = ['Minor', 'Moderate', 'Severe', 'Critical'] as const;

export type ViolationLevel = (typeof VIOLATION_LEVELS)[number];

/** Label VI — khớp tài liệu BE. */
export const VIOLATION_LEVEL_LABEL_VI: Record<ViolationLevel, string> = {
  Minor: 'Nhẹ',
  Moderate: 'Trung bình',
  Severe: 'Nặng',
  Critical: 'Đặc biệt nghiêm trọng',
};

export function isViolationLevel(value: string): value is ViolationLevel {
  return (VIOLATION_LEVELS as readonly string[]).includes(value);
}

/** `null`/empty → `—` (chưa ban hành QĐ). */
export function violationLevelLabelVi(level: string | null | undefined): string {
  if (!level?.trim()) return '—';
  if (isViolationLevel(level)) return VIOLATION_LEVEL_LABEL_VI[level];
  return level;
}
