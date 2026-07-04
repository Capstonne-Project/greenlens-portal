import type { ReportSeverity } from '@/lib/api/models/adminReport';

export const REPORT_SEVERITY_OPTIONS: { value: ReportSeverity; label: string }[] = [
  { value: 'Low', label: 'Thấp (Low)' },
  { value: 'Medium', label: 'Trung bình (Medium)' },
  { value: 'High', label: 'Cao (High)' },
  { value: 'Critical', label: 'Nghiêm trọng (Critical)' },
];

export const REJECT_REASON_MIN_LENGTH = 20;
