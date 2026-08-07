'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRecordInspectionPayment } from '@/hooks/useOfficer';
import { toastApiError } from '@/lib/api/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, Loader2, Receipt } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

const schema = z.object({
  paidAt: z.string().trim().min(1, 'Vui lòng chọn ngày nộp'),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
  receipt: z
    .instanceof(File, { message: 'Vui lòng chọn ảnh biên lai' })
    .refine(f => f.size <= MAX_RECEIPT_BYTES, 'Ảnh biên lai tối đa 10MB'),
});

type FormValues = z.infer<typeof schema>;

function todayDateInputValue(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  inspectionId,
  remainingAmount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionId: string;
  /** Số tiền còn thiếu — nộp 1 lần duy nhất và đủ, không cho sửa/chia nhỏ. */
  remainingAmount?: number | null;
}) {
  const recordMutation = useRecordInspectionPayment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasValidAmount = typeof remainingAmount === 'number' && remainingAmount > 0;

  const {
    control,
    handleSubmit,
    reset,
    register,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paidAt: todayDateInputValue(),
      note: '',
    },
  });

  const receiptFile = watch('receipt');

  useEffect(() => {
    if (!open) return;
    reset({
      paidAt: todayDateInputValue(),
      note: '',
      receipt: undefined,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [open, reset]);

  const isBusy = recordMutation.isPending;

  const onSubmit = handleSubmit(values => {
    if (typeof remainingAmount !== 'number' || remainingAmount <= 0) return;

    recordMutation.mutate(
      {
        inspectionId,
        body: {
          paidAmount: remainingAmount,
          paidAt: new Date(values.paidAt).toISOString(),
          receipt: values.receipt,
          note: values.note?.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã ghi nhận nộp phạt đủ và đóng hồ sơ.');
          onOpenChange(false);
        },
        onError: err => {
          toastApiError(err, 'Không thể ghi nhận nộp phạt. Vui lòng thử lại.');
        },
      }
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (isBusy) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col">
          <DialogHeader className="space-y-1.5 px-5 pt-4 pb-0 text-left">
            <DialogTitle className="flex items-center gap-2 pr-8 text-base font-semibold">
              <Banknote className="size-4 shrink-0 text-sky-700" aria-hidden />
              Ghi nhận nộp phạt
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-slate-500">
              Ghi nhận người vi phạm đã nộp phạt đủ một lần trực tiếp tại trụ sở. Cần đính kèm ảnh
              biên lai (BR-INS-020). Hồ sơ sẽ được đóng ngay sau khi xác nhận.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 pt-4 pb-4">
            <FieldGroup>
              <Field>
                <Label>Số tiền phải nộp (VND)</Label>
                <div className="mt-2 rounded-md border border-input bg-muted/40 px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-900">
                  {typeof remainingAmount === 'number' && remainingAmount > 0
                    ? formatVnd(remainingAmount)
                    : 'Không xác định'}
                </div>
                {!hasValidAmount ? (
                  <p className="mt-1.5 text-xs text-destructive">
                    Không tìm thấy số tiền phạt còn lại — vui lòng tải lại trang.
                  </p>
                ) : null}
              </Field>

              <Field>
                <Label htmlFor="record-payment-date">
                  Ngày nộp <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="record-payment-date"
                  type="date"
                  className="mt-2"
                  {...register('paidAt')}
                />
                <FieldError>{errors.paidAt?.message}</FieldError>
              </Field>

              <Field>
                <Label htmlFor="record-payment-receipt">
                  Ảnh biên lai <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="receipt"
                  control={control}
                  render={({ field }) => (
                    <div className="mt-2">
                      <input
                        ref={fileInputRef}
                        id="record-payment-receipt"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => field.onChange(e.target.files?.[0])}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center gap-2 rounded-md border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/50"
                      >
                        <Receipt className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">
                          {receiptFile ? receiptFile.name : 'Chọn ảnh biên lai...'}
                        </span>
                      </button>
                    </div>
                  )}
                />
                <FieldError>{errors.receipt?.message}</FieldError>
              </Field>

              <Field>
                <Label htmlFor="record-payment-note">Ghi chú</Label>
                <textarea
                  id="record-payment-note"
                  rows={3}
                  maxLength={500}
                  placeholder="Tuỳ chọn"
                  className="mt-2 flex min-h-[80px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('note')}
                />
                <FieldError>{errors.note?.message}</FieldError>
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter className="border-t border-border bg-muted/30 px-5 py-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => onOpenChange(false)}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={isBusy || !hasValidAmount}
              className="bg-sky-700 text-white hover:bg-sky-600"
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
                  Đang lưu...
                </>
              ) : (
                'Xác nhận & đóng hồ sơ'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
