'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useDeactivateDepartment } from '@/hooks/useDepartments';
import type { DepartmentListItem } from '@/lib/api/models/department';
import { getDepartmentMutationError } from '@/utils/departmentErrors';
import { Loader2 } from 'lucide-react';
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
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deactivateMutation.isPending}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deactivateMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
            >
              {deactivateMutation.isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Vô hiệu hóa
            </button>
          </div>
        </div>
      )}
    </OfficeDialogShell>
  );
}
