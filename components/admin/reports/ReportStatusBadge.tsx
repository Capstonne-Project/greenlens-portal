import type { ReportStatus } from '@/lib/api/models/adminReport';
import { reportStatusBadgeClasses, reportStatusLabelVi } from '@/utils/adminReportUi';

interface ReportStatusBadgeProps {
  status: ReportStatus;
}

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${reportStatusBadgeClasses(status)}`}
    >
      {reportStatusLabelVi(status)}
    </span>
  );
}
