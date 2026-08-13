'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  IMAGE_ZOOM,
  ImageZoomPane,
  type ImageZoomPaneHandle,
} from '@/components/ui/image-zoom-pane';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageIcon,
  Map as MapIcon,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

const ReportLocationMap = dynamic(
  () => import('@/components/officer/tracking/ReportLocationMap').then(m => m.ReportLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-black text-sm text-white/70">
        Đang tải bản đồ…
      </div>
    ),
  }
);

export type ReportPreviewImage = {
  url: string;
  label: string;
  uploadedAt?: string;
  /** Nhãn loại ảnh (Before/After/…) — hiện badge khi có. */
  typeLabel?: string;
};

export type ReportPreviewMapLocation = {
  latitude: number;
  longitude: number;
};

export type ReportPreviewHandler = (image: ReportPreviewImage) => void;

function hasPreviewMapCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

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

/**
 * Fullscreen lightbox — mockup enterprise:
 * top: counter · [Hình ảnh | Bản đồ] · zoom −/+ · close
 * center: ImageZoomPane / MapLibre+Goong + prev/next
 * bottom: thumbnail strip (chỉ mode ảnh)
 */
export function ReportImagePreviewDialog({
  images,
  index,
  onClose,
  onChangeIndex,
  mapLocation,
}: {
  images: ReportPreviewImage[];
  index: number | null;
  onClose: () => void;
  onChangeIndex: (next: number) => void;
  mapLocation?: ReportPreviewMapLocation | null;
}) {
  const current = index !== null ? images[index] : null;
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < images.length - 1;
  const zoomRef = useRef<ImageZoomPaneHandle>(null);
  const [scale, setScale] = useState(1);
  const [viewMode, setViewMode] = useState<'image' | 'map'>('image');
  const open = index !== null;
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setViewMode('image');
  }

  const canShowMap =
    !!mapLocation && hasPreviewMapCoords(mapLocation.latitude, mapLocation.longitude);
  const isMapMode = canShowMap && viewMode === 'map';

  useEffect(() => {
    if (!open || isMapMode) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && index !== null && index > 0) {
        e.preventDefault();
        onChangeIndex(index - 1);
      } else if (e.key === 'ArrowRight' && index !== null && index < images.length - 1) {
        e.preventDefault();
        onChangeIndex(index + 1);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomRef.current?.zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomRef.current?.zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        zoomRef.current?.reset();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, isMapMode, index, images.length, onChangeIndex]);

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          'fixed inset-0 left-0 top-0 z-200 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0',
          'flex-col gap-0 overflow-hidden rounded-none border-0 bg-black p-0 text-white shadow-none',
          'data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0',
          '[&>button.absolute]:hidden'
        )}
      >
        <DialogTitle className="sr-only">
          {isMapMode ? 'Xem bản đồ' : `${current?.label ?? 'Xem ảnh'} — phóng to / thu nhỏ`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isMapMode
            ? 'Hộp thoại xem vị trí báo cáo trên bản đồ MapLibre.'
            : 'Hộp thoại xem trước ảnh. Dùng nút zoom hoặc cuộn chuột để phóng to / thu nhỏ, kéo để di chuyển, mũi tên để đổi ảnh.'}
        </DialogDescription>

        {current ? (
          <>
            {/* Top bar */}
            <header className="relative z-30 flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <p className="min-w-16 text-sm font-medium tabular-nums text-white/90">
                {isMapMode ? 'Bản đồ' : `${(index ?? 0) + 1} / ${images.length}`}
              </p>

              {canShowMap ? (
                <div
                  role="tablist"
                  aria-label="Chế độ xem"
                  className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-white/10 p-1 backdrop-blur-sm"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!isMapMode}
                    onClick={() => setViewMode('image')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                      !isMapMode
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <ImageIcon className="size-4" aria-hidden />
                    Hình ảnh
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isMapMode}
                    onClick={() => setViewMode('map')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                      isMapMode
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <MapIcon className="size-4" aria-hidden />
                    Bản đồ
                  </button>
                </div>
              ) : null}

              <div className="flex items-center gap-1.5">
                {!isMapMode ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={scale <= IMAGE_ZOOM.min}
                      className="size-10 rounded-full text-white hover:bg-white/15 disabled:opacity-40"
                      onClick={() => zoomRef.current?.zoomOut()}
                      aria-label="Thu nhỏ"
                    >
                      <ZoomOut className="size-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={scale >= IMAGE_ZOOM.max}
                      className="size-10 rounded-full text-white hover:bg-white/15 disabled:opacity-40"
                      onClick={() => zoomRef.current?.zoomIn()}
                      aria-label="Phóng to"
                    >
                      <ZoomIn className="size-5" />
                    </Button>
                  </>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 rounded-full text-white hover:bg-white/15"
                  onClick={onClose}
                  aria-label="Đóng"
                >
                  <X className="size-5" />
                </Button>
              </div>
            </header>

            {/* Stage */}
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {isMapMode && mapLocation ? (
                <div className="relative h-full w-full px-3 pb-3 sm:px-6 sm:pb-6">
                  <div className="h-full w-full overflow-hidden rounded-xl">
                    <ReportLocationMap
                      latitude={mapLocation.latitude}
                      longitude={mapLocation.longitude}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {hasPrev ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute left-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full bg-white text-slate-800 shadow-md hover:bg-white/90 sm:left-6"
                      onClick={() => onChangeIndex((index ?? 0) - 1)}
                    >
                      <ChevronLeft className="size-6" />
                      <span className="sr-only">Ảnh trước</span>
                    </Button>
                  ) : null}

                  <div className="relative h-full w-full">
                    <ImageZoomPane
                      key={current.url}
                      ref={zoomRef}
                      src={current.url}
                      alt={current.label}
                      onScaleChange={setScale}
                    />
                    {current.typeLabel ? (
                      <span className="pointer-events-none absolute right-4 top-4 z-20 rounded-md bg-slate-900/80 px-2 py-1 text-xs font-semibold leading-none text-white shadow-sm sm:right-6 sm:top-5">
                        {current.typeLabel}
                      </span>
                    ) : null}
                  </div>

                  {hasNext ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full bg-white text-slate-800 shadow-md hover:bg-white/90 sm:right-6"
                      onClick={() => onChangeIndex((index ?? 0) + 1)}
                    >
                      <ChevronRight className="size-6" />
                      <span className="sr-only">Ảnh sau</span>
                    </Button>
                  ) : null}
                </>
              )}
            </div>

            {/* Bottom thumbs — chỉ mode ảnh */}
            {!isMapMode && images.length > 1 ? (
              <footer className="z-30 shrink-0 border-t border-white/10 bg-black/90 px-3 py-3 sm:px-6">
                <ul className="flex gap-2 overflow-x-auto overflow-y-visible py-1.5">
                  {images.map((img, i) => {
                    const active = i === index;
                    return (
                      <li key={`${img.url}-${i}`} className="shrink-0 p-1">
                        <button
                          type="button"
                          onClick={() => onChangeIndex(i)}
                          aria-label={`Ảnh ${i + 1}`}
                          aria-current={active ? 'true' : undefined}
                          className={cn(
                            'relative block size-14 cursor-pointer overflow-hidden rounded-md transition sm:size-16',
                            active
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                              : 'opacity-70 ring-1 ring-white/20 hover:opacity-100'
                          )}
                        >
                          <Image
                            src={img.url}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="64px"
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </footer>
            ) : null}
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

export function useReportImagePreview(
  images: ReportPreviewImage[],
  options?: { mapLocation?: ReportPreviewMapLocation | null }
) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const stableImages = useMemo(() => images, [images]);
  const mapLocation = options?.mapLocation ?? null;

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
      mapLocation={mapLocation}
    />
  );

  return { previewIndex, setPreviewIndex, openPreview, previewDialog };
}
