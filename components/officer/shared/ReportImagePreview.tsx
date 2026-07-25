'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageZoomPane } from '@/components/ui/image-zoom-pane';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

export type ReportPreviewImage = {
  url: string;
  label: string;
  uploadedAt?: string;
};

export type ReportPreviewHandler = (image: ReportPreviewImage) => void;

export function formatReportImageDateTime(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReportImagePreviewDialog({
  images,
  index,
  onClose,
  onChangeIndex,
}: {
  images: ReportPreviewImage[];
  index: number | null;
  onClose: () => void;
  onChangeIndex: (next: number) => void;
}) {
  const current = index !== null ? images[index] : null;
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < images.length - 1;

  return (
    <Dialog open={index !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className={cn(
          'fixed inset-0 left-0 top-0 z-200 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0',
          'flex-col gap-0 overflow-hidden rounded-none border-0 bg-black p-0 text-white shadow-none',
          'data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0',
          '[&>button.absolute]:hidden'
        )}
      >
        <DialogDescription className="sr-only">
          Hộp thoại xem trước ảnh báo cáo. Cuộn chuột để phóng to hoặc thu nhỏ, kéo để di chuyển,
          double-click để reset.
        </DialogDescription>
        {current ? (
          <>
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-20 size-10 rounded-full text-white hover:bg-white/15"
                onClick={onClose}
              >
                <X className="size-6" />
                <span className="sr-only">Đóng</span>
              </Button>
              {hasPrev ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full text-white hover:bg-white/15 sm:left-6"
                  onClick={() => onChangeIndex((index ?? 0) - 1)}
                >
                  <ChevronLeft className="size-7" />
                  <span className="sr-only">Ảnh trước</span>
                </Button>
              ) : null}
              <div className="relative h-full w-full">
                <ImageZoomPane key={current.url} src={current.url} alt={current.label} />
              </div>
              {hasNext ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full text-white hover:bg-white/15 sm:right-6"
                  onClick={() => onChangeIndex((index ?? 0) + 1)}
                >
                  <ChevronRight className="size-7" />
                  <span className="sr-only">Ảnh sau</span>
                </Button>
              ) : null}
            </div>
            <DialogHeader className="shrink-0 space-y-0.5 border-t border-white/10 bg-black/90 px-4 py-3 text-left sm:px-6">
              <DialogTitle className="text-sm font-medium text-white">{current.label}</DialogTitle>
              <DialogDescription className="text-xs text-white/70">
                Cuộn để zoom · kéo để pan · double-click để reset
                {images.length > 1 ? ` · ${(index ?? 0) + 1}/${images.length}` : ''}
                {current.uploadedAt ? ` · ${formatReportImageDateTime(current.uploadedAt)}` : ''}
              </DialogDescription>
            </DialogHeader>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function ClickableReportImage({
  url,
  label,
  uploadedAt,
  onPreview,
  className,
  sizes = '160px',
  showTimestamp = true,
  unoptimized = false,
}: {
  url: string;
  label: string;
  uploadedAt?: string;
  onPreview: ReportPreviewHandler;
  className?: string;
  sizes?: string;
  showTimestamp?: boolean;
  unoptimized?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onPreview({ url, label, uploadedAt })}
      aria-label={`Xem ảnh ${label}`}
      className={cn(
        'group relative cursor-zoom-in overflow-hidden bg-muted ring-1 ring-border/60 transition hover:ring-emerald-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        className
      )}
    >
      <Image
        src={url}
        alt={label}
        fill
        unoptimized={unoptimized}
        className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        sizes={sizes}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/45"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-black/50 text-white opacity-0 shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <Eye className="size-5" />
        </span>
      </span>
      {showTimestamp && uploadedAt ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-1 text-[10px] text-white">
          {formatReportImageDateTime(uploadedAt)}
        </span>
      ) : null}
    </button>
  );
}

export function useReportImagePreview(images: ReportPreviewImage[]) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const stableImages = useMemo(() => images, [images]);

  const openPreview = (image: ReportPreviewImage) => {
    const idx = stableImages.findIndex(
      item => item.url === image.url && item.uploadedAt === image.uploadedAt
    );
    setPreviewIndex(idx >= 0 ? idx : 0);
  };

  const previewDialog = (
    <ReportImagePreviewDialog
      images={stableImages}
      index={previewIndex}
      onClose={() => setPreviewIndex(null)}
      onChangeIndex={setPreviewIndex}
    />
  );

  return { previewIndex, setPreviewIndex, openPreview, previewDialog };
}
