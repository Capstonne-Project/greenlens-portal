'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { ArrowRight, Check, Copy, Eye, GitMerge, ImageIcon, Loader2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import {
  useReportImagePreview,
  type ReportPreviewHandler,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useConfirmDuplicateReport,
  useDismissDuplicateReport,
  useReportDetail,
} from '@/hooks/useOfficer';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import type { ReportDetail } from '@/lib/api/models/report';
import type { ReportQueueItem } from '@/lib/api/models/reportQueue';
import {
  REPORT_SEVERITY_BADGE_CLASSES,
  REPORT_SEVERITY_LABEL_VI,
} from '@/lib/constants/reportActions';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';

export type DuplicateParentPreview = {
  id: string;
  code: string;
  firstImageUrl: string | null;
};

type DuplicateSuspectDialogProps = {
  row: ReportQueueItem | null;
  /** Preview từ queue nếu báo cáo gốc đang ở trang hiện tại. */
  parentPreview: DuplicateParentPreview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToParent: () => void;
  /** Sau confirm / dismiss thành công — parent clear highlight. */
  onResolved?: () => void;
};

function firstImageUrl(
  detail: ReportDetail | undefined,
  fallback: string | null = null
): string | null {
  if (!detail?.media?.length) return fallback;
  const image = detail.media.find(m => m.mediaType.toLowerCase().includes('image'));
  return image?.url ?? detail.media[0]?.url ?? fallback;
}

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

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã báo cáo.');
  } catch {
    toast.error('Không thể sao chép. Hãy chọn và copy thủ công.');
  }
}

function CompareThumb({
  url,
  alt,
  loading,
  tone,
  onPreview,
}: {
  url: string | null;
  alt: string;
  loading?: boolean;
  tone: 'suspect' | 'original';
  onPreview?: ReportPreviewHandler;
}) {
  const ring =
    tone === 'suspect'
      ? 'ring-amber-300/80 shadow-amber-500/10'
      : 'ring-sky-300/70 shadow-sky-500/10';

  const canPreview = Boolean(url && !loading && onPreview);

  return (
    <div
      className={cn(
        'group relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-100',
        'ring-1 shadow-md',
        ring
      )}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-slate-400" aria-hidden />
        </div>
      ) : url ? (
        <Image src={url} alt={alt} fill sizes="200px" className="object-cover" unoptimized />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400">
          <ImageIcon className="size-6" aria-hidden />
          <span className="text-[10px]">Không có ảnh</span>
        </div>
      )}

      {tone === 'suspect' ? (
        <span
          className={cn(
            'pointer-events-none absolute left-2 top-2 z-20',
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
            'bg-amber-500 text-[10px] font-bold uppercase tracking-wide text-white',
            'shadow-sm ring-1 ring-white/30'
          )}
        >
          <Copy className="size-2.5" aria-hidden strokeWidth={2.75} />
          Trùng lặp
        </span>
      ) : null}

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

