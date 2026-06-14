'use client';

import { useAssignReport } from '@/hooks/useOfficer';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { AssignTeamDialog } from './AssignTeamDialog';

interface LeoAssignDialogProps {
  open: boolean;
  onClose: () => void;
  reportIds: string[];
  onAssigned?: () => void;
}

/** LEO phân công đội xử lý — Dispatched → Assigned (POST /reports/{id}/assign). */
export function LeoAssignDialog({ open, onClose, reportIds, onAssigned }: LeoAssignDialogProps) {
  const assignMutation = useAssignReport();

  const handleSubmit = async (teamIds: string[], note: string) => {
    const body = {
      teams: teamIds.map(teamId => ({ teamId, ...(note ? { note } : {}) })),
    };
    try {
      await Promise.all(reportIds.map(reportId => assignMutation.mutateAsync({ reportId, body })));
      toastApiSuccess(
        null,
        reportIds.length === 1
          ? 'Đã phân công đội xử lý cho báo cáo.'
          : `Đã phân công đội xử lý cho ${reportIds.length} báo cáo.`
      );
      onAssigned?.();
      onClose();
    } catch (err) {
      toastApiError(err, 'Không thể phân công đội xử lý. Vui lòng thử lại.');
    }
  };

  return (
    <AssignTeamDialog
      open={open}
      onClose={onClose}
      reportCount={reportIds.length}
      onSubmit={handleSubmit}
      submitting={assignMutation.isPending}
    />
  );
}
