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
import { FacebookIcon } from '@/components/ui/svgs/facebookIcon';
import {
  communityCleanupKeys,
  useShareCommunityCleanupFacebookPage,
} from '@/hooks/useCommunityCleanup';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import type { CommunityCleanupShare } from '@/lib/api/models/communityCleanup';
import { cn } from '@/lib/utils';
import {
  buildCommunityCleanupSharePost,
  openFacebookSharerFallback,
} from '@/utils/communityCleanupSharePost';
import { CheckCircle2, Copy, Download, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useMemo } from 'react';
import { toast } from 'sonner';

export function hasCommunityCleanupShare(share: CommunityCleanupShare | null | undefined): boolean {
  if (!share) return false;
  return share.url.trim().length > 0;
}

export interface CreateSuccessShareDialogProps {
  open: boolean;
  onClose: () => void;
  /** eventId — POST /v1/community-cleanups/{eventId}/share/facebook-page */
  eventId: string;
  title: string;
  share: CommunityCleanupShare;
  /** Mô tả chương trình — đưa vào mục Chuẩn bị cá nhân. */
  description?: string | null;
  meetingNote?: string | null;
  reportAddress?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  /** Ảnh dự phòng khi `share.imageUrl` trống. */
  thumbnailUrl?: string | null;
  /** Mặc định: thông báo tạo thành công. Detail dùng “Chia sẻ chương trình”. */
  headline?: string;
  /**
   * `done` — một nút Xong (màn detail).
   * `create` — Đóng + Xem chi tiết (sau khi tạo chương trình).
   */
  footerVariant?: 'done' | 'create';
  /** Chỉ dùng với `footerVariant="create"`. */
  onViewDetail?: () => void;
  /** Gọi sau khi đăng Facebook Page thành công (toast đã hiện trong dialog). */
  onFacebookShareSuccess?: () => void;
}

function safeHttpUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function copyCaptionForComposer(caption: string): void {
  const text = caption.trim();
  if (!text || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
  void navigator.clipboard.writeText(text).then(
    () => {
      toast.success(
        'Đã sao chép nội dung. Dán vào ô soạn bài (Ctrl+V) nếu Facebook chưa điền sẵn.'
      );
    },
    () => undefined
  );
}

async function copyText(text: string, successMessage: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error('Không thể copy. Vui lòng copy thủ công.');
  }
}

function SharePlatformButton({
  label,
  href,
  disabled,
  loading,
  onClick,
  circleClassName,
  children,
}: {
  label: string;
  href?: string | null;
  disabled: boolean;
  loading?: boolean;
  onClick?: () => void;
  circleClassName: string;
  children: ReactNode;
}) {
  const className =
    'group flex flex-col items-center gap-1.5 disabled:pointer-events-none disabled:opacity-40';
  const circle = (
    <span
      className={cn(
        'flex size-11 items-center justify-center rounded-full transition-transform group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2',
        circleClassName
      )}
    >
      {loading ? <Loader2 className="size-5 animate-spin text-[#1877F2]" aria-hidden /> : children}
    </span>
  );
  const name = <span className="text-[11px] font-medium text-muted-foreground">{label}</span>;

  if (href && !disabled && !loading) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={className}
      >
        {circle}
        {name}
      </a>
    );
  }

  return (
    <button type="button" disabled={disabled || loading} onClick={onClick} className={className}>
      {circle}
      {name}
    </button>
  );
}

