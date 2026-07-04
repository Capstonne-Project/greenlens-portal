const COMPANY_STATUS_LABELS: Record<string, string> = {
  PendingActivation: 'Chờ kích hoạt',
  Active: 'Đang hoạt động',
  Suspended: 'Tạm ngưng',
  Expired: 'Hết hạn',
};

const COMPANY_STATUS_CLASSES: Record<string, string> = {
  PendingActivation: 'bg-amber-100 text-amber-900',
  Active: 'bg-emerald-100 text-emerald-900',
  Suspended: 'bg-red-100 text-red-900',
  Expired: 'bg-muted text-muted-foreground',
};

export const COMPANY_STAFF_POSITIONS = ['Manager', 'Team Leader', 'Staff', 'Technician'] as const;

export type CompanyStaffPosition = (typeof COMPANY_STAFF_POSITIONS)[number];

export function companyStatusLabel(status: string): string {
  return COMPANY_STATUS_LABELS[status] ?? status;
}

export function companyStatusClasses(status: string): string {
  return COMPANY_STATUS_CLASSES[status] ?? 'bg-muted text-muted-foreground';
}

export function formatCompanyDate(iso: string | null | undefined): string {
  if (!iso?.trim() || iso.startsWith('0001-01-01')) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

export function getCompanyMutationError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    const msg = res?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

const SEVERITY_LABELS: Record<string, string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
  Critical: 'Nghiêm trọng',
};

const SEVERITY_CLASSES: Record<string, string> = {
  Low: 'bg-emerald-100 text-emerald-900',
  Medium: 'bg-lime-100 text-lime-900',
  High: 'bg-orange-100 text-orange-900',
  Critical: 'bg-red-100 text-red-900',
};

export function queueSeverityLabel(severity: string): string {
  return SEVERITY_LABELS[severity] ?? severity;
}

export function queueSeverityClasses(severity: string): string {
  return SEVERITY_CLASSES[severity] ?? 'bg-muted text-muted-foreground';
}

export function formatQueueRelativeTime(iso: string): string {
  if (!iso?.trim()) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return formatCompanyDate(iso);
}

export function isSlaUrgent(slaIso: string): boolean {
  if (!slaIso?.trim()) return false;
  const due = new Date(slaIso);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() - Date.now() < 24 * 60 * 60 * 1000;
}

const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  Assigned: 'Đã phân công',
  InProgress: 'Đang xử lý',
  Completed: 'Hoàn thành',
  Declined: 'Từ chối',
};

const ASSIGNMENT_STATUS_CLASSES: Record<string, string> = {
  Assigned: 'bg-sky-100 text-sky-900',
  InProgress: 'bg-emerald-100 text-emerald-900',
  Completed: 'bg-emerald-600/15 text-emerald-900',
  Declined: 'bg-red-100 text-red-900',
};

export function assignmentStatusLabel(status: string): string {
  return ASSIGNMENT_STATUS_LABELS[status] ?? status;
}

export function assignmentStatusClasses(status: string): string {
  return ASSIGNMENT_STATUS_CLASSES[status] ?? 'bg-muted text-muted-foreground';
}

/** Gợi ý trạng thái cho Company Manager (theo dõi đội chấp nhận / xử lý). */
export function assignmentStatusCompanyHint(status: string): string {
  switch (status) {
    case 'Assigned':
      return 'Chờ đội xác nhận nhận task';
    case 'InProgress':
      return 'Đội đang thực hiện';
    case 'Completed':
      return 'Đội đã hoàn thành phần việc';
    case 'Declined':
      return 'Đội từ chối task';
    default:
      return '';
  }
}

export function formatCompanyDateTime(iso: string | null | undefined): string {
  if (!iso?.trim() || iso.startsWith('0001-01-01')) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '—';
  }
}

export function formatSlaRemaining(hours: number): string {
  if (hours >= 0) {
    if (hours < 24) return `Còn ${hours} giờ`;
    const days = Math.floor(hours / 24);
    return `Còn ${days} ngày`;
  }
  const overdue = Math.abs(hours);
  if (overdue < 24) return `Quá hạn ${overdue} giờ`;
  const days = Math.floor(overdue / 24);
  return `Quá hạn ${days} ngày`;
}