function ReportCodeChip({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyCode(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mt-2.5 w-full space-y-1 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <button
        type="button"
        onClick={() => void handleCopy()}
        title="Sao chép mã để tìm kiếm"
        className={cn(
          'group inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1',
          'bg-white text-xs font-semibold tabular-nums text-slate-800',
          'ring-1 ring-slate-200 transition-colors',
          'hover:bg-slate-50 hover:ring-slate-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
        )}
      >
        <span className="truncate">{code}</span>
        {copied ? (
          <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <Copy
            className="size-3.5 shrink-0 text-slate-400 group-hover:text-slate-600"
            aria-hidden
          />
        )}
      </button>
    </div>
  );
}

/** Line ngang + chấm sáng ping-pong mượt (transform + mirror). */
function LinkPulse({ tall }: { tall?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [travelX, setTravelX] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      setTravelX(Math.max(0, el.clientWidth - 10));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className={cn(
        'relative mx-1 flex w-10 shrink-0 items-center justify-center sm:mx-2 sm:w-14',
        tall ? 'min-h-28 self-stretch' : 'h-full min-h-16'
      )}
      aria-hidden
    >
      <div ref={trackRef} className="relative h-px w-full">
        <div className="absolute inset-0 bg-linear-to-r from-amber-400 via-slate-300 to-sky-400" />
        <div className="absolute inset-y-0 left-0 w-full overflow-hidden">
          <motion.div
            className="absolute -inset-y-0.5 w-8 bg-linear-to-r from-transparent via-white/70 to-transparent"
            animate={travelX > 0 ? { x: [-16, travelX + 6] } : undefined}
            transition={{
              duration: 1.55,
              ease: [0.45, 0.05, 0.55, 0.95],
              repeat: Infinity,
              repeatType: 'mirror',
            }}
          />
        </div>
        {travelX > 0 ? (
          <motion.span
            className="absolute top-1/2 left-0 size-2.5 -translate-y-1/2 rounded-full bg-amber-500 will-change-transform shadow-[0_0_12px_rgba(245,158,11,0.95)]"
            initial={{ x: 0 }}
            animate={{ x: travelX }}
            transition={{
              duration: 1.55,
              ease: [0.45, 0.05, 0.55, 0.95],
              repeat: Infinity,
              repeatType: 'mirror',
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-0.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <div className="min-w-0 text-slate-800">{children}</div>
    </div>
  );
}

function ReportCompareCard({
  detail,
  imageUrl,
  imageLoading,
  tone,
  onPreview,
}: {
  detail: ReportDetail;
  imageUrl: string | null;
  imageLoading?: boolean;
  tone: 'suspect' | 'original';
  onPreview: ReportPreviewHandler;
}) {
  const label = tone === 'suspect' ? 'Đang xác minh' : 'Báo cáo gốc';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={cn(
        'min-w-0 flex-1 rounded-xl border bg-white p-3 shadow-sm',
        tone === 'suspect' ? 'border-amber-200/80' : 'border-sky-200/80'
      )}
    >
      <CompareThumb
        url={imageUrl}
        alt={`${detail.code} · ${label}`}
        loading={imageLoading}
        tone={tone}
        onPreview={onPreview}
      />
      <ReportCodeChip code={detail.code} label={label} />

      <div className="mt-3 space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
              REPORT_STATUS_BADGE_CLASSES[detail.status]
            )}
          >
            {reportStatusLabelVi(detail.status)}
          </span>
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
              REPORT_SEVERITY_BADGE_CLASSES[detail.severity]
            )}
          >
            {REPORT_SEVERITY_LABEL_VI[detail.severity]}
          </span>
        </div>

        <MetaRow label="Danh mục">{detail.categoryName || '—'}</MetaRow>
        <MetaRow label="Địa chỉ">
          <span className="line-clamp-2" title={detail.address}>
            {detail.address || '—'}
          </span>
        </MetaRow>
        <MetaRow label="Mô tả">
          <span className="line-clamp-3" title={detail.description}>
            {detail.description?.trim() || '—'}
          </span>
        </MetaRow>
        <MetaRow label="Ưu tiên">
          <span className="tabular-nums">{detail.priorityScore.toFixed(2)}</span>
        </MetaRow>
        <MetaRow label="Tạo lúc">{formatShortDate(detail.createdAt)}</MetaRow>
      </div>
    </motion.div>
  );
}

