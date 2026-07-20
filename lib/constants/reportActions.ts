import type { ReportSeverity } from '@/lib/api/models/adminReport';

export const REPORT_SEVERITY_OPTIONS: { value: ReportSeverity; label: string }[] = [
  { value: 'Low', label: 'Thấp (Low)' },
  { value: 'Medium', label: 'Trung bình (Medium)' },
  { value: 'High', label: 'Cao (High)' },
  { value: 'Critical', label: 'Nghiêm trọng (Critical)' },
];

/** Nhãn VI ngắn — bảng / badge. */
export const REPORT_SEVERITY_LABEL_VI: Record<ReportSeverity, string> = {
  Critical: 'Nghiêm trọng',
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp',
};

/**
 * Severity ladder (ops dashboard): neutral → warn → high → critical.
 * Low dùng slate (không dùng xanh) để tránh nhầm với status Resolved.
 */
export const REPORT_SEVERITY_BADGE_CLASSES: Record<ReportSeverity, string> = {
  Low: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
  Medium: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
  High: 'bg-orange-50 text-orange-800 ring-1 ring-orange-200/80',
  Critical: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80',
};

export const REJECT_REASON_MIN_LENGTH = 20;
