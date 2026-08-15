'use client';

import {
  ReportImagePreviewDialog,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRecordInspectionPayment } from '@/hooks/useOfficer';
import { createIdempotencyKey, extractApiErrorCode, isAxiosError } from '@/lib/api/core';
import { toastApiError } from '@/lib/api/toast';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { vi as dateFnsVi } from 'date-fns/locale';
import { Banknote, Calendar as CalendarIcon, CloudUpload, Eye, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { vi as dayPickerVi } from 'react-day-picker/locale';
import { toast } from 'sonner';
import { z } from 'zod';

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

const schema = z.object({
  paidAt: z.string().trim().min(1, 'Vui lòng chọn ngày nộp'),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
  receipt: z
    .instanceof(File, { message: 'Vui lòng chọn ảnh biên lai' })
    .refine(f => f.size <= MAX_RECEIPT_BYTES, 'Ảnh biên lai tối đa 10MB')
    .refine(f => f.type.startsWith('image/'), 'Chỉ chấp nhận tệp ảnh'),
});

type FormValues = z.infer<typeof schema>;

function todayDateInputValue(): string {
  return formatLocalYmd(new Date());
}

function formatLocalYmd(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseLocalYmd(ymd: string): Date | undefined {
  const [year, month, day] = ymd.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

/**
 * `YYYY-MM-DD` → ISO theo giờ địa phương (tránh lệch ngày khi parse UTC).
 */
function toPaidAtIso(dateInputValue: string): string {
  const [year, month, day] = dateInputValue.split('-').map(Number);
  if (!year || !month || !day) return new Date(dateInputValue).toISOString();
  const now = new Date();
  return new Date(
    year,
    month - 1,
    day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  ).toISOString();
}

function pickReceiptFile(list: FileList | null | undefined): File | undefined {
  const file = list?.[0];
  if (!file) return undefined;
  if (!file.type.startsWith('image/')) {
    toast.error('Chỉ chấp nhận tệp ảnh biên lai.');
    return undefined;
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    toast.error('Ảnh biên lai tối đa 10MB.');
    return undefined;
  }
  return file;
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
  const [dateOpen, setDateOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const hasValidAmount = typeof remainingAmount === 'number' && remainingAmount > 0;
  /**
   * Giữ nguyên qua các lần retry trong cùng một lần mở dialog — nếu request đầu đã tới BE
   * (timeout phía client, hoặc 401-refresh replay), lần gửi lại cùng key sẽ không ghi phạt 2 lần.
   * Reset khi đóng/mở lại dialog vì đó là một lần nộp phạt mới.
   */
  const idempotencyKeyRef = useRef<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    resetField,
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!(receiptFile instanceof File)) {
      setPreviewUrl(null);
      setLightboxIndex(null);
      return;
    }
    const url = URL.createObjectURL(receiptFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [receiptFile]);

  const lightboxImages = useMemo((): ReportPreviewImage[] => {
    if (!previewUrl || !(receiptFile instanceof File)) return [];
    return [{ url: previewUrl, label: receiptFile.name || 'Ảnh biên lai' }];
  }, [previewUrl, receiptFile]);

  useEffect(() => {
    if (!open) {
      idempotencyKeyRef.current = null;
      setDateOpen(false);
      setIsDragging(false);
      setLightboxIndex(null);
      return;
    }
    idempotencyKeyRef.current = createIdempotencyKey();
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
          paidAt: toPaidAtIso(values.paidAt),
          receipt: values.receipt,
          note: values.note?.trim() || undefined,
          idempotencyKey: idempotencyKeyRef.current ?? undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã ghi nhận nộp phạt đủ và đóng hồ sơ.');
          onOpenChange(false);
        },
        onError: err => {
          // 409 CONCURRENCY_CONFLICT / timeout: thao tác CÓ THỂ đã được BE ghi nhận.
          // Đóng dialog + refetch để LEO thấy trạng thái thật, thay vì mời bấm lại
          // (endpoint tạo PenaltyPayment mới mỗi lần → retry mù dễ ghi trùng).
          const isConflict =
            extractApiErrorCode(err) === 'CONCURRENCY_CONFLICT' ||
            (isAxiosError(err) && err.response?.status === 409);
          const isTimeout = isAxiosError(err) && err.code === 'ECONNABORTED';

          // useRecordInspectionPayment invalidate ở onSettled → hồ sơ tự refetch sau khi lỗi.
          if (isConflict || isTimeout) {
            onOpenChange(false);
            toast.warning(
              'Không xác nhận được kết quả. Hồ sơ đang được tải lại — vui lòng kiểm tra trạng thái trước khi ghi nhận lại.'
            );
            return;
          }

          toastApiError(err, 'Không thể ghi nhận nộp phạt. Vui lòng thử lại.');
        },
      }
    );
  });

  return (
    <>
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
                  <Controller
                    name="paidAt"
                    control={control}
                    render={({ field }) => {
                      const selected = field.value ? parseLocalYmd(field.value) : undefined;
                      return (
                        <Popover modal open={dateOpen} onOpenChange={setDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              id="record-payment-date"
                              type="button"
                              variant="outline"
                              disabled={isBusy}
                              className={cn(
                                'mt-2 h-10 w-full justify-start gap-2 font-normal',
                                !selected && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="size-4 shrink-0 opacity-60" aria-hidden />
                              {selected
                                ? format(selected, 'dd/MM/yyyy', { locale: dateFnsVi })
                                : 'Chọn ngày nộp'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              locale={dayPickerVi}
                              selected={selected}
                              defaultMonth={selected}
                              disabled={{ after: new Date() }}
                              onSelect={date => {
                                if (!date) return;
                                field.onChange(formatLocalYmd(date));
                                setDateOpen(false);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    }}
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
                    render={({ field }) => {
                      const clearReceipt = () => {
                        resetField('receipt');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      };

                      return (
                        <div className="mt-2">
                          <input
                            ref={fileInputRef}
                            id="record-payment-receipt"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={isBusy}
                            onChange={e => {
                              const file = pickReceiptFile(e.target.files);
                              if (file) field.onChange(file);
                            }}
                          />

                          {previewUrl && receiptFile instanceof File ? (
                            <div className="overflow-hidden rounded-lg border border-sky-200 bg-sky-50/50">
                              <button
                                type="button"
                                className="group relative mx-auto block h-24 w-full cursor-zoom-in bg-slate-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                                onClick={() => setLightboxIndex(0)}
                                aria-label="Xem ảnh biên lai phóng to"
                              >
                                <Image
                                  src={previewUrl}
                                  alt="Xem trước ảnh biên lai"
                                  fill
                                  unoptimized
                                  className="object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                                  sizes="360px"
                                />
                                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-linear-to-t from-black/45 to-transparent py-2 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                  <Eye className="size-3" aria-hidden />
                                  Nhấn để phóng to
                                </span>
                              </button>
                              <div className="flex items-center gap-2 border-t border-sky-100 px-2.5 py-1.5">
                                <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">
                                  {receiptFile.name}
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isBusy}
                                  className="h-7 shrink-0 px-2.5 text-[11px]"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  Đổi ảnh
                                </Button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                                  aria-label="Xóa ảnh biên lai"
                                  onClick={() => {
                                    setLightboxIndex(null);
                                    clearReceipt();
                                  }}
                                >
                                  <X className="size-3.5" aria-hidden />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              role="button"
                              tabIndex={0}
                              aria-label="Kéo thả hoặc chọn ảnh biên lai"
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  fileInputRef.current?.click();
                                }
                              }}
                              onDragEnter={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!isBusy) setIsDragging(true);
                              }}
                              onDragOver={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!isBusy) setIsDragging(true);
                              }}
                              onDragLeave={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDragging(false);
                              }}
                              onDrop={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDragging(false);
                                if (isBusy) return;
                                const file = pickReceiptFile(e.dataTransfer.files);
                                if (file) field.onChange(file);
                              }}
                              className={cn(
                                'flex h-[calc(6rem+2.375rem)] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 transition-colors',
                                isDragging
                                  ? 'border-sky-600 bg-sky-100/90'
                                  : 'border-sky-400/80 bg-sky-50/60 hover:border-sky-500 hover:bg-sky-50'
                              )}
                            >
                              <CloudUpload
                                className="size-6 text-sky-700"
                                strokeWidth={1.6}
                                aria-hidden
                              />
                              <p className="text-[11px] font-semibold text-sky-800">
                                Kéo và thả ảnh vào đây
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isBusy}
                                className="h-7 rounded-full bg-sky-700 px-3 text-[11px] text-white shadow-sm shadow-sky-700/20 hover:bg-sky-600"
                                onClick={e => {
                                  e.stopPropagation();
                                  fileInputRef.current?.click();
                                }}
                              >
                                Chọn tệp
                              </Button>
                              <p className="text-[10px] text-sky-600/80">JPG, PNG · tối đa 10MB</p>
                            </div>
                          )}
                        </div>
                      );
                    }}
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
                    disabled={isBusy}
                    className="mt-2 flex min-h-20 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
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

      <ReportImagePreviewDialog
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />
    </>
  );
}
