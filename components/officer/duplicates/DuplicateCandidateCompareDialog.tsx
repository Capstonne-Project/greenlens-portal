'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Copy, Eye, ImageIcon, MapPinned, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import {
  useReportImagePreview,
  type ReportPreviewHandler,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { Button } from '@/components/ui/button';
import { AnimatedHoverTooltip } from '@/components/ui/animated-tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  DuplicateCandidateItem,
  DuplicateCandidateMedia,
} from '@/lib/api/models/duplicateCandidate';
import {
  REPORT_SEVERITY_BADGE_CLASSES,
  REPORT_SEVERITY_LABEL_VI,
} from '@/lib/constants/reportActions';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';

type DuplicateCandidateCompareDialogProps = {
  item: DuplicateCandidateItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCoords(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return '—';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/** Link Google Maps — không cần API key; mobile thường mở app Maps. */
function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function formatSimilarity(score: number | null | undefined): string | null {
  if (score == null || Number.isNaN(score)) return null;
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);
  return `${pct}%`;
}

/** Tier 2 AI vs Tier 1 geo/time — heuristic trên chuỗi BE trả về (BR-REP-031). */
export function isAiDetectionSource(source: string | null): boolean {
  if (!source) return false;
  return /ai|tier\s*2/i.test(source);
}

export function detectionSourceLabel(source: string | null): string {
  if (!source) return '—';
  return isAiDetectionSource(source) ? 'AI (Tier 2)' : 'Vị trí & thời gian (Tier 1)';
}

export function firstDuplicateMediaUrl(
  media: DuplicateCandidateMedia[] | undefined
): string | null {
  if (!media?.length) return null;
  const image = media.find(m => m.type.toLowerCase().includes('image'));
  return image?.thumbnailUrl || image?.url || media[0]?.thumbnailUrl || media[0]?.url || null;
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã báo cáo.');
  } catch {
    toast.error('Không thể sao chép. Hãy chọn và copy thủ công.');
  }
}

function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyCode(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      title="Sao chép mã báo cáo"
      className={cn(
        'group inline-flex max-w-full items-center gap-1.5',
        'text-lg font-bold tracking-tight text-slate-900 tabular-nums',
        'transition-colors hover:text-brand',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'
      )}
    >
      <span className="truncate">{code}</span>
      {copied ? (
        <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <Copy className="size-3.5 shrink-0 text-slate-400 group-hover:text-slate-600" aria-hidden />
      )}
    </button>
  );
}

function SeverityPill({ severity }: { severity: DuplicateCandidateItem['severity'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold',
        REPORT_SEVERITY_BADGE_CLASSES[severity]
      )}
    >
      {REPORT_SEVERITY_LABEL_VI[severity]}
    </span>
  );
}

function StatusPill({ status }: { status: DuplicateCandidateItem['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold',
        REPORT_STATUS_BADGE_CLASSES[status]
      )}
    >
      {reportStatusLabelVi(status)}
    </span>
  );
}

function CoordsLink({ lat, lng }: { lat: number; lng: number }) {
  const label = formatCoords(lat, lng);
  if (label === '—') return <>—</>;
  return (
    <a
      href={googleMapsUrl(lat, lng)}
      target="_blank"
      rel="noopener noreferrer"
      title="Mở vị trí trên Google Maps"
      className={cn(
        'underline-offset-2 transition-colors hover:underline',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'
      )}
    >
      {label}
    </a>
  );
}

function CompareThumb({
  url,
  alt,
  tone,
  badgeLabel,
  onPreview,
}: {
  url: string | null;
  alt: string;
  tone: 'suspect' | 'original';
  badgeLabel: string;
  onPreview?: ReportPreviewHandler;
}) {
  const ring =
    tone === 'suspect'
      ? 'ring-amber-300/80 shadow-amber-500/10'
      : 'ring-sky-300/70 shadow-sky-500/10';
  const canPreview = Boolean(url && onPreview);

  return (
    <div
      className={cn(
        'group relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-100',
        'ring-1 shadow-md',
        ring
      )}
    >
      {url ? (
        <Image src={url} alt={alt} fill sizes="220px" className="object-cover" unoptimized />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400">
          <ImageIcon className="size-6" aria-hidden />
          <span className="text-[10px]">Không có ảnh</span>
        </div>
      )}

      <span
        className={cn(
          'pointer-events-none absolute left-2 top-2 z-20',
          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
          tone === 'suspect' ? 'bg-amber-500' : 'bg-sky-500',
          'text-[10px] font-bold uppercase tracking-wide text-white',
          'shadow-sm ring-1 ring-white/30'
        )}
      >
        {tone === 'suspect' ? <Copy className="size-2.5" aria-hidden strokeWidth={2.75} /> : null}
        {badgeLabel}
      </span>

      {canPreview ? (
        <button
          type="button"
          onClick={() => onPreview?.({ url: url!, label: alt })}
          aria-label={`Xem trước ảnh ${alt}`}
          className={cn(
            'absolute inset-0 z-10 flex items-center justify-center',
            'bg-black/0 transition-colors duration-200',
            'hover:bg-black/45 focus-visible:bg-black/45',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60'
          )}
        >
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-full',
              'bg-black/55 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm',
              'opacity-0 transition-opacity duration-200',
              'group-hover:opacity-100 group-focus-within:opacity-100'
            )}
          >
            <Eye className="size-4" aria-hidden />
          </span>
        </button>
      ) : null}
    </div>
  );
}

