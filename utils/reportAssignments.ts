import type {
  ReportAssignment,
  // ReportDetail,
} from '@/lib/api/models/report';

const REASSIGN_MIN_REASON = 20;

export const REASSIGN_REASON_MIN_LENGTH = REASSIGN_MIN_REASON;

export function canReassignAssignment(status: string): boolean {
  return status === 'Assigned' || status === 'Declined';
}

export function sortAssignmentsNewestFirst(assignments: ReportAssignment[]): ReportAssignment[] {
  return [...assignments].sort(
    (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
  );
}

export interface AssignmentSummary {
  declinedCount: number;
  assignedCount: number;
  inProgressCount: number;
  reassignableCount: number;
  /** Có ít nhất một assignment Declined (cần officer chú ý). */
  hasDeclined: boolean;
  /** Mọi assignment đều Declined — cần POST assign lại. */
  allDeclined: boolean;
  /** Còn slot có thể PUT reassign. */
  hasReassignable: boolean;
}

// export function summarizeAssignments(assignments: ReportAssignment[]): AssignmentSummary {
//   let declinedCount = 0;
//   let assignedCount = 0;
//   let inProgressCount = 0;
//   let reassignableCount = 0;

//   for (const a of assignments) {
//     if (a.status === 'checklai') declinedCount += 1;a.status
//     if (a.status === 'checklai') assignedCount += 1;
//     if (a.status === 'checklai') inProgressCount += 1;
//     if (canReassignAssignment(a.status as string)) reassignableCount += 1;
//   }

//   const total = assignments.length;
//   const allDeclined = total > 0 && declinedCount === total;

//   return {
//     declinedCount,
//     assignedCount,
//     inProgressCount,
//     reassignableCount,
//     hasDeclined: declinedCount > 0,
//     allDeclined,
//     hasReassignable: reassignableCount > 0,
//   };
// }

/** Khi tất cả đội từ chối, report về Dispatched — dùng POST assign, không reassign. */
// export function needsNewAssignment(detail: ReportDetail): boolean {
//   const summary = summarizeAssignments(detail.assignments);
//   return detail.status === 'Dispatched' && summary.allDeclined && detail.assignments.length > 0;
// }

export function isReassignReasonValid(reason: string): boolean {
  return reason.trim().length >= REASSIGN_MIN_REASON;
}

/** Team IDs đang active (không Declined) — loại khỏi danh sách đội mới. */
// export function activeAssignedTeamIds(assignments: ReportAssignment[]): Set<string> {
//   const ids = new Set<string>();
//   for (const a of assignments) {
//     if (a.status === 'Assigned' || a.status === 'InProgress') {
//       ids.add(a.teamId);
//     }
//   }
//   return ids;
// }
