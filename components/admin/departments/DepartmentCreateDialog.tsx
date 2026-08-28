'use client';

import { AdminDialogFooter } from '@/components/admin/shared/AdminDialogFooter';
import { ValidatedInput } from '@/components/common/ValidatedField';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useCatalogProvinces, useCreateDepartment } from '@/hooks/useDepartments';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import { getDepartmentMutationError } from '@/utils/departmentErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên ủy ban').max(200, 'Tối đa 200 ký tự'),
  provinceCode: z.string().min(1, 'Vui lòng chọn tỉnh/thành'),
});

type FormValues = z.infer<typeof schema>;

interface DepartmentCreateDialogProps {
  open: boolean;
  takenProvinceCodes?: string[];
  onClose: () => void;
  onCreated?: () => void;
}

export function DepartmentCreateDialog({
  open,
  takenProvinceCodes = [],
  onClose,
  onCreated,
}: DepartmentCreateDialogProps) {
  const { data: provinces, isPending: provincesPending } = useCatalogProvinces(open);
  const createMutation = useCreateDepartment();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    ...REALTIME_FORM_OPTIONS,
    defaultValues: { name: '', provinceCode: '' },
  });

  const provinceCode = watch('provinceCode');

  const provinceOptions = useMemo(() => {
    const taken = new Set(takenProvinceCodes);
    return (provinces ?? [])
      .filter(p => !taken.has(p.code))
      .map(p => ({
        value: p.code,
        label: p.name,
        keywords: p.code,
      }));
  }, [provinces, takenProvinceCodes]);

  useEffect(() => {
    if (!open) return;
    reset({ name: '', provinceCode: '' });
  }, [open, reset]);

  const onSubmit = handleSubmit(values => {
    createMutation.mutate(
      { name: values.name.trim(), provinceCode: values.provinceCode.trim() },
      {
        onSuccess: () => {
          toast.success('Đã tạo ủy ban (Sở).');
          onCreated?.();
          onClose();
        },
        onError: err => toast.error(getDepartmentMutationError(err, 'Không thể tạo ủy ban.')),
      }
    );
  });

  return (
    <OfficeDialogShell
      open={open}
      title="Tạo ủy ban (Sở)"
      titleId="department-create-title"
      onClose={onClose}
      size="wide"
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Mỗi tỉnh/thành chỉ có một ủy ban (Sở TNMT). Chọn tỉnh chưa có trong hệ thống.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="dept-name">
              Tên ủy ban / Sở
            </label>
            <ValidatedInput
              id="dept-name"
              {...register('name')}
              value={watch('name') ?? ''}
              minLength={1}
              maxLength={200}
              error={errors.name?.message}
              placeholder="Ủy ban nhân dân TP HCM"
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Tỉnh / Thành phố</label>
            <SearchableSelect
              id="dept-province"
              options={provinceOptions}
              value={provinceCode}
              onChange={v => setValue('provinceCode', v, { shouldValidate: true })}
              placeholder="— Chọn tỉnh/thành —"
              searchPlaceholder="Tìm tên hoặc mã tỉnh…"
              loading={provincesPending}
              disabled={provincesPending || createMutation.isPending}
              emptyMessage={
                provinceOptions.length === 0
                  ? 'Tất cả tỉnh đã có ủy ban.'
                  : 'Không có tỉnh phù hợp.'
              }
            />
            {errors.provinceCode ? (
              <p className="text-xs text-destructive">{errors.provinceCode.message}</p>
            ) : null}
          </div>
        </div>
        <AdminDialogFooter
          onCancel={onClose}
          confirmType="submit"
          confirmLabel="Tạo ủy ban"
          confirmLoading={createMutation.isPending}
          cancelDisabled={createMutation.isPending}
          confirmDisabled={createMutation.isPending}
          className="border-t border-border pt-4"
        />
      </form>
    </OfficeDialogShell>
  );
}