type CompareRow = {
  key: string;
  label: string;
  suspect: ReactNode;
  primary: ReactNode;
  /** Chuỗi chuẩn hóa để tô khác biệt — bỏ qua khi một bên không có dữ liệu. */
  suspectCompare?: string;
  primaryCompare?: string;
};

function buildCompareRows(item: DuplicateCandidateItem): CompareRow[] {
  const primary = item.primary;
  return [
    {
      key: 'address',
      label: 'Địa chỉ',
      suspect: item.address?.trim() || '—',
      primary: primary ? primary.address?.trim() || '—' : '—',
      suspectCompare: (item.address?.trim() || '').toLowerCase(),
      primaryCompare: primary ? (primary.address?.trim() || '').toLowerCase() : undefined,
    },
    {
      key: 'createdAt',
      label: 'Thời điểm báo cáo',
      suspect: formatShortDate(item.createdAt),
      primary: primary ? formatShortDate(primary.createdAt) : '—',
    },
    {
      key: 'category',
      label: 'Loại ô nhiễm',
      suspect: item.categoryName?.trim() || '—',
      primary: '—',
    },
    {
      key: 'severity',
      label: 'Mức độ',
      suspect: <SeverityPill severity={item.severity} />,
      primary: '—',
    },
    {
      key: 'status',
      label: 'Trạng thái',
      suspect: <StatusPill status={item.status} />,
      primary: '—',
    },
    {
      key: 'coords',
      label: 'Tọa độ GPS',
      suspect: <CoordsLink lat={item.latitude} lng={item.longitude} />,
      primary: '—',
    },
  ];
}

function toPreviewImages(
  media: DuplicateCandidateMedia[],
  labelPrefix: string
): ReportPreviewImage[] {
  return media
    .filter(m => Boolean(m.url || m.thumbnailUrl))
    .map(m => ({
      url: m.url || m.thumbnailUrl,
      label: `${labelPrefix} · ${m.type || 'Ảnh'}`,
      uploadedAt: m.uploadedAt,
    }));
}

/**
 * So sánh 2 bên: báo cáo nghi trùng (trái, amber) ↔ báo cáo gốc `primary` (phải, sky).
 * Kèm media 2 bên — BR-REP-031.
 */
