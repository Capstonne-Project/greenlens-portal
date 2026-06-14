// import type { ReportAssignmentStatus } from '@/lib/api/models/report';

export const ASSIGNMENT_STATUS_LABEL: Record<string, string> = {
  Assigned: 'Đang chờ phản hồi',
  Declined: 'Đã từ chối',
  InProgress: 'Đang xử lý',
  Completed: 'Hoàn thành',
};

export const ASSIGNMENT_STATUS_TONE: Record<string, 'slate' | 'red' | 'emerald' | 'blue'> = {
  Assigned: 'slate',
  Declined: 'red',
  InProgress: 'emerald',
  Completed: 'blue',
};
