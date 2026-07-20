'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import type { NotificationTemplateWriteInput } from '@/lib/api/models/notificationTemplate';
import {
  NOTIFICATION_TEMPLATE_CHANNELS,
  NOTIFICATION_TEMPLATE_TYPES,
  notificationChannelLabel,
  notificationTypeLabel,
} from '@/lib/constants/notificationTemplates';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  templateKey: z
    .string()
    .trim()
    .min(2, 'Template key tối thiểu 2 ký tự')
    .max(100, 'Template key tối đa 100 ký tự')
    .regex(/^[a-z0-9_]+$/, 'Chỉ dùng chữ thường, số và gạch dưới'),
  titleVi: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tiêu đề tiếng Việt')
    .max(200, 'Tối đa 200 ký tự'),
  bodyVi: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập nội dung tiếng Việt')
    .max(2000, 'Tối đa 2000 ký tự'),
  titleEn: z.string().trim().min(1, 'Vui lòng nhập tiêu đề tiếng Anh').max(200, 'Tối đa 200 ký tự'),
  bodyEn: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập nội dung tiếng Anh')
    .max(2000, 'Tối đa 2000 ký tự'),
  channel: z.enum(['Push', 'Email', 'Both'], { error: 'Chọn kênh gửi' }),
  type: z.enum(NOTIFICATION_TEMPLATE_TYPES, { error: 'Chọn loại thông báo' }),
});

export type NotificationTemplateFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: NotificationTemplateWriteInput | null;
  busy?: boolean;
  loadingDetail?: boolean;
  detailError?: string | null;
  onClose: () => void;
  onSubmit: (values: NotificationTemplateWriteInput) => void;
  onRetryDetail?: () => void;
}

const fieldClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

const textareaClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

const emptyDefaults: NotificationTemplateFormValues = {
  templateKey: '',
  titleVi: '',
  bodyVi: '',
  titleEn: '',
  bodyEn: '',
  channel: 'Both',
  type: 'ReportStatusChanged',
};

export function NotificationTemplateFormDialog({
  open,
  mode,
  initial,
  busy,
  loadingDetail,
  detailError,
  onClose,
  onSubmit,
  onRetryDetail,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NotificationTemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'create') {
      reset(emptyDefaults);
      return;
    }
    if (initial) {
      const typeValue = NOTIFICATION_TEMPLATE_TYPES.includes(
        initial.type as (typeof NOTIFICATION_TEMPLATE_TYPES)[number]
      )
        ? (initial.type as (typeof NOTIFICATION_TEMPLATE_TYPES)[number])
        : 'ReportStatusChanged';
      reset({
        templateKey: initial.templateKey,
        titleVi: initial.titleVi,
        bodyVi: initial.bodyVi,
        titleEn: initial.titleEn,
        bodyEn: initial.bodyEn,
        channel: (NOTIFICATION_TEMPLATE_CHANNELS.includes(
          initial.channel as (typeof NOTIFICATION_TEMPLATE_CHANNELS)[number]
        )
          ? initial.channel
          : 'Both') as NotificationTemplateFormValues['channel'],
        type: typeValue,
      });
    }
  }, [initial, mode, open, reset]);

  const title = mode === 'create' ? 'Tạo mẫu thông báo' : 'Cập nhật mẫu thông báo';
  const showForm = mode === 'create' || (Boolean(initial) && !loadingDetail && !detailError);

  return (
    <OfficeDialogShell
      open={open}
      title={title}
      titleId="notification-template-form-title"
      onClose={onClose}
      size="wide"
    >
      {mode === 'edit' && loadingDetail ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Đang tải chi tiết template…
        </div>
      ) : null}

      {mode === 'edit' && detailError ? (
        <div className="space-y-3 py-6 text-center">
          <p className="text-sm text-destructive">{detailError}</p>
          <p className="text-xs text-muted-foreground">
            API chi tiết có thể đang lỗi phía máy chủ. Thử lại hoặc sửa khi BE ổn định.
          </p>
          {onRetryDetail ? (
            <button
              type="button"
              onClick={onRetryDetail}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Thử lại
            </button>
          ) : null}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleSubmit(values => onSubmit(values))}
          className="space-y-4"
          key={mode === 'edit' ? (initial?.templateKey ?? 'edit') : 'create'}
        >
          {mode === 'edit' ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Sau khi lưu, hệ thống tự chuyển template về trạng thái nháp (chưa publish).
            </p>
          ) : (
            <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Template mới tạo ở trạng thái nháp — cần Publish trước khi hệ thống sử dụng.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="nt-key" className="mb-1.5 block text-sm font-medium">
                Template key <span className="text-destructive">*</span>
              </label>
              <input
                id="nt-key"
                className={fieldClass}
                placeholder="badge_earned_test"
                disabled={mode === 'edit'}
                {...register('templateKey')}
              />
              {errors.templateKey ? (
                <p className="mt-1 text-xs text-destructive">{errors.templateKey.message}</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  snake_case, duy nhất trong hệ thống.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="nt-channel" className="mb-1.5 block text-sm font-medium">
                Kênh <span className="text-destructive">*</span>
              </label>
              <select id="nt-channel" className={fieldClass} {...register('channel')}>
                {NOTIFICATION_TEMPLATE_CHANNELS.map(ch => (
                  <option key={ch} value={ch}>
                    {notificationChannelLabel(ch)}
                  </option>
                ))}
              </select>
              {errors.channel ? (
                <p className="mt-1 text-xs text-destructive">{errors.channel.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="nt-type" className="mb-1.5 block text-sm font-medium">
                Loại <span className="text-destructive">*</span>
              </label>
              <select id="nt-type" className={fieldClass} {...register('type')}>
                {NOTIFICATION_TEMPLATE_TYPES.map(t => (
                  <option key={t} value={t}>
                    {notificationTypeLabel(t)}
                  </option>
                ))}
              </select>
              {errors.type ? (
                <p className="mt-1 text-xs text-destructive">{errors.type.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="nt-title-vi" className="mb-1.5 block text-sm font-medium">
              Tiêu đề (VI) <span className="text-destructive">*</span>
            </label>
            <input id="nt-title-vi" className={fieldClass} {...register('titleVi')} />
            {errors.titleVi ? (
              <p className="mt-1 text-xs text-destructive">{errors.titleVi.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="nt-body-vi" className="mb-1.5 block text-sm font-medium">
              Nội dung (VI) <span className="text-destructive">*</span>
            </label>
            <textarea id="nt-body-vi" rows={3} className={textareaClass} {...register('bodyVi')} />
            {errors.bodyVi ? (
              <p className="mt-1 text-xs text-destructive">{errors.bodyVi.message}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Hỗ trợ placeholder dạng {'{{BadgeName}}'}.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="nt-title-en" className="mb-1.5 block text-sm font-medium">
              Tiêu đề (EN) <span className="text-destructive">*</span>
            </label>
            <input id="nt-title-en" className={fieldClass} {...register('titleEn')} />
            {errors.titleEn ? (
              <p className="mt-1 text-xs text-destructive">{errors.titleEn.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="nt-body-en" className="mb-1.5 block text-sm font-medium">
              Nội dung (EN) <span className="text-destructive">*</span>
            </label>
            <textarea id="nt-body-en" rows={3} className={textareaClass} {...register('bodyEn')} />
            {errors.bodyEn ? (
              <p className="mt-1 text-xs text-destructive">{errors.bodyEn.message}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {mode === 'create' ? 'Tạo nháp' : 'Lưu'}
            </button>
          </div>
        </form>
      ) : null}
    </OfficeDialogShell>
  );
}