export function DuplicateSuspectDialog({
  row,
  parentPreview,
  open,
  onOpenChange,
  onGoToParent,
  onResolved,
}: DuplicateSuspectDialogProps) {
  const parentId = row?.possibleDuplicateOfReportId ?? '';
  const suspectId = row?.id ?? '';

  const { data: parentDetail, isPending: parentLoading } = useReportDetail(
    open && parentId ? parentId : ''
  );
  const { data: suspectDetail, isPending: suspectLoading } = useReportDetail(
    open && suspectId ? suspectId : ''
  );

  const confirmMutation = useConfirmDuplicateReport();
  const dismissMutation = useDismissDuplicateReport();
  const actionPending = confirmMutation.isPending || dismissMutation.isPending;

  const parentStatus = parentDetail?.status;
  const isParentVerified = parentStatus === 'Verified';

  const parentCode =
    parentDetail?.code ??
    parentPreview?.code ??
    row?.possibleDuplicateOfReportCode ??
    parentId ??
    '—';

  const suspectImageUrl = firstImageUrl(suspectDetail, row?.firstImageUrl ?? null);
  const parentImageUrl = firstImageUrl(parentDetail, parentPreview?.firstImageUrl ?? null);

  const previewImages: ReportPreviewImage[] = [];
  if (suspectImageUrl) {
    previewImages.push({
      url: suspectImageUrl,
      label: `${row?.code ?? 'Báo cáo'} · Đang xác minh`,
    });
  }
  if (parentImageUrl) {
    previewImages.push({ url: parentImageUrl, label: `${parentCode} · Báo cáo gốc` });
  }

  const { openPreview, previewDialog } = useReportImagePreview(previewImages);

  const handleDismiss = async () => {
    if (!row) return;
    try {
      const result = await dismissMutation.mutateAsync({ reportId: row.id });
      toastApiSuccess(result, 'Đã bác bỏ nghi ngờ trùng lặp.');
      onOpenChange(false);
      onResolved?.();
    } catch (error) {
      toastApiError(error, 'Không thể bác bỏ nghi ngờ trùng lặp.');
    }
  };

  const handleConfirm = async () => {
    if (!row || !parentId) return;
    try {
      const result = await confirmMutation.mutateAsync({
        reportId: row.id,
        body: { primaryReportId: parentId },
      });
      toastApiSuccess(result, 'Đã gộp báo cáo trùng lặp.');
      onOpenChange(false);
      onResolved?.();
    } catch (error) {
      toastApiError(error, 'Không thể gộp báo cáo trùng lặp.');
    }
  };

  const showLoading = open && Boolean(parentId) && parentLoading;
  const dialogWide = isParentVerified;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'flex flex-col gap-0 overflow-hidden border-slate-200 p-0',
            'max-h-[min(90vh,52rem)]',
            dialogWide ? 'w-[calc(100%-1.5rem)] sm:max-w-4xl' : 'sm:max-w-lg'
          )}
        >
          {row ? (
            showLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-slate-400" aria-hidden />
              </div>
            ) : (
              <>
                <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6 sm:px-7">
                  <DialogHeader className="space-y-0 text-left">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl',
                          'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                        )}
                        aria-hidden
                      >
                        <Copy className="size-5" strokeWidth={2.25} />
                      </div>
                      <div className="min-w-0 space-y-1.5 pt-0.5">
                        <DialogTitle className="text-lg leading-snug text-slate-900">
                          Nghi ngờ báo cáo trùng lặp
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-relaxed text-slate-600">
                          {isParentVerified ? (
                            <>
                              Báo cáo gốc{' '}
                              <span className="font-semibold tabular-nums text-slate-800">
                                {parentCode}
                              </span>{' '}
                              đã <span className="font-semibold text-emerald-700">Verified</span>.
                              Đối chiếu thông tin hai bên rồi chọn{' '}
                              <span className="font-semibold text-slate-800">bác bỏ</span> hoặc{' '}
                              <span className="font-semibold text-slate-800">gộp trùng</span>.
                            </>
                          ) : (
                            <>
                              Báo cáo gốc{' '}
                              <span className="font-semibold tabular-nums text-amber-800">
                                {parentCode}
                              </span>{' '}
                              vẫn đang{' '}
                              <span className="font-semibold text-amber-800">chờ xác minh</span>.
                              Hãy xác minh báo cáo{' '}
                              <span className="font-semibold tabular-nums text-slate-800">
                                {parentCode}
                              </span>{' '}
                              trước, rồi quay lại xử lý báo cáo nghi trùng này.
                            </>
                          )}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                <div
                  className={cn(
                    'min-h-0 flex-1 overflow-y-auto overscroll-contain',
                    'px-6 py-5 sm:px-7',
                    '[scrollbar-gutter:stable]'
                  )}
                >
                  {isParentVerified && parentDetail && suspectDetail ? (
                    <div className="flex items-stretch gap-2 sm:gap-3">
                      <ReportCompareCard
                        detail={suspectDetail}
                        imageUrl={suspectImageUrl}
                        imageLoading={suspectLoading}
                        tone="suspect"
                        onPreview={openPreview}
                      />
                      <LinkPulse tall />
                      <ReportCompareCard
                        detail={parentDetail}
                        imageUrl={parentImageUrl}
                        tone="original"
                        onPreview={openPreview}
                      />
                    </div>
                  ) : (
                    <div className="flex items-stretch gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <CompareThumb
                          url={suspectImageUrl}
                          alt={`${row.code} · Đang xác minh`}
                          tone="suspect"
                          onPreview={openPreview}
                        />
                        <ReportCodeChip code={row.code} label="Đang xác minh" />
                      </div>

                      <LinkPulse />

                      <div className="min-w-0 flex-1">
                        <CompareThumb
                          url={parentImageUrl}
                          alt={`${parentCode} · Báo cáo gốc`}
                          loading={parentLoading}
                          tone="original"
                          onPreview={openPreview}
                        />
                        <ReportCodeChip code={parentCode} label="Báo cáo gốc" />
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:gap-2 sm:px-7">
                  {isParentVerified ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={actionPending}
                        onClick={() => void handleDismiss()}
                        className="border-slate-300 text-slate-700"
                      >
                        {dismissMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <XCircle className="size-4" aria-hidden />
                        )}
                        Từ chối nghi trùng
                      </Button>
                      <Button
                        type="button"
                        disabled={actionPending || !parentId}
                        onClick={() => void handleConfirm()}
                        className="bg-amber-600 text-white hover:bg-amber-500"
                      >
                        {confirmMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <GitMerge className="size-4" aria-hidden />
                        )}
                        Xác nhận gộp trùng
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                      </Button>
                      <Button
                        type="button"
                        className="bg-amber-600 text-white hover:bg-amber-500"
                        onClick={onGoToParent}
                        disabled={!row.possibleDuplicateOfReportId}
                      >
                        Đi đến xác minh
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </>
            )
          ) : null}
        </DialogContent>
      </Dialog>
      {previewDialog}
    </>
  );
}
