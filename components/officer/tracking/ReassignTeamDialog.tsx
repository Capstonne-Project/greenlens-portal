'use client';

/**
 * Thin wrapper — UI/API reassign dùng LeoAssignDialog (mode=reassign).
 * Giữ export để ReportsReportDetailClient / tracking không đổi import path.
 */

import {
  LeoAssignDialog,
  type LeoReassignTarget,
} from '@/components/officer/assign/LeoAssignDialog';

export type { LeoReassignTarget as ReassignTarget };

interface ReassignTeamDialogProps {
  open: boolean;
  onClose: () => void;
  reportId: string;
  reportCode: string;
  oldTeam: LeoReassignTarget;
  onSuccess?: () => void;
}

/** Dialog chuyển giao đội — PUT /v1/reports/{id}/reassign (reuse LeoAssignDialog). */
export function ReassignTeamDialog({
  open,
  onClose,
  reportId,
  reportCode,
  oldTeam,
  onSuccess,
}: ReassignTeamDialogProps) {
  return (
    <LeoAssignDialog
      open={open}
      onClose={onClose}
      reportIds={[reportId]}
      reportCode={reportCode}
      mode="reassign"
      oldTeam={oldTeam}
      onAssigned={onSuccess}
    />
  );
}
