'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRenewCompanyContract } from '@/hooks/useCompany';
import { getCompanyMutationError } from '@/utils/companyErrors';

const renewSchema = z
  .object({
    newContractNumber: z
      .string()
      .min(1, 'Vui lòng nhập số hợp đồng mới')
      .max(100, 'Tối đa 100 ký tự'),
    newStartDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
    newEndDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
    note: z.string().max(500, 'Tối đa 500 ký tự'),
  })
  .superRefine((data, ctx) => {
    if (data.newStartDate && data.newEndDate && data.newEndDate < data.newStartDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
        path: ['newEndDate'],
      });
    }
  });

type RenewFormValues = z.infer<typeof renewSchema>;

function dateInputToIso(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

export interface CompanyRenewContractTarget {
  id: string;
  name: string;
  contractNumber: string;
  taxCode?: string;
}

interface CompanyRenewContractDialogProps {
  open: boolean;
  company: CompanyRenewContractTarget | null;
  onClose: () => void;
  onRenewed?: () => void;
}

export function CompanyRenewContractDialog({
  open,
  company,
  onClose,
  onRenewed,
}: CompanyRenewContractDialogProps) {
  const renewMutation = useRenewCompanyContract();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RenewFormValues>({
    resolver: zodResolver(renewSchema),
    defaultValues: {
      newContractNumber: '',
      newStartDate: '',
      newEndDate: '',
      note: '',
    },
  });

  const resetForm = () => {
    reset({
      newContractNumber: '',
      newStartDate: '',
      newEndDate: '',
      note: '',
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (renewMutation.isPending) return;
    if (!nextOpen) {
      resetForm();
      onClose();
    }
  };

  const onSubmit = handleSubmit(values => {
    if (!company) return;

    renewMutation.mutate(
      {
        id: company.id,
        body: {
          newContractNumber: values.newContractNumber.trim(),
          newStartDate: dateInputToIso(values.newStartDate),
          newEndDate: dateInputToIso(values.newEndDate),
          note: values.note.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã gia hạn hợp đồng. Doanh nghiệp được kích hoạt lại.');
          resetForm();
          onClose();
          window.setTimeout(() => onRenewed?.(), 0);
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể gia hạn hợp đồng.')),
      }
    );
  });

  const isPending = renewMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        key={company?.id ?? 'renew-dialog'}
        className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-xl"
      >
        <DialogHeader className="space-y-3 border-b border-slate-100 p-6 pb-4 text-left">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-100"
              aria-hidden
            >
              <RefreshCw className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-left text-lg leading-snug">Gia hạn hợp đồng</DialogTitle>
              <DialogDescription className="mt-0.5 text-left text-sm">
                Tạo kỳ hợp đồng mới cho doanh nghiệp hết hạn (đấu thầu).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {company ? (
          <form onSubmit={onSubmit} className="space-y-4 p-6 pt-4">
            <div className="rounded-lg border border-rose-100 bg-rose-50/50 px-3.5 py-3">
              <p className="truncate text-sm font-semibold text-slate-900" title={company.name}>
                {company.name}
              </p>
              <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                <div className="flex min-w-0 gap-1">
                  <dt className="shrink-0">HĐ hiện tại</dt>
                  <dd className="truncate font-medium text-slate-700">{company.contractNumber}</dd>
                </div>
                {company.taxCode ? (
                  <div className="flex min-w-0 gap-1">
                    <dt className="shrink-0">MST</dt>
                    <dd className="truncate font-medium text-slate-700">{company.taxCode}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="renew-contract-number" className="text-sm font-medium text-slate-800">
                Số hợp đồng mới <span className="text-destructive">*</span>
              </Label>
              <Input
                id="renew-contract-number"
                className="h-10"
                placeholder="VD: HD-2026-042"
                disabled={isPending}
                {...register('newContractNumber')}
              />
              {errors.newContractNumber ? (
                <p className="text-xs text-destructive">{errors.newContractNumber.message}</p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="renew-start" className="text-sm font-medium text-slate-800">
                  Ngày bắt đầu <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="renew-start"
                  type="date"
                  className="h-10"
                  disabled={isPending}
                  {...register('newStartDate')}
                />
                {errors.newStartDate ? (
                  <p className="text-xs text-destructive">{errors.newStartDate.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="renew-end" className="text-sm font-medium text-slate-800">
                  Ngày kết thúc <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="renew-end"
                  type="date"
                  className="h-10"
                  disabled={isPending}
                  {...register('newEndDate')}
                />
                {errors.newEndDate ? (
                  <p className="text-xs text-destructive">{errors.newEndDate.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="renew-note" className="text-sm font-medium text-slate-800">
                Ghi chú
              </Label>
              <textarea
                id="renew-note"
                rows={3}
                disabled={isPending}
                placeholder="Lý do gia hạn, số quyết định, ghi chú nội bộ…"
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:opacity-60"
                {...register('note')}
              />
              {errors.note ? (
                <p className="text-xs text-destructive">{errors.note.message}</p>
              ) : (
                <p className="text-xs text-slate-500">Không bắt buộc · tối đa 500 ký tự</p>
              )}
            </div>

            <DialogFooter className="-mx-6 -mb-6 mt-2 border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                className="border-slate-200 bg-white"
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="gap-1.5 bg-rose-700 text-white hover:bg-rose-600"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Đang gia hạn…
                  </>
                ) : (
                  'Xác nhận gia hạn'
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <DialogDescription className="sr-only">Chọn doanh nghiệp để gia hạn.</DialogDescription>
        )}
      </DialogContent>
    </Dialog>
  );
}