export function CreateSuccessShareDialog({
  open,
  onClose,
  eventId,
  title,
  share,
  description,
  meetingNote,
  reportAddress,
  startsAt,
  endsAt,
  thumbnailUrl,
  headline = 'Đã tạo chương trình thành công',
  footerVariant = 'done',
  onViewDetail,
  onFacebookShareSuccess,
}: CreateSuccessShareDialogProps) {
  const imageUrl = share.imageUrl?.trim() || thumbnailUrl?.trim() || null;
  const queryClient = useQueryClient();
  const shareFacebookPage = useShareCommunityCleanupFacebookPage();

  const postBody = useMemo(
    () =>
      buildCommunityCleanupSharePost({
        title,
        description,
        meetingNote,
        reportAddress,
        startsAt,
        endsAt,
        hashtags: share.hashtags,
      }),
    [title, description, meetingNote, reportAddress, startsAt, endsAt, share.hashtags]
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const tryFacebookSharerFallback = () => {
    const fallbackUrl = safeHttpUrl(share.facebookShareUrl);
    if (!fallbackUrl) return false;
    copyCaptionForComposer(postBody);
    const opened = openFacebookSharerFallback(fallbackUrl);
    if (opened) {
      toast.message('Đã mở cửa sổ chia sẻ Facebook (phương án thủ công).');
    }
    return opened;
  };

  const handleShareFacebookPage = () => {
    const id = eventId.trim();
    if (!id || shareFacebookPage.isPending) return;

    shareFacebookPage.mutate(id, {
      onSuccess: async envelope => {
        const result = envelope.data;
        if (result.success) {
          toastApiSuccess(envelope, 'Đã đăng chương trình lên Facebook Page.');
          await queryClient.refetchQueries({ queryKey: communityCleanupKeys.detail(id) });
          onFacebookShareSuccess?.();
          return;
        }
        toast.error(
          result.errorMessage?.trim() || 'Không thể đăng lên Facebook Page. Vui lòng thử lại.'
        );
        tryFacebookSharerFallback();
      },
      onError: err => {
        toastApiError(err, 'Không thể đăng lên Facebook Page.');
        tryFacebookSharerFallback();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border bg-linear-to-b from-emerald-50/70 to-transparent px-6 pb-4 pt-6 pr-12 text-left dark:from-emerald-500/10">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                {headline}
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                Sao chép nội dung và đăng lên Facebook Page.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {imageUrl ? (
            <div className="space-y-2">
              <div className="relative mx-auto aspect-video w-full max-w-xs overflow-hidden rounded-lg bg-muted">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  sizes="32rem"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <a
                href={imageUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <Download className="size-3.5" aria-hidden />
                Tải ảnh
              </a>
            </div>
          ) : null}

          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Nội dung bài đăng
              </p>
              <button
                type="button"
                onClick={() => void copyText(postBody, 'Đã copy nội dung.')}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <Copy className="size-3.5" aria-hidden />
                Sao chép
              </button>
            </div>
            <pre className="mt-1.5 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 px-3 py-2.5 font-sans text-sm leading-relaxed text-foreground">
              {postBody}
            </pre>
          </div>

          <div>
            <p className="text-center text-sm font-semibold tracking-tight text-foreground">
              Chia sẻ lên mạng xã hội
            </p>
            <p className="mt-0.5 text-center text-[11px] text-muted-foreground">
              Đăng chương trình dọn cộng đồng lên Facebook Page
            </p>
            <div className="mt-3 flex items-start justify-center">
              <SharePlatformButton
                label="Facebook"
                disabled={!eventId.trim()}
                loading={shareFacebookPage.isPending}
                onClick={handleShareFacebookPage}
                circleClassName="bg-[#E8F1FF] dark:bg-[#1877F2]/15"
              >
                <FacebookIcon className="size-7" aria-hidden />
                <span className="sr-only">Đăng lên Facebook Page</span>
              </SharePlatformButton>
            </div>
          </div>
        </div>

        <DialogFooter
          className={cn(
            'shrink-0 border-t border-border bg-muted/20 px-6 py-4',
            footerVariant === 'create' ? 'sm:justify-end sm:gap-2' : 'sm:justify-end'
          )}
        >
          {footerVariant === 'create' ? (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                Đóng
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 text-white hover:bg-emerald-500"
                onClick={() => onViewDetail?.()}
              >
                Xem chi tiết
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={onClose}
            >
              Xong
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
