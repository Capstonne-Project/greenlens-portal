import type { ReportSeverity } from '@/lib/api/models/adminReport';
import { severityBarColor, severityBarCount } from '@/utils/adminReportUi';

interface ReportSeverityBarsProps {
  severity: ReportSeverity;
  className?: string;
}

export function ReportSeverityBars({ severity, className }: ReportSeverityBarsProps) {
  const filled = severityBarCount(severity);
  const color = severityBarColor(severity);

  return (
    <span
      className={`inline-flex items-end gap-0.5 ${className ?? ''}`}
      role="img"
      aria-label={`Mức độ ${severity}`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`w-1 rounded-sm ${i < filled ? color : 'bg-muted'}`}
          style={{ height: `${8 + i * 3}px` }}
        />
      ))}
    </span>
  );
}
