'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useUpdateDepartment } from '@/hooks/useDepartments';
import type { DepartmentListItem } from '@/lib/api/models/department';
import { getDepartmentMutationError } from '@/utils/departmentErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên ủy ban').max(200, 'Tối đa 200 ký tự'),
});

type FormValues = z.infer<typeof schema>;

const fieldClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

interface DepartmentEditDialogProps {
  open: boolean;
  department: DepartmentListItem | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function DepartmentEditDialog({
  open,
  department,
  onClose,
  onSaved,
}: DepartmentEditDialogProps) {
  const updateMutation = useUpdateDepartment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!open || !department) return;
    reset({ name: department.name });
  }, [open, department, reset]);

  const onSubmit = handleSubmit(values => {
    if (!department) return;
    updateMutation.mutate(
      { id: department.id, body: { name: values.name.trim() } },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật ủy ban.');
          onSaved?.();
          onClose();
        },
        onError: err => toast.error(getDepartmentMutationError(err, 'Không thể cập nhật ủy ban.')),
      }
    );
  });

  return (
    <OfficeDialogShell
      open={open}
      title="Sửa ủy ban (Sở)"
      titleId="department-edit-title"
      onClose={onClose}
      size="md"
    >
      {department ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tỉnh: <strong className="text-foreground">{department.provinceName}</strong> (mã{' '}
            {department.provinceCode})
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="dept-edit-name">
              Tên ủy ban
            </label>
            <input
              id="dept-edit-name"
              {...register('name')}
              className={fieldClass}
              disabled={updateMutation.isPending}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Lưu
            </button>
          </div>
        </form>
      ) : null}
    </OfficeDialogShell>
  );
}
