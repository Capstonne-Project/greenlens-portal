'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { DeoUserPicker } from '@/components/admin/departments/DeoUserPicker';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useAssignDepartmentOfficer } from '@/hooks/useDepartments';
import type { DepartmentListItem } from '@/lib/api/models/department';
import type { AdminUser } from '@/lib/api/models/adminUser';
import { getDepartmentMutationError } from '@/utils/departmentErrors';
import { useState } from 'react';
import { toast } from 'sonner';

interface DepartmentAssignOfficerDialogProps {
  open: boolean;
  department: DepartmentListItem | null;
  onClose: () => void;
  onAssigned?: () => void;
}

export function DepartmentAssignOfficerDialog({
  open,
  department,
  onClose,
  onAssigned,
}: DepartmentAssignOfficerDialogProps) {
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const assignOfficer = useAssignDepartmentOfficer();

  const handleClose = () => {
    setUserSearch('');
    setSelectedUser(null);
    onClose();
  };

  const handleAssign = () => {
    if (!department) return;
    if (!selectedUser) {
      toast.error('Chọn DEO điều phối cho Sở.');
      return;
    }

    assignOfficer.mutate(
      { id: department.id, body: { userId: selectedUser.id } },
      {
        onSuccess: () => {
          toast.success('Đã gán DEO điều phối cho Sở TNMT.');
          onAssigned?.();
          handleClose();
        },
        onError: err =>
          toast.error(getDepartmentMutationError(err, 'Không thể gán DEO. User cần role DEO.')),
      }
    );
  };

  return (
    <OfficeDialogShell
      open={open}
      title="Gán DEO điều phối"
      titleId="department-assign-deo-title"
      onClose={handleClose}
      wide
    >
      {department && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sở TNMT: <strong>{department.name}</strong>
            {department.officerName && (
              <>
                {' '}
                · DEO hiện tại: <strong>{department.officerName}</strong>
              </>
            )}
          </p>
          <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            DEO sẽ tiếp nhận, xác minh và điều phối tất cả báo cáo trong tỉnh.
          </p>
          <DeoUserPicker
            enabled={open}
            search={userSearch}
            onSearchChange={setUserSearch}
            selectedUser={selectedUser}
            onSelect={setSelectedUser}
            inputId="department-assign-deo-search"
          />
          <AdminDialogFooter
            onCancel={handleClose}
            onConfirm={handleAssign}
            confirmLabel="Gán DEO"
            confirmLoading={assignOfficer.isPending}
            confirmDisabled={assignOfficer.isPending || !selectedUser}
            className="pt-2"
          />
        </div>
      )}
    </OfficeDialogShell>
  );
}
