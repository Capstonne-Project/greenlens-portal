'use client';

import { LeoUserPicker } from '@/components/admin/offices/LeoUserPicker';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useAssignOfficeOfficer } from '@/hooks/useOffices';
import type { OfficeListItem } from '@/lib/api/models/office';
import type { AdminUser } from '@/lib/api/models/adminUser';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface OfficeAssignOfficerDialogProps {
  open: boolean;
  office: OfficeListItem | null;
  onClose: () => void;
  onAssigned?: () => void;
}

export function OfficeAssignOfficerDialog({
  open,
  office,
  onClose,
  onAssigned,
}: OfficeAssignOfficerDialogProps) {
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const assignOfficer = useAssignOfficeOfficer();

  const handleClose = () => {
    setUserSearch('');
    setSelectedUser(null);
    onClose();
  };

  const handleAssign = () => {
    if (!office) return;
    if (!selectedUser) {
      toast.error('Chọn LEO chưa được gán văn phòng.');
      return;
    }

    assignOfficer.mutate(
      { officeId: office.id, body: { userId: selectedUser.id } },
      {
        onSuccess: () => {
          toast.success('Đã gán LEO phụ trách văn phòng.');
          onAssigned?.();
          handleClose();
        },
        onError: err =>
          toast.error(getAdminUserMutationError(err, 'Không thể gán cán bộ. User cần role LEO.')),
      }
    );
  };

  return (
    <OfficeDialogShell
      open={open}
      title="Phân công LEO"
      titleId="office-assign-title"
      onClose={handleClose}
      wide
    >
      {office && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Văn phòng: <strong>{office.name}</strong>
            {office.officerName && (
              <>
                {' '}
                · LEO hiện tại: <strong>{office.officerName}</strong>
              </>
            )}
          </p>
          <LeoUserPicker
            enabled={open}
            search={userSearch}
            onSearchChange={setUserSearch}
            selectedUser={selectedUser}
            onSelect={setSelectedUser}
            inputId="office-assign-leo-search"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={assignOfficer.isPending || !selectedUser}
              onClick={handleAssign}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {assignOfficer.isPending && <Loader2 className="size-4 animate-spin" />}
              Gán LEO
            </button>
          </div>
        </div>
      )}
    </OfficeDialogShell>
  );
}
