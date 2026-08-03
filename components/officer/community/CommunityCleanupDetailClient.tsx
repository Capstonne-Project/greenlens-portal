'use client';

import {
  ClickableReportImage,
  ReportImagePreviewDialog,
  type ReportPreviewHandler,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  useCommunityCleanupDetail,
  useCommunityCleanupParticipants,
  useRejectCommunityVerification,
  useVerifyCommunityCleanup,
} from '@/hooks/useCommunityCleanup';
import type { CommunityCleanupParticipant } from '@/lib/api/models/communityCleanup';
import {
  COMMUNITY_CLEANUP_STATUS_BADGE_CLASSES,
  COMMUNITY_CLEANUP_STATUS_DOT_CLASSES,
  communityCleanupStatusLabelVi,
} from '@/lib/constants/communityCleanupStatus';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Camera,
  ClipboardList,
  ExternalLink,
  ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const ReportLocationMap = dynamic(
  () => import('@/components/officer/tracking/ReportLocationMap').then(m => m.ReportLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-56 items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Đang tải bản đồ…
      </div>
    ),
  }
);

const AVATAR_COLORS = [
  'bg-sky-200 text-sky-800',
  'bg-violet-200 text-violet-800',
  'bg-emerald-200 text-emerald-800',
  'bg-amber-200 text-amber-800',
  'bg-rose-200 text-rose-800',
] as const;

function hashColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

