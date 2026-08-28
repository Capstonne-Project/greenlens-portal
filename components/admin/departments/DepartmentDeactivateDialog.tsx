'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useDeactivateDepartment } from '@/hooks/useDepartments';
import type { DepartmentListItem } from '@/lib/api/models/department';
import { getDepartmentMutationError } from '@/utils/departmentErrors';
import { toast } from 'sonner';

interface DepartmentDeactivateDialogProps {
  department: DepartmentListItem | null;
  onClose: () => void;
  onDeactivated?: () => void;
}

export function DepartmentDeactivateDialog({
  department,
  onClose,
  onDeactivated,
}: DepartmentDeactivateDialogProps) {
  const deactivateMutation = useDeactivateDepartment();

  const onConfirm = () => {
    if (!department) return;
    deactivateMutation.mutate(department.id, {
      onSuccess: () => {
        toast.success('Đã vô hiệu hóa ủy ban.');
        onDeactivated?.();
        onClose();
      },
      onError: err => {
        toast.error(getDepartmentMutationError(err, 'Không thể vô hiệu hóa.'));
      },
    });
  };

  return (
    <OfficeDialogShell
      open={department != null}
      title="Vô hiệu hóa ủy ban"
      titleId="admin-department-deactivate-title"
      onClose={onClose}
    >
      {department && (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Bạn có chắc muốn vô hiệu hóa{' '}
            <span className="font-semibold text-foreground">{department.name}</span>? Các văn phòng
            trực thuộc vẫn được giữ trong hệ thống.
          </p>
          <AdminDialogFooter
            onCancel={onClose}
            onConfirm={onConfirm}
            confirmLabel="Vô hiệu hóa"
            confirmLoading={deactivateMutation.isPending}
            cancelDisabled={deactivateMutation.isPending}
            confirmDisabled={deactivateMutation.isPending}
            confirmVariant="destructive"
          />
        </div>
      )}
    </OfficeDialogShell>
  );
}
