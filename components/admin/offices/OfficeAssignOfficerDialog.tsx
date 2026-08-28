'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { LeoUserPicker } from '@/components/admin/offices/LeoUserPicker';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useAssignOfficeOfficer } from '@/hooks/useOffices';
import type { OfficeListItem } from '@/lib/api/models/office';
import type { AdminUser } from '@/lib/api/models/adminUser';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
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
      { id: office.id, body: { userId: selectedUser.id } },
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
          <AdminDialogFooter
            onCancel={handleClose}
            onConfirm={handleAssign}
            confirmLabel="Gán LEO"
            confirmLoading={assignOfficer.isPending}
            confirmDisabled={assignOfficer.isPending || !selectedUser}
            className="pt-2"
          />
        </div>
      )}
    </OfficeDialogShell>
  );
}
