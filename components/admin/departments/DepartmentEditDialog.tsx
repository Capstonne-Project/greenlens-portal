'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { ValidatedInput } from '@/components/common/ValidatedField';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useUpdateDepartment } from '@/hooks/useDepartments';
import type { DepartmentListItem } from '@/lib/api/models/department';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import { getDepartmentMutationError } from '@/utils/departmentErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên ủy ban').max(200, 'Tối đa 200 ký tự'),
});

type FormValues = z.infer<typeof schema>;

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
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    ...REALTIME_FORM_OPTIONS,
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
            <ValidatedInput
              id="dept-edit-name"
              {...register('name')}
              value={watch('name') ?? ''}
              minLength={1}
              maxLength={200}
              error={errors.name?.message}
              disabled={updateMutation.isPending}
            />
          </div>
          <AdminDialogFooter
            onCancel={onClose}
            confirmType="submit"
            confirmLabel="Lưu"
            confirmLoading={updateMutation.isPending}
            cancelDisabled={updateMutation.isPending}
            confirmDisabled={updateMutation.isPending}
            className="border-t border-border pt-4"
          />
        </form>
      ) : null}
    </OfficeDialogShell>
  );
}
