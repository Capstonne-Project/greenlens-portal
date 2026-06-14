// 'use client';

// import { Button } from '@/components/ui/button';
// import { useTeamDetail } from '@/hooks/useTeams';
// import {
//   ASSIGNMENT_STATUS_LABEL,
//   ASSIGNMENT_STATUS_TONE,
// } from '@/lib/constants/reportAssignment';
// import type { ReportAssignment, ReportDetail } from '@/lib/api/models/report';
// import {
//   canReassignAssignment,
//   needsNewAssignment,
//   sortAssignmentsNewestFirst,
//   summarizeAssignments,
// } from '@/utils/reportAssignments';
// import {
//   AlertTriangle,
//   ArrowRightLeft,
//   // CheckCircle2,
//   // Clock,
//   // PlayCircle,
//   UserPlus,
//   // XCircle,
// } from 'lucide-react';
// import { useMemo, useState } from 'react';
// import { ReassignTeamDialog } from '@/components/officer/tracking/ReassignTeamDialog';

// // const TONE_CLASS: Record<
// //   (typeof ASSIGNMENT_STATUS_TONE)[ReportAssignmentStatus],
// //   { row: string; pill: string; icon: string }
// // > = {
// //   slate: {
// //     row: 'border-border bg-muted/20',
// //     pill: 'bg-slate-100 text-slate-700 ring-slate-200',
// //     icon: 'text-slate-500',
// //   },
// //   red: {
// //     row: 'border-red-200/80 bg-red-50/50',
// //     pill: 'bg-red-100 text-red-800 ring-red-200',
// //     icon: 'text-red-600',
// //   },
// //   emerald: {
// //     row: 'border-emerald-200/80 bg-emerald-50/40',
// //     pill: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
// //     icon: 'text-emerald-600',
// //   },
// //   blue: {
// //     row: 'border-blue-200/80 bg-blue-50/40',
// //     pill: 'bg-blue-100 text-blue-800 ring-blue-200',
// //     icon: 'text-blue-600',
// //   },
// // };

// // function StatusIcon({ status }: { status: ReportAssignmentStatus }) {
// //   const className = 'size-4';
// //   if (status === 'Declined') return <XCircle className={className} />;
// //   if (status === 'InProgress') return <PlayCircle className={className} />;
// //   if (status === 'Completed') return <CheckCircle2 className={className} />;
// //   return <Clock className={className} />;
// // }

// // interface ReportAssignmentPanelProps {
// //   detail: ReportDetail;
// //   onGoToAssign: () => void;
// // }

// // export function ReportAssignmentPanel({ detail, onGoToAssign }: ReportAssignmentPanelProps) {
// //   const [reassignTarget, setReassignTarget] = useState<ReportAssignment | null>(null);

// //   const sorted = useMemo(
// //     () => sortAssignmentsNewestFirst(detail.assignments),
// //     [detail.assignments]
// //   );
// //   const summary = useMemo(() => summarizeAssignments(detail.assignments), [detail.assignments]);
// //   const showNewAssignBanner = needsNewAssignment(detail);

// //   const { data: oldTeamDetail } = useTeamDetail(reassignTarget?.teamId ?? null);

// //   if (detail.assignments.length === 0) {
// //     return (
// //       <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
// //         <h2 className="text-lg font-semibold text-foreground">Phân công đội</h2>
// //         <p className="mt-2 text-sm text-muted-foreground">
// //           Chưa có đội nào được gán cho báo cáo này.
// //         </p>
// //       </div>
// //     );
// //   }

// //   return<></>
// // }