export function DuplicateCandidateCompareDialog({
  item,
  open,
  onOpenChange,
}: DuplicateCandidateCompareDialogProps) {
  const primary = item?.primary ?? null;

  const allPreviewImages = useMemo(() => {
    if (!item) return [];
    return [
      ...toPreviewImages(item.media, item.code),
      ...(primary ? toPreviewImages(primary.media, primary.code) : []),
    ];
  }, [item, primary]);

  const { openPreview, previewDialog } = useReportImagePreview(allPreviewImages);

  if (!item) return null;

  const similarityLabel = formatSimilarity(item.aiSimilarityScore);
  const isAi = isAiDetectionSource(item.duplicateDetectionSource);
  const rows = buildCompareRows(item);
  const suspectThumb = firstDuplicateMediaUrl(item.media);
  const primaryThumb = firstDuplicateMediaUrl(primary?.media);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4 text-left">
            <DialogTitle className="text-base font-bold text-slate-900">
              So sánh trùng lặp
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Đối chiếu báo cáo nghi trùng với báo cáo gốc để quyết định gộp hoặc bác bỏ
              (BR-REP-031).
            </DialogDescription>
          </DialogHeader>

          <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex flex-col gap-5"
            >
              {/* Media 2 bên */}
              <div className="flex shrink-0 items-stretch gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <CompareThumb
                    url={suspectThumb}
                    alt={`${item.code} · Nghi trùng lặp`}
                    tone="suspect"
                    badgeLabel="Trùng lặp"
                    onPreview={openPreview}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <CompareThumb
                    url={primaryThumb}
                    alt={primary ? `${primary.code} · Báo cáo gốc` : 'Chưa có báo cáo gốc'}
                    tone="original"
                    badgeLabel="Báo cáo gốc"
                    onPreview={primaryThumb ? openPreview : undefined}
                  />
                </div>
              </div>

              {/* Chips: nguồn phát hiện + AI tương đồng */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <AnimatedHoverTooltip
                  name="Nguồn phát hiện trùng lặp"
                  designation={item.duplicateDetectionSource ?? undefined}
                >
                  <span
                    className={cn(
                      'inline-flex cursor-help items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1',
                      isAi
                        ? 'bg-violet-50 text-violet-800 ring-violet-200/80'
                        : 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
                    )}
                  >
                    {isAi ? (
                      <Sparkles className="size-3" aria-hidden />
                    ) : (
                      <MapPinned className="size-3" aria-hidden />
                    )}
                    {detectionSourceLabel(item.duplicateDetectionSource)}
                  </span>
                </AnimatedHoverTooltip>
                {similarityLabel ? (
                  <AnimatedHoverTooltip
                    name="Điểm tương đồng AI"
                    designation="Chỉ tham khảo — cán bộ quyết định cuối"
                  >
                    <span className="inline-flex cursor-help items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80">
                      AI tương đồng {similarityLabel}
                    </span>
                  </AnimatedHoverTooltip>
                ) : null}
              </div>

              {/* Header 2 cột: mã + vai trò */}
              <div>
                <div className="grid grid-cols-2">
                  <div className="flex flex-col items-center gap-1 border-r border-slate-200 px-2 pb-2 text-center sm:px-5">
                    <CodeCopyButton code={item.code} />
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                      <Copy className="size-2.5" aria-hidden strokeWidth={2.75} />
                      Nghi trùng lặp
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1 px-2 pb-2 text-center sm:px-5">
                    {primary ? (
                      <>
                        <CodeCopyButton code={primary.code} />
                        <span className="inline-flex items-center rounded-md bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                          Báo cáo gốc
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-slate-400">—</span>
                        <span className="text-xs font-medium text-slate-500">
                          Chưa xác định báo cáo gốc
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Mỗi hàng border-r bên trái → đường dọc liên tục giữa 2 cột */}
                {rows.map(row => {
                  const differs =
                    row.suspectCompare != null &&
                    row.primaryCompare != null &&
                    row.suspectCompare !== row.primaryCompare;
                  return (
                    <div
                      key={row.key}
                      className={cn(
                        'grid grid-cols-2 transition-colors duration-150',
                        differs ? 'bg-amber-50/50 hover:bg-amber-50/80' : 'hover:bg-slate-50/90'
                      )}
                    >
                      <div className="flex flex-col items-center gap-1.5 border-r border-slate-200 px-2 py-3.5 text-center sm:px-5">
                        <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-600 uppercase">
                          {row.label}
                        </p>
                        <div
                          className={cn(
                            'text-sm leading-relaxed font-semibold wrap-break-word text-slate-800',
                            differs && 'text-amber-950'
                          )}
                        >
                          {row.suspect}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 px-2 py-3.5 text-center sm:px-5">
                        <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-600 uppercase">
                          {row.label}
                        </p>
                        <div
                          className={cn(
                            'text-sm leading-relaxed font-semibold wrap-break-word text-slate-800',
                            differs && 'text-amber-950'
                          )}
                        >
                          {row.primary}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:justify-center">
            <Button
              asChild
              variant="outline"
              className="h-10 border-amber-200 bg-white text-amber-800 hover:bg-amber-50 hover:text-amber-900"
            >
              <Link href={`/officer/verify/${item.id}`}>
                <Eye className="size-4" aria-hidden />
                Chi tiết nghi trùng
              </Link>
            </Button>
            {primary ? (
              <Button
                asChild
                variant="outline"
                className="h-10 border-sky-200 bg-white text-sky-800 hover:bg-sky-50 hover:text-sky-900"
              >
                <Link href={`/officer/verify/${primary.id}`}>
                  <Eye className="size-4" aria-hidden />
                  Chi tiết báo cáo gốc
                </Link>
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {previewDialog}
    </>
  );
}
