'use client';

import { SearchableSelect } from '@/components/common/SearchableSelect';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useCatalogProvinces, useCreateDepartment } from '@/hooks/useDepartments';
import { getDepartmentMutationError } from '@/utils/departmentErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên ủy ban').max(200, 'Tối đa 200 ký tự'),
  provinceCode: z.string().min(1, 'Vui lòng chọn tỉnh/thành'),
});

type FormValues = z.infer<typeof schema>;

const fieldClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

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
            <input
              id="dept-name"
              {...register('name')}
              placeholder="Ủy ban nhân dân TP HCM"
              className={fieldClass}
              disabled={createMutation.isPending}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
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
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Tạo ủy ban
          </button>
        </div>
      </form>
    </OfficeDialogShell>
  );
}
