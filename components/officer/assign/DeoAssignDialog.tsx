'use client';

import { useDispatchReport } from '@/hooks/useOfficer';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { AssignOfficeDialog } from './AssignOfficeDialog';

interface DeoAssignDialogProps {
  open: boolean;
  onClose: () => void;
  reportIds: string[];
  onAssigned?: () => void;
}

/** DEO phân công đơn vị xử lý — Verified → Dispatched (POST /reports/{id}/dispatch). */
export function DeoAssignDialog({ open, onClose, reportIds, onAssigned }: DeoAssignDialogProps) {
  const dispatchMutation = useDispatchReport();

  const handleSubmit = async (targetLocalOfficeIds: string[], note: string) => {
    const body = { targetLocalOfficeIds, ...(note ? { note } : {}) };
    try {
      const responses = await Promise.all(
        reportIds.map(reportId => dispatchMutation.mutateAsync({ reportId, body }))
      );
      // Adapter trả `ApiEnvelope<string>` cho dispatch → ưu tiên message từ BE.
      toastApiSuccess(
        responses[responses.length - 1],
        reportIds.length === 1
          ? 'Đã điều phối báo cáo xuống đơn vị xử lý.'
          : `Đã điều phối ${reportIds.length} báo cáo xuống đơn vị xử lý.`
      );
      onAssigned?.();
      onClose();
    } catch (err) {
      toastApiError(err, 'Không thể điều phối báo cáo. Vui lòng thử lại.');
    }
  };

  return (
    <AssignOfficeDialog
      open={open}
      onClose={onClose}
      reportCount={reportIds.length}
      onSubmit={handleSubmit}
      submitting={dispatchMutation.isPending}
    />
  );
}
