import { companyStatusClasses, companyStatusLabel } from '@/utils/companyUi';
import { cn } from '@/lib/utils';

interface CompanyStatusBadgeProps {
  status: string;
  className?: string;
}

export function CompanyStatusBadge({ status, className }: CompanyStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold',
        companyStatusClasses(status),
        className
      )}
    >
      {companyStatusLabel(status)}
    </span>
  );
}