function formatDateTime(iso: string | null): string {
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

// ── Progress ring (đồng bộ style LeoTrackingReportDetail) ─────────────────

function ProgressCircle({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      className="relative flex size-28 shrink-0 items-center justify-center rounded-full sm:size-32"
      style={{
        background: `conic-gradient(hsl(142 71% 45%) ${clamped * 3.6}deg, hsl(var(--muted)) 0deg)`,
      }}
      role="img"
      aria-label={`Tiến độ dọn dẹp: ${clamped}%`}
    >
      <div className="flex size-21 flex-col items-center justify-center rounded-full bg-background px-2 text-center sm:size-24">
        <span className="text-xl font-bold leading-none tabular-nums text-foreground sm:text-2xl">
          {clamped}%
        </span>
        <span className="mt-1 max-w-19 text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
          Tiến độ dọn dẹp
        </span>
      </div>
    </div>
  );
}

type MediaStageKey = 'before' | 'progress' | 'after';

interface MediaStageImage {
  url: string;
  uploadedAt?: string;
}

interface MediaStage {
  key: MediaStageKey;
  step: number;
  title: string;
  shortLabel: string;
  emptyHint: string;
  images: MediaStageImage[];
}

function MediaProgressTimeline({
  stages,
  activeKey,
  onSelect,
}: {
  stages: MediaStage[];
  activeKey: MediaStageKey;
  onSelect: (key: MediaStageKey) => void;
}) {
  const activeIndex = Math.max(
    0,
    stages.findIndex(s => s.key === activeKey)
  );
  return (
    <ol className="relative mt-2 flex w-full items-start">
      {stages.map((stage, index) => {
        const isActive = index === activeIndex;
        const isPassed = index < activeIndex;
        const connectorFilled = index > 0 && index - 1 < activeIndex;
        return (
          <li key={stage.key} className="relative flex flex-1 flex-col items-center">
            {index > 0 ? (
              <span
                className={cn(
                  'pointer-events-none absolute top-4 right-1/2 left-[-50%] z-0 h-0.5 -translate-y-1/2',
                  connectorFilled ? 'bg-emerald-500' : 'bg-border'
                )}
                aria-hidden
              />
            ) : null}
            <button
              type="button"
              onClick={() => onSelect(stage.key)}
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors sm:size-9 sm:text-sm',
                isPassed && 'bg-emerald-500 text-white',
                isActive &&
                  'border-2 border-emerald-500 bg-background text-emerald-800 shadow-sm ring-4 ring-emerald-500/25 dark:text-emerald-300',
                !isPassed &&
                  !isActive &&
                  'border-2 border-border bg-background text-muted-foreground'
              )}
              aria-pressed={isActive}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Bước ${stage.step}: ${stage.shortLabel}`}
            >
              <span className="relative z-10">{stage.step}</span>
            </button>
            <p
              className={cn(
                'mt-2 max-w-26 text-center text-[11px] font-medium leading-tight sm:max-w-none sm:text-xs',
                isActive
                  ? 'font-semibold text-emerald-800 dark:text-emerald-300'
                  : 'text-muted-foreground'
              )}
            >
              {stage.shortLabel}
            </p>
            <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
              {stage.images.length} ảnh
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function MediaStageGallery({
  stage,
  onPreview,
}: {
  stage: MediaStage;
  onPreview: ReportPreviewHandler;
}) {
  if (stage.images.length === 0) {
    return (
      <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-2 py-10 text-center">
        <ImageIcon className="size-8 text-muted-foreground/45" aria-hidden />
        <p className="max-w-sm text-sm text-muted-foreground">{stage.emptyHint}</p>
      </div>
    );
  }
  return (
    <div className="mt-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {stage.title}{' '}
        <span className="font-normal text-muted-foreground">({stage.images.length})</span>
      </h3>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {stage.images.map(img => (
          <li key={`${img.url}-${img.uploadedAt}`}>
            <ClickableReportImage
              url={img.url}
              label={stage.title}
              uploadedAt={img.uploadedAt}
              onPreview={onPreview}
              className="aspect-4/3 w-full rounded-xl ring-1 ring-border/50 transition hover:ring-emerald-400/50"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Participants ────────────────────────────────────────────────────────

const PARTICIPANT_STATUS_LABEL: Record<CommunityCleanupParticipant['status'], string> = {
  Joined: 'Đã tham gia',
  CheckedIn: 'Đã check-in',
  Withdrawn: 'Đã rút',
  NoShow: 'Vắng mặt',
};

const PARTICIPANT_STATUS_DOT: Record<CommunityCleanupParticipant['status'], string> = {
  Joined: 'bg-sky-400',
  CheckedIn: 'bg-emerald-500',
  Withdrawn: 'bg-slate-400',
  NoShow: 'bg-red-500',
};

function ParticipantRow({ participant }: { participant: CommunityCleanupParticipant }) {
  return (
    <li className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <Avatar className="size-9 shrink-0">
        {participant.avatarUrl ? <AvatarImage src={participant.avatarUrl} alt="" /> : null}
        <AvatarFallback className={cn('text-xs font-semibold', hashColor(participant.userId))}>
          {getInitials(participant.fullName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium text-foreground">{participant.fullName}</p>
          {participant.role === 'Leader' ? (
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
              Leader
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
          Tham gia {formatDateTime(participant.joinedAt)}
          {participant.checkedInAt ? ` · Check-in ${formatDateTime(participant.checkedInAt)}` : ''}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className={cn('size-2 rounded-full', PARTICIPANT_STATUS_DOT[participant.status])} />
        {PARTICIPANT_STATUS_LABEL[participant.status]}
      </span>
    </li>
  );
}

// ── Reject dialog (đồng bộ style RejectReportDialog trong VerifyDetailClient) ──

function RejectCommunityVerificationDialog({
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
            Từ chối xác thực
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Vui lòng nhập lý do từ chối tối thiểu 20 ký tự. Chương trình sẽ chuyển về{' '}
            <span className="font-medium text-foreground">Đang dọn dẹp</span> để Leader nộp lại.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 px-6 py-5">
          <Label
            htmlFor="reject-community-reason"
            className="text-xs font-medium uppercase text-muted-foreground"
          >
            Lý do từ chối
          </Label>
          <textarea
            id="reject-community-reason"
            value={reason}
            onChange={event => onReasonChange(event.target.value)}
            rows={4}
            maxLength={600}
            placeholder="Nêu rõ minh chứng còn thiếu hoặc chưa đạt yêu cầu."
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-red-300 focus:ring-1 focus:ring-red-100"
          />
          <p
            className={cn(
              'text-right text-xs',
              isReasonValid ? 'text-muted-foreground' : 'font-medium text-red-600'
            )}
          >
            {reasonLength}/20 ký tự tối thiểu
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

function VerifyConfirmDialog({
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
        <DialogHeader className="space-y-2 border-b border-border bg-linear-to-b from-emerald-50/70 to-transparent px-6 pb-4 pt-6 text-left dark:from-emerald-500/5">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="size-4" aria-hidden />
            </span>
            Duyệt xác thực hoàn thành
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Chương trình sẽ chuyển sang{' '}
            <span className="font-medium text-foreground">Đã hoàn thành</span> và báo cáo gốc sẽ
            được đánh dấu <span className="font-medium text-foreground">Đã giải quyết</span>.
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
            {isSubmitting ? 'Đang duyệt...' : 'Xác nhận duyệt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Section layout helper ──────────────────────────────────────────────

function SectionBlock({
  children,
  className,
  title,
  icon: Icon,
  description,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: typeof Users;
  description?: React.ReactNode;
}) {
  return (
    <section className={cn('w-full min-w-0', className)}>
      {title ? (
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
            {Icon ? <Icon className="size-4 shrink-0 text-foreground" aria-hidden /> : null}
            {title}
          </h2>
          {description ? (
            <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────

interface CommunityCleanupDetailClientProps {
  eventId: string;
  onBack: () => void;
}

export function CommunityCleanupDetailClient({
  eventId,
  onBack,
}: CommunityCleanupDetailClientProps) {
  const {
    data: detail,
    isPending,
    isError,
    refetch,
    isFetching,
  } = useCommunityCleanupDetail(eventId);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-24 sm:px-6">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-destructive">Không tải được chương trình dọn cộng đồng.</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-1.5 size-4" />
            Quay lại
          </Button>
          <Button type="button" variant="secondary" onClick={() => void refetch()}>
            <RefreshCw className={cn('mr-1.5 size-4', isFetching && 'animate-spin')} />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return <DetailShell eventId={eventId} detail={detail} onBack={onBack} />;
}

function DetailShell({
  eventId,
  detail,
  onBack,
}: {
  eventId: string;
  detail: NonNullable<ReturnType<typeof useCommunityCleanupDetail>['data']>;
  onBack: () => void;
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [activeStage, setActiveStage] = useState<MediaStageKey>('before');
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: participants, isPending: isParticipantsPending } = useCommunityCleanupParticipants(
    eventId,
    { page: 1, pageSize: 50 }
  );

  const verifyMutation = useVerifyCommunityCleanup();
  const rejectMutation = useRejectCommunityVerification();

  const stages: MediaStage[] = useMemo(() => {
    const media = detail.media;
    const toImages = (urls: string[]): MediaStageImage[] => urls.map(url => ({ url }));
    return [
      {
        key: 'before',
        step: 1,
        title: 'Ảnh trước dọn dẹp',
        shortLabel: 'Trước dọn dẹp',
        emptyHint: 'Chưa có ảnh hiện trạng ban đầu.',
        images: toImages(media.beforeImageUrls),
      },
      {
        key: 'progress',
        step: 2,
        title: 'Ảnh tiến độ',
        shortLabel: 'Đang dọn dẹp',
        emptyHint: 'Chưa có ảnh cập nhật tiến độ.',
        images: toImages(media.progressImageUrls),
      },
      {
        key: 'after',
        step: 3,
        title: 'Ảnh sau dọn dẹp',
        shortLabel: 'Sau dọn dẹp',
        emptyHint: 'Chưa có ảnh nghiệm thu.',
        images: toImages(media.afterImageUrls),
      },
    ];
  }, [detail.media]);

  const active = stages.find(s => s.key === activeStage) ?? stages[0]!;

  const allImages = useMemo((): ReportPreviewImage[] => {
    const map = (items: MediaStageImage[], label: string) =>
      items.map(img => ({ url: img.url, label, uploadedAt: img.uploadedAt }));
    return [
      ...map(stages[0]!.images, 'Ảnh trước dọn dẹp'),
      ...map(stages[1]!.images, 'Ảnh tiến độ'),
      ...map(stages[2]!.images, 'Ảnh sau dọn dẹp'),
    ];
  }, [stages]);

  const handlePreview = (image: ReportPreviewImage) => {
    const idx = allImages.findIndex(
      item => item.url === image.url && item.uploadedAt === image.uploadedAt
    );
    setPreviewIndex(idx >= 0 ? idx : 0);
  };

  const handleVerify = () => {
    verifyMutation.mutate(eventId, {
      onSuccess: () => {
        toast.success('Đã duyệt xác thực — chương trình hoàn thành.');
        setVerifyOpen(false);
        onBack();
      },
      onError: () => {
        toast.error('Duyệt xác thực thất bại. Vui lòng thử lại.');
      },
    });
  };

  const handleReject = () => {
    rejectMutation.mutate(
      { eventId, reason: rejectReason },
      {
        onSuccess: () => {
          toast.success('Đã từ chối xác thực — chương trình về Đang dọn dẹp.');
          setRejectOpen(false);
          setRejectReason('');
          onBack();
        },
        onError: () => {
          toast.error('Từ chối xác thực thất bại. Vui lòng thử lại.');
        },
      }
    );
  };

  const canModerate = detail.status === 'PendingVerification';
  const hasMeetingPoint = detail.meetingLatitude != null && detail.meetingLongitude != null;
  const mapLat = hasMeetingPoint ? detail.meetingLatitude! : detail.reportLatitude;
  const mapLng = hasMeetingPoint ? detail.meetingLongitude! : detail.reportLongitude;
  const googleMapsUrl = `https://www.google.com/maps?q=${mapLat},${mapLng}`;

  const progressPercent = Math.max(0, Math.min(100, Math.round(detail.progressPercent)));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-16 pt-2 sm:px-6 sm:pb-20 lg:px-8">
      <ReportImagePreviewDialog
        images={allImages}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChangeIndex={setPreviewIndex}
      />

      <VerifyConfirmDialog
        open={verifyOpen}
        onCancel={() => setVerifyOpen(false)}
        onConfirm={handleVerify}
        isSubmitting={verifyMutation.isPending}
      />

      <RejectCommunityVerificationDialog
        open={rejectOpen}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onCancel={() => {
          setRejectOpen(false);
          setRejectReason('');
        }}
        onSubmit={handleReject}
        isSubmitting={rejectMutation.isPending}
      />

      <div className="mb-3 flex shrink-0 items-center justify-between">
        <Button type="button" variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={onBack}>
          <ArrowLeft className="mr-1 size-4" />
          Quay lại
        </Button>

        {canModerate ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setRejectOpen(true)}
            >
              <XCircle className="mr-1.5 size-4" />
              Từ chối
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-500"
              onClick={() => setVerifyOpen(true)}
            >
              <CheckCircle2 className="mr-1.5 size-4" />
              Duyệt hoàn thành
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex w-full min-w-0 flex-col gap-8 sm:gap-10">
        {/* ── Header + progress ring ── */}
        <SectionBlock>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto] lg:items-center lg:gap-x-10">
            <div className="order-1 min-w-0 lg:col-start-1 lg:row-start-1">
              <p className="text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl">
                {detail.title}
                <span className="ml-2 align-middle text-[11px] font-normal tabular-nums text-muted-foreground/80">
                  #{detail.reportCode}
                </span>
              </p>
            </div>

            <div className="order-5 min-w-0 lg:order-none lg:col-start-3 lg:row-start-1 lg:justify-self-end lg:text-right">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                  COMMUNITY_CLEANUP_STATUS_BADGE_CLASSES[detail.status]
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    COMMUNITY_CLEANUP_STATUS_DOT_CLASSES[detail.status]
                  )}
                />
                {communityCleanupStatusLabelVi(detail.status)}
              </span>
            </div>

            <div className="order-2 min-w-0 lg:col-start-1 lg:row-start-2">
              <p className="text-sm leading-snug text-muted-foreground">
                Leader:{' '}
                <span className="font-medium text-foreground/90">{detail.leader.fullName}</span>
                {' · '}
                {detail.leader.teamName}
              </p>
            </div>

            <div className="order-6 min-w-0 lg:order-none lg:col-start-3 lg:row-start-2 lg:justify-self-end lg:text-right">
              <p className="text-xs tabular-nums text-muted-foreground">
                Bắt đầu {formatDateTime(detail.startsAt)}
              </p>
            </div>

            <div className="order-3 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 lg:col-start-1 lg:row-start-3">
              <Users className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <p className="text-sm leading-snug text-muted-foreground">
                {detail.participantCount}/{detail.maxParticipants} người tham gia · còn{' '}
                {detail.spotsLeft} chỗ
              </p>
            </div>

            <div className="order-7 min-w-0 text-sm text-muted-foreground lg:order-none lg:col-start-3 lg:row-start-3 lg:justify-self-end lg:text-right">
              {detail.categoryName}
            </div>

            <div className="order-4 flex justify-center py-2 lg:order-none lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-center lg:py-0">
              <ProgressCircle percent={progressPercent} />
            </div>
          </div>

          {detail.description ? (
            <p className="mt-6 rounded-lg bg-muted/40 px-4 py-3 text-sm text-foreground/80">
              {detail.description}
            </p>
          ) : null}

          {detail.progressNote ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200/70">
              <span className="font-medium">Ghi chú tiến độ mới nhất: </span>
              {detail.progressNote}
            </p>
          ) : null}

          <div className="mt-11">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
                <Camera className="size-4 shrink-0 text-foreground" aria-hidden />
                Minh chứng hiện trường
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ảnh trước — đang dọn dẹp — sau dọn dẹp do Leader nộp
              </p>
            </div>
            <MediaProgressTimeline
              stages={stages}
              activeKey={activeStage}
              onSelect={setActiveStage}
            />
            <MediaStageGallery stage={active} onPreview={handlePreview} />
          </div>
        </SectionBlock>

        {/* ── Participants 6 / Meeting point 4 ── */}
        <div className="grid w-full gap-8 lg:grid-cols-10 lg:gap-0">
          <SectionBlock
            className="lg:col-span-6 lg:pr-8"
            icon={Users}
            title="Người tham gia"
            description={`${detail.participantCount}/${detail.maxParticipants} người · còn ${detail.spotsLeft} chỗ`}
          >
            {isParticipantsPending ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : !participants || participants.items.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">Chưa có ai tham gia.</p>
            ) : (
              <ul className="max-h-96 divide-y divide-border/60 overflow-y-auto pr-1">
                {participants.items.map(p => (
                  <ParticipantRow key={p.userId} participant={p} />
                ))}
              </ul>
            )}
          </SectionBlock>

          <SectionBlock
            className="lg:col-span-4 lg:border-l lg:border-border/60 lg:pl-8"
            icon={ClipboardList}
            title="Mốc thời gian"
          >
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Calendar className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-foreground">Mở đăng ký</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(detail.joinOpensAt)}
                  </p>
                </div>
              </li>
              {detail.joinClosesAt ? (
                <li className="flex items-start gap-2.5">
                  <Calendar
                    className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div>
                    <p className="text-foreground">Đóng đăng ký</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(detail.joinClosesAt)}
                    </p>
                  </div>
                </li>
              ) : null}
              <li className="flex items-start gap-2.5">
                <Calendar className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-foreground">Bắt đầu dọn dẹp</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(detail.startsAt)}
                  </p>
                </div>
              </li>
              {detail.endsAt ? (
                <li className="flex items-start gap-2.5">
                  <Calendar
                    className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div>
                    <p className="text-foreground">Dự kiến kết thúc</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(detail.endsAt)}
                    </p>
                  </div>
                </li>
              ) : null}
            </ul>
          </SectionBlock>
        </div>

        {/* ── Meeting point / map ── */}
        <SectionBlock
          title="Điểm tập trung"
          icon={MapPin}
          description={
            <>
              {detail.meetingNote ? `${detail.meetingNote} · ` : ''}
              {detail.reportAddress ?? 'Vị trí báo cáo'}
            </>
          }
        >
          <div className="overflow-hidden rounded-xl ring-1 ring-border/60">
            <ReportLocationMap
              latitude={mapLat}
              longitude={mapLng}
              className="h-56 w-full sm:h-72"
            />
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            <ExternalLink className="size-3" aria-hidden />
            Mở trên Google Maps · {mapLat.toFixed(5)}, {mapLng.toFixed(5)}
          </a>
        </SectionBlock>
      </div>
    </div>
  );
}
