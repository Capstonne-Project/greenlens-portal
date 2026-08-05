'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  ImageIcon,
  Loader2,
  MapPin,
  RotateCcw,
  Users,
  XCircle,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  useApproveReopenRequest,
  useRejectReopenRequest,
  useReportDetail,
} from '@/hooks/useOfficer';
import type { ReportAssignment, ReportDetail, ReportMedia } from '@/lib/api/models/report';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';

const BADGE_BASE =
  'inline-flex max-w-full min-w-0 items-center truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none';

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isImageMedia(media: ReportMedia): boolean {
  return media.mediaType.toLowerCase().includes('image');
}

function MediaThumbGrid({ items, emptyLabel }: { items: ReportMedia[]; emptyLabel: string }) {
  const images = items.filter(isImageMedia);

  if (images.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        <ImageIcon className="mr-2 size-4 shrink-0" aria-hidden />
        {emptyLabel}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {images.map((img, index) => (
        <li
          key={img.id || `${img.url}-${index}`}
          className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted"
        >
          <Image
            src={img.url}
            alt={`Ảnh minh chứng ${index + 1}`}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        </li>
      ))}
    </ul>
  );
}

function AssignmentsSummary({ assignments }: { assignments: ReportAssignment[] }) {
  if (assignments.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có phân công.</p>;
  }

  return (
    <ul className="space-y-2">
      {assignments.map(a => (
        <li
          key={a.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{a.teamName}</p>
            <p className="text-xs text-muted-foreground">
              {a.teamType}
              {a.status ? ` · ${a.status}` : ''}
              {a.assignedAt ? ` · ${formatDateTime(a.assignedAt)}` : ''}
            </p>
          </div>
          <span className="shrink-0 tabular-nums text-xs font-medium text-muted-foreground">
            {Math.round(a.progressPercent)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Action panel — cùng pattern ActionCard / SlaActionCard (VerifyDetailClient). */
function ReopenActionCard({
  detail,
  hasPending,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  detail: ReportDetail;
  hasPending: boolean;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const statusLabel = reportStatusLabelVi(detail.status);
  const statusBadgeClass =
    REPORT_STATUS_BADGE_CLASSES[detail.status as keyof typeof REPORT_STATUS_BADGE_CLASSES] ??
    'bg-muted text-muted-foreground';
  const busy = isApproving || isRejecting;

  return (
    <Card className="overflow-hidden p-0 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <RotateCcw className="size-4" aria-hidden />
          Quyết định
        </CardTitle>
        <CardDescription>Duyệt để mở lại hoặc từ chối yêu cầu không hợp lý.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center px-4 py-5 text-center">
        <div className="flex size-11 items-center justify-center rounded-full border border-amber-200 bg-white shadow-sm">
          <ClipboardList className="size-6 text-amber-700" aria-hidden />
        </div>
        <p className="mt-3 text-lg font-semibold text-foreground">
          {hasPending ? 'Chờ duyệt mở lại' : 'Không còn yêu cầu'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Trạng thái báo cáo:{' '}
          <span className={cn(BADGE_BASE, 'align-middle', statusBadgeClass)}>{statusLabel}</span>
        </p>
      </CardContent>

      {hasPending ? (
        <CardFooter>
          <div className="flex w-full flex-col gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={onApprove}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isApproving ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
              Xác nhận
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onReject}
              className="w-full border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800"
            >
              {isRejecting ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
              Từ chối
            </Button>
          </div>
        </CardFooter>
      ) : null}
    </Card>
  );
}

function RejectReopenDialog({
  open,
  reason,
  onReasonChange,
  onCancel,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  reason: string;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const reasonLength = reason.trim().length;
  const isReasonValid = reasonLength >= 20;

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && !isSubmitting && onCancel()}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="space-y-2 border-b border-border bg-linear-to-b from-red-50/60 to-transparent px-6 pb-4 pt-6 text-left dark:from-red-500/5">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
              <XCircle className="size-4" aria-hidden />
            </span>
            Từ chối yêu cầu mở lại
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Vui lòng nhập lý do từ chối tối thiểu 20 ký tự (BR-REP-022). Báo cáo giữ nguyên trạng
            thái hiện tại; người gửi có thể xem lý do từ chối.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 px-6 py-5">
          <Label
            htmlFor="reject-reopen-reason"
            className="text-xs font-medium uppercase text-muted-foreground"
          >
            Lý do từ chối
          </Label>
          <textarea
            id="reject-reopen-reason"
            value={reason}
            onChange={event => onReasonChange(event.target.value)}
            rows={4}
            maxLength={600}
            placeholder="Nêu rõ vì sao yêu cầu mở lại chưa đủ cơ sở để duyệt."
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-red-300 focus:ring-1 focus:ring-red-100"
          />
          <p
            className={cn(
              'text-right text-xs',
              isReasonValid ? 'text-muted-foreground' : 'font-medium text-red-600'
            )}
          >
            {reasonLength}/20 ký tự tối thiểu · tối đa 600
          </p>
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!isReasonValid || isSubmitting}
            className="bg-red-600 text-white hover:bg-red-500"
          >
            {isSubmitting ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
            {isSubmitting ? 'Đang từ chối...' : 'Xác nhận từ chối'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApproveReopenDialog({
  open,
  onCancel,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && !isSubmitting && onCancel()}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="space-y-2 bg-linear-to-b from-emerald-50/70 to-transparent px-6 pb-4 pt-6 text-left dark:from-emerald-500/5">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="size-4" aria-hidden />
            </span>
            Xác nhận mở lại báo cáo
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Báo cáo sẽ chuyển từ <span className="font-medium text-foreground">Đã giải quyết</span>{' '}
            sang <span className="font-medium text-foreground">Đã mở lại</span>. Sau khi duyệt, bạn
            sẽ được chuyển sang màn <span className="font-medium text-foreground">Phân công</span>{' '}
            để gán đội xử lý tiếp.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            {isSubmitting ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
            {isSubmitting ? 'Đang xác nhận...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BackControl({ onBack }: { onBack?: () => void }) {
  const content = (
    <>
      <ArrowLeft className="size-3.5" />
      {onBack ? 'Quay lại' : 'Quay lại danh sách'}
    </>
  );

  if (onBack) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 text-xs">
        {content}
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
      <Link href="/officer/reopen">{content}</Link>
    </Button>
  );
}

type ReopenDetailClientProps = {
  id: string;
  onBack?: () => void;
};

/** Chi tiết yêu cầu mở lại báo cáo [LEO] — duyệt / từ chối pending reopen. */
export function ReopenDetailClient({ id, onBack }: ReopenDetailClientProps) {
  const router = useRouter();
  const { data: detail, isLoading, isError } = useReportDetail(id);
  const approveMutation = useApproveReopenRequest();
  const rejectMutation = useRejectReopenRequest();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4 px-6 lg:px-10">
        <div className="h-9 w-40 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="h-40 animate-pulse rounded bg-muted" />
            <div className="h-56 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-64 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="space-y-4 px-6 lg:px-10">
        <BackControl onBack={onBack} />
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>Không thể tải chi tiết báo cáo. Vui lòng thử lại.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const pending =
    detail.hasPendingReopenRequest && detail.pendingReopenRequest
      ? detail.pendingReopenRequest
      : null;

  const handleApprove = async () => {
    if (!pending) return;
    try {
      const result = await approveMutation.mutateAsync({
        reportId: id,
        requestId: pending.requestId,
      });
      toastApiSuccess(result, 'Đã xác nhận mở lại báo cáo.');
      setApproveOpen(false);
      router.push(`/officer/assign?highlightReportId=${encodeURIComponent(id)}`);
    } catch (error) {
      toastApiError(error, 'Không thể xác nhận yêu cầu mở lại.');
    }
  };

  const handleReject = async () => {
    if (!pending) return;
    const reason = rejectReason.trim();
    if (reason.length < 20) return;

    try {
      const result = await rejectMutation.mutateAsync({
        reportId: id,
        requestId: pending.requestId,
        body: { reason },
      });
      toastApiSuccess(result, 'Đã từ chối yêu cầu mở lại.');
      setRejectOpen(false);
      setRejectReason('');
      if (onBack) {
        onBack();
      } else {
        router.push('/officer/reopen');
      }
    } catch (error) {
      toastApiError(error, 'Không thể từ chối yêu cầu mở lại.');
    }
  };

  return (
    <div className="space-y-6 px-6 pb-8 lg:px-10">
      <BackControl onBack={onBack} />

      {/* Title + description thẳng hàng (cùng cột trái) */}
      <div className="min-w-0 space-y-1.5">
        <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          <RotateCcw className="size-5 shrink-0 text-violet-600" aria-hidden />
          Yêu cầu mở lại
          <span className="font-mono text-base font-medium text-muted-foreground">
            #{detail.code}
          </span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Xem lý do & minh chứng, rồi xác nhận hoặc từ chối yêu cầu.
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left — content sections (không border card) */}
        <div className="min-w-0 space-y-8">
          {!pending ? (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>Không còn yêu cầu mở lại đang chờ</span>
                {onBack ? (
                  <Button type="button" variant="outline" size="sm" onClick={onBack}>
                    Về danh sách
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/officer/reopen">Về danh sách</Link>
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <section className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <ClipboardList className="size-4 text-amber-700" aria-hidden />
                  Yêu cầu đang chờ duyệt
                </h2>
                <span
                  className={cn(
                    BADGE_BASE,
                    'shrink-0 bg-amber-50 text-amber-800 ring-1 ring-amber-200/80'
                  )}
                >
                  Chờ duyệt
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Ngày gửi
                  </p>
                  <p className="mt-0.5 text-sm tabular-nums text-foreground">
                    {formatDateTime(pending.requestedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Mã yêu cầu
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-foreground">
                    {pending.requestId}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Lý do mở lại
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {pending.reason || '—'}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Minh chứng ({pending.evidenceMedia.filter(isImageMedia).length})
                </p>
                <MediaThumbGrid
                  items={pending.evidenceMedia}
                  emptyLabel="Không có ảnh minh chứng"
                />
              </div>
            </section>
          )}

          {/* Thông tin + ảnh báo cáo — một section */}
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Thông tin báo cáo</h2>

            <div className="flex gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <p className="leading-relaxed text-foreground">{detail.address || '—'}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Mô tả
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {detail.description || '—'}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <p>
                Danh mục:{' '}
                <span className="font-medium text-foreground">{detail.categoryName || '—'}</span>
              </p>
              <p>
                Đã mở lại:{' '}
                <span className="font-medium tabular-nums text-foreground">
                  {detail.reopenedCount}
                </span>{' '}
                lần
              </p>
              {detail.resolvedAt ? (
                <p>
                  Đã giải quyết:{' '}
                  <span className="font-medium tabular-nums text-foreground">
                    {formatDateTime(detail.resolvedAt)}
                  </span>
                </p>
              ) : null}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ImageIcon className="size-3.5" aria-hidden />
                Ảnh báo cáo (trước)
              </p>
              <MediaThumbGrid items={detail.media} emptyLabel="Không có hình ảnh" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Users className="size-4 text-muted-foreground" aria-hidden />
              Phân công lần trước
            </h2>
            <AssignmentsSummary assignments={detail.assignments} />
          </section>
        </div>

        {/* Right — sticky action card (VerifyDetail pattern) */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-19 lg:self-start">
          <ReopenActionCard
            detail={detail}
            hasPending={Boolean(pending)}
            onApprove={() => setApproveOpen(true)}
            onReject={() => setRejectOpen(true)}
            isApproving={approveMutation.isPending}
            isRejecting={rejectMutation.isPending}
          />
        </div>
      </div>

      <ApproveReopenDialog
        open={approveOpen}
        onCancel={() => setApproveOpen(false)}
        onConfirm={() => void handleApprove()}
        isSubmitting={approveMutation.isPending}
      />

      <RejectReopenDialog
        open={rejectOpen}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onCancel={() => {
          setRejectOpen(false);
          setRejectReason('');
        }}
        onSubmit={() => void handleReject()}
        isSubmitting={rejectMutation.isPending}
      />
    </div>
  );
}
