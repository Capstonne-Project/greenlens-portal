'use client';

import { Bell, Mail } from 'lucide-react';
import { renderNotificationTemplatePreviewText } from '@/utils/notificationTemplateUi';

interface NotificationTemplatePreviewProps {
  channel: string;
  title: string;
  body: string;
}

export function NotificationTemplatePreview({
  channel,
  title,
  body,
}: NotificationTemplatePreviewProps) {
  const previewTitle = renderNotificationTemplatePreviewText(title) || 'Tiêu đề thông báo';
  const previewBody =
    renderNotificationTemplatePreviewText(body) || 'Nội dung sẽ hiển thị tại đây khi bạn nhập.';

  const showPush = channel === 'Push' || channel === 'Both';
  const showEmail = channel === 'Email' || channel === 'Both';

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Xem trước gửi đến người nhận
      </p>

      {showPush ? (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Thông báo trong app</p>

          <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Push / thanh thông báo
            </p>
            <div className="flex gap-2 rounded-lg bg-muted/50 p-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
                <Bell className="size-3.5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-800">GreenLens</p>
                <p className="text-xs font-semibold leading-snug text-foreground">{previewTitle}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {previewBody}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Hộp thông báo trong app
            </p>
            <div className="flex gap-2 rounded-lg bg-muted/40 p-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <Bell className="size-3.5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                  <span className="font-semibold">{previewTitle}</span>
                  {' — '}
                  {previewBody}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-emerald-700">Vừa xong</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {showEmail ? (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Email gửi đi</p>
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/30 px-2.5 py-1.5">
              <Mail className="size-3 shrink-0 text-muted-foreground" aria-hidden />
              <span className="text-xs font-medium text-muted-foreground">Hộp thư người nhận</span>
            </div>
            <div className="space-y-0.5 border-b px-2.5 py-1.5 text-xs text-muted-foreground">
              <p>
                Từ: <span className="text-foreground">GreenLens &lt;thongbao@greenlens.vn&gt;</span>
              </p>
              <p>
                Tiêu đề: <span className="font-semibold text-foreground">{previewTitle}</span>
              </p>
            </div>
            <div className="max-h-28 overflow-y-auto whitespace-pre-wrap px-2.5 py-2 text-xs leading-relaxed text-foreground">
              {previewBody}
            </div>
          </div>
        </section>
      ) : null}

      {!showPush && !showEmail ? (
        <p className="text-xs text-muted-foreground">Chọn kênh gửi để xem trước.</p>
      ) : null}
    </div>
  );
}
