'use client';

import {
  ClickableReportImage,
  ReportImagePreviewDialog,
  type ReportPreviewHandler,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import {
  CreateSuccessShareDialog,
  hasCommunityCleanupShare,
} from '@/components/officer/community/CreateSuccessShareDialog';
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
  COMMUNITY_CLEANUP_PARTICIPANTS_POLL_MS,
  useCommunityCleanupDetail,
  useCommunityCleanupParticipants,
  useRejectCommunityVerification,
  useVerifyCommunityCleanup,
} from '@/hooks/useCommunityCleanup';
import type {
  CommunityCleanupFacebookPage,
  CommunityCleanupParticipant,
  CommunityCleanupStatus,
} from '@/lib/api/models/communityCleanup';
import {
  COMMUNITY_CLEANUP_STATUS_BADGE_CLASSES,
  COMMUNITY_CLEANUP_STATUS_DOT_CLASSES,
  communityCleanupStatusLabelVi,
} from '@/lib/constants/communityCleanupStatus';
import { cn } from '@/lib/utils';
import { takeCommunityCleanupFacebookPostHighlight } from '@/utils/communityCleanupFacebookPost';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Loader2,
  RefreshCw,
  Share2,
  XCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
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

/** Thanh tiến độ mảnh — đọc nhanh hơn ring, đặt cạnh nhãn % trong hero. */
function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Tiến độ dọn dẹp
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {clamped}%
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Tiến độ dọn dẹp: ${clamped}%`}
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

interface MediaStageImage {
  url: string;
  uploadedAt?: string;
}

/**
 * Một mốc trong vòng đời chương trình. `state` quyết định hình thức node:
 * done = đã xảy ra (có mốc thời gian thật), current = mốc đang diễn ra,
 * pending = chưa tới. `media` gắn trực tiếp vào mốc sinh ra nó.
 */
type LifecycleState = 'done' | 'current' | 'pending';

interface LifecycleStage {
  key: string;
  label: string;
  at: string | null;
  /** Dòng phụ: số người đăng ký, lý do… */
  meta?: string | null;
  /** Ghi chú dưới ảnh minh chứng (vd. Bắt đầu dọn dẹp). */
  note?: string | null;
  mediaLabel?: string;
  mediaEmptyHint?: string;
  images?: MediaStageImage[];
  state: LifecycleState;
}

/**
 * Xương sống vòng đời — hợp nhất "mốc thời gian" + "minh chứng theo giai đoạn"
 * thành một trục dọc duy nhất: mỗi mốc mang thời điểm thật và ảnh phát sinh ở
 * chính mốc đó, thay vì tách thành 3 khối rời (ring, danh sách ngày, stepper ảnh).
 */
function LifecycleSpine({
  stages,
  onPreview,
}: {
  stages: LifecycleStage[];
  onPreview: ReportPreviewHandler;
}) {
  return (
    <ol className="relative">
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        const hasMedia = stage.mediaLabel != null;
        const images = stage.images ?? [];

        return (
          <li key={stage.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  'absolute top-6 left-2.5 z-0 w-px -translate-x-1/2',
                  'h-[calc(100%-1.5rem)]',
                  stage.state === 'done' ? 'bg-brand/35' : 'bg-border'
                )}
                aria-hidden
              />
            ) : null}

            <span
              className={cn(
                'relative z-10 mt-1 flex size-5 shrink-0 items-center justify-center rounded-full',
                stage.state === 'done' && 'bg-brand text-white',
                stage.state === 'current' && 'bg-background ring-2 ring-brand',
                stage.state === 'pending' && 'bg-background ring-1 ring-border'
              )}
              aria-hidden
            >
              {stage.state === 'done' ? (
                <CheckCircle2 className="size-3.5" strokeWidth={2.5} />
              ) : stage.state === 'current' ? (
                <span className="size-1.5 rounded-full bg-brand" />
              ) : null}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h3
                  className={cn(
                    'text-sm font-semibold',
                    stage.state === 'pending' ? 'text-muted-foreground' : 'text-foreground'
                  )}
                >
                  {stage.label}
                </h3>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {stage.at ? formatDateTime(stage.at) : '—'}
                </span>
                {stage.state === 'current' ? (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                    Hiện tại
                  </span>
                ) : null}
              </div>

              {stage.meta ? (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{stage.meta}</p>
              ) : null}

              {hasMedia ? (
                <div className="mt-2.5">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {stage.mediaLabel}
                    <span className="ml-1.5 font-mono tabular-nums">({images.length})</span>
                  </p>
                  {images.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground/70 italic">
                      {stage.mediaEmptyHint}
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {images.map(img => (
                        <li key={`${img.url}-${img.uploadedAt}`}>
                          <ClickableReportImage
                            url={img.url}
                            label={stage.mediaLabel ?? stage.label}
                            uploadedAt={img.uploadedAt}
                            onPreview={onPreview}
                            showTimestamp={false}
                            className="size-20 rounded-lg sm:size-24"
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {stage.note?.trim() ? (
                <div className="mt-2.5 flex gap-2.5 rounded-md bg-muted/70 px-2.5 py-2">
                  <span className="w-0.5 shrink-0 self-stretch rounded-full bg-brand" aria-hidden />
                  <p className="min-w-0 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Ghi chú: </span>
                    {stage.note.trim()}
                  </p>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
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

const PARTICIPANT_STATUS_BADGE: Record<CommunityCleanupParticipant['status'], string> = {
  Joined: 'bg-sky-50 text-sky-700 ring-sky-200/80',
  CheckedIn: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  Withdrawn: 'bg-slate-100 text-slate-600 ring-slate-200/80',
  NoShow: 'bg-red-50 text-red-700 ring-red-200/80',
};

/** Dòng người tham gia gọn — Leader badge; Member badge theo trạng thái (tiếng Việt). */
function CompactParticipantRow({ participant }: { participant: CommunityCleanupParticipant }) {
  const isMember = participant.role === 'Member';

  return (
    <li className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
      <Avatar className="size-7 shrink-0">
        {participant.avatarUrl ? <AvatarImage src={participant.avatarUrl} alt="" /> : null}
        <AvatarFallback className={cn('text-[10px] font-semibold', hashColor(participant.userId))}>
          {getInitials(participant.fullName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-medium text-foreground">{participant.fullName}</p>
          {participant.role === 'Leader' ? (
            <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
              Trưởng nhóm
            </span>
          ) : null}
          {isMember ? (
            <span
              className={cn(
                'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1',
                PARTICIPANT_STATUS_BADGE[participant.status]
              )}
            >
              {PARTICIPANT_STATUS_LABEL[participant.status]}
            </span>
          ) : null}
        </div>
      </div>
      {!isMember ? (
        <span
          className={cn('size-1.5 shrink-0 rounded-full', PARTICIPANT_STATUS_DOT[participant.status])}
          title={PARTICIPANT_STATUS_LABEL[participant.status]}
          aria-label={PARTICIPANT_STATUS_LABEL[participant.status]}
        />
      ) : null}
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
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-0 px-6 pb-4 pt-6 text-left">
          <DialogTitle className="flex items-center gap-3 pr-8 text-lg font-semibold tracking-tight">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="size-4" aria-hidden />
            </span>
            Duyệt xác thực hoàn thành
          </DialogTitle>
        </DialogHeader>

        <DialogDescription asChild>
          <div className="space-y-2 px-6 pb-5 text-sm leading-6 text-muted-foreground">
            <p>Sau khi xác nhận, hệ thống sẽ cập nhật:</p>
            <ul className="space-y-1.5">
              <li>
                Chương trình → <span className="font-semibold text-foreground">Đã hoàn thành</span>
              </li>
              <li>
                Báo cáo gốc → <span className="font-semibold text-foreground">Đã giải quyết</span>
              </li>
            </ul>
          </div>
        </DialogDescription>

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
  description,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn('w-full min-w-0', className)}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {title}
            </h2>
            {description ? (
              <div className="mt-1.5 text-xs text-muted-foreground">{description}</div>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Thẻ thông tin chương trình — ảnh, danh tính, tiến độ, điểm tập trung.
 * Cột trái (7/10) sticky dưới thanh hành động khi cuộn timeline cột phải.
 */
/** Dải avatar chồng mép — xem nhanh vài người tham gia đầu, không cần cuộn. */
function ParticipantAvatarStack({
  participants,
  max = 5,
}: {
  participants: CommunityCleanupParticipant[];
  max?: number;
}) {
  const shown = participants.slice(0, max);
  const rest = participants.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map(p => (
        <Avatar key={p.userId} className="-ml-2 size-7 shrink-0 border-2 border-card first:ml-0">
          {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt="" /> : null}
          <AvatarFallback className={cn('text-[10px] font-semibold', hashColor(p.userId))}>
            {getInitials(p.fullName)}
          </AvatarFallback>
        </Avatar>
      ))}
      {rest > 0 ? (
        <span className="-ml-2 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

function EventInfoCard({
  detail,
  progressPercent,
  mapLat,
  mapLng,
  googleMapsUrl,
  participants,
  isParticipantsPending,
  facebookPage,
  highlightFacebookPost,
}: {
  detail: NonNullable<ReturnType<typeof useCommunityCleanupDetail>['data']>;
  progressPercent: number;
  mapLat: number;
  mapLng: number;
  googleMapsUrl: string;
  participants: CommunityCleanupParticipant[];
  isParticipantsPending: boolean;
  facebookPage?: CommunityCleanupFacebookPage | null;
  highlightFacebookPost?: boolean;
}) {
  const facebookPostRef = useRef<HTMLDivElement>(null);
  const facebookHref = facebookPage?.href?.trim() || null;

  useEffect(() => {
    if (!highlightFacebookPost || !facebookHref) return;
    facebookPostRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [highlightFacebookPost, facebookHref]);

  return (
    <div className="flex flex-col">
      {/* Ảnh + tiêu đề + mô tả — giới hạn chiều cao để không tràn ra ngoài cột */}
      <div className="relative aspect-video max-h-52 w-full overflow-hidden rounded-xl bg-muted">
        {detail.thumbnailUrl ? (
          <Image
            src={detail.thumbnailUrl}
            alt={detail.title}
            fill
            sizes="(max-width: 1024px) 100vw, 58rem"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-8 opacity-40" aria-hidden />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-black/0 to-transparent" />
        <span
          className={cn(
            'absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm',
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
        <p className="absolute inset-x-4 bottom-3 font-mono text-[11px] font-medium tracking-wide text-white tabular-nums">
          #{detail.reportCode}
          <span className="mx-1.5 text-white/60">·</span>
          {detail.categoryName}
        </p>
      </div>

      <div className="pt-5">
        <h1 className="text-xl font-semibold leading-tight tracking-tight text-foreground">
          {detail.title}
        </h1>
        {detail.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {detail.description}
          </p>
        ) : null}

        {facebookHref && facebookPage?.label ? (
          <div
            ref={facebookPostRef}
            className={cn(
              'mt-3 rounded-lg border border-[#1877F2]/30 bg-[#E8F1FF]/70 px-3 py-2.5 dark:border-[#1877F2]/40 dark:bg-[#1877F2]/10',
              highlightFacebookPost && 'animate-fb-post-spotlight'
            )}
          >
            <p className="text-[11px] font-semibold tracking-wide text-[#1877F2] uppercase">
              Link bài đăng Facebook
            </p>
            <a
              href={facebookHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex max-w-full items-start gap-1.5 text-sm font-medium text-foreground underline underline-offset-2 hover:text-[#1877F2]"
            >
              <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-[#1877F2]" aria-hidden />
              <span>{facebookPage.label}</span>
            </a>
          </div>
        ) : null}
      </div>

      {/* Leader + tiến độ */}
      <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-6">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className={cn('text-xs font-semibold', hashColor(detail.leader.userId))}>
            {getInitials(detail.leader.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{detail.leader.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">
            Leader · {detail.leader.teamName}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar percent={progressPercent} />
      </div>

      {/* Người tham gia (trái) + Điểm tập trung (phải) — cạnh nhau */}
      <div className="mt-6 grid grid-cols-1 gap-6 border-t border-border/60 pt-6 sm:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Người tham gia
            </p>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {detail.participantCount}/{detail.maxParticipants} · còn {detail.spotsLeft} chỗ
            </span>
          </div>

          {isParticipantsPending ? (
            <div className="flex h-16 items-center justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : participants.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">Chưa có ai tham gia.</p>
          ) : (
            <>
              <ParticipantAvatarStack participants={participants} />
              <ul className="mt-3 max-h-48 divide-y divide-border/50 overflow-y-auto">
                {participants.map(p => (
                  <CompactParticipantRow key={p.userId} participant={p} />
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="min-w-0 border-t border-border/60 pt-6 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
          <p className="mb-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Điểm tập trung
          </p>
          <div className="overflow-hidden rounded-xl bg-muted/40">
            <ReportLocationMap latitude={mapLat} longitude={mapLng} className="h-32 w-full" />
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-snug text-foreground/80">
            {detail.meetingNote ? `${detail.meetingNote} · ` : ''}
            {detail.reportAddress ?? 'Vị trí báo cáo'}
          </p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] font-medium text-brand tabular-nums hover:underline"
          >
            <ExternalLink className="size-3" aria-hidden />
            {mapLat.toFixed(5)}, {mapLng.toFixed(5)}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────

export interface CommunityCleanupBackContext {
  status?: CommunityCleanupStatus;
}

interface CommunityCleanupDetailClientProps {
  eventId: string;
  onBack: (ctx?: CommunityCleanupBackContext) => void;
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
          <Button type="button" variant="outline" onClick={() => onBack()}>
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
  onBack: (ctx?: CommunityCleanupBackContext) => void;
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [highlightFacebookPost, setHighlightFacebookPost] = useState(() =>
    typeof window !== 'undefined' ? takeCommunityCleanupFacebookPostHighlight(eventId) : false
  );

  useEffect(() => {
    if (!highlightFacebookPost) return;
    const timer = window.setTimeout(() => setHighlightFacebookPost(false), 3400);
    return () => window.clearTimeout(timer);
  }, [highlightFacebookPost]);

  const revealFacebookPost = () => {
    setShareOpen(false);
    setHighlightFacebookPost(true);
  };

  /** Chỉ poll participants khi chương trình còn hoạt động — badge status Member cập nhật ~2s. */
  const shouldPollParticipants =
    detail.status === 'OpenForJoin' ||
    detail.status === 'JoinClosed' ||
    detail.status === 'InProgress';

  const { data: participants, isPending: isParticipantsPending } = useCommunityCleanupParticipants(
    eventId,
    { page: 1, pageSize: 50 },
    {
      refetchInterval: shouldPollParticipants ? COMMUNITY_CLEANUP_PARTICIPANTS_POLL_MS : false,
    }
  );

  const verifyMutation = useVerifyCommunityCleanup();
  const rejectMutation = useRejectCommunityVerification();

  /**
   * Mốc vòng đời + minh chứng gộp một trục. `state` suy ra từ status thật của BE
   * (OpenForJoin → JoinClosed → InProgress → PendingVerification → Completed),
   * không phải từ việc user bấm chọn giai đoạn nào.
   */
  const lifecycleStages: LifecycleStage[] = useMemo(() => {
    const media = detail.media;
    const toImages = (urls: string[]): MediaStageImage[] => urls.map(url => ({ url }));
    const status = detail.status;

    /** Vị trí hiện tại trên vòng đời — Cancelled coi như dừng tại chỗ. */
    const order: CommunityCleanupStatus[] = [
      'OpenForJoin',
      'JoinClosed',
      'InProgress',
      'PendingVerification',
      'Completed',
    ];
    const activeIdx = order.indexOf(status);
    const stateFor = (stageIdx: number): LifecycleState => {
      if (status === 'Cancelled') return stageIdx === 0 ? 'done' : 'pending';
      if (activeIdx < 0) return 'pending';
      if (stageIdx < activeIdx) return 'done';
      if (stageIdx === activeIdx) return 'current';
      return 'pending';
    };

    return [
      {
        key: 'open',
        label: 'Mở đăng ký',
        at: detail.joinOpensAt,
        meta: `${detail.participantCount}/${detail.maxParticipants} người đã đăng ký · còn ${detail.spotsLeft} chỗ`,
        state: stateFor(0),
      },
      {
        key: 'joinClosed',
        label: 'Đóng đăng ký',
        at: detail.joinClosesAt,
        meta: detail.joinClosesAt ? null : 'Chưa đặt thời điểm đóng đăng ký.',
        state: stateFor(1),
      },
      {
        key: 'inProgress',
        label: 'Bắt đầu dọn dẹp',
        at: detail.startsAt,
        note: detail.progressNote,
        mediaLabel: 'Ảnh trước dọn dẹp',
        mediaEmptyHint: 'Chưa có ảnh hiện trạng ban đầu.',
        images: toImages(media.beforeImageUrls),
        state: stateFor(2),
      },
      {
        key: 'progressMedia',
        label: 'Cập nhật tiến độ',
        at: null,
        mediaLabel: 'Ảnh tiến độ',
        mediaEmptyHint: 'Chưa có ảnh cập nhật tiến độ.',
        images: toImages(media.progressImageUrls),
        state: media.progressImageUrls.length > 0 ? 'done' : stateFor(2),
      },
      {
        key: 'pendingVerification',
        label: 'Chờ duyệt xác thực',
        at: detail.endsAt,
        mediaLabel: 'Ảnh sau dọn dẹp',
        mediaEmptyHint: 'Chưa có ảnh nghiệm thu.',
        images: toImages(media.afterImageUrls),
        state: stateFor(3),
      },
      {
        key: 'completed',
        label: status === 'Cancelled' ? 'Đã hủy' : 'Hoàn thành',
        at: null,
        state: status === 'Cancelled' ? 'current' : stateFor(4),
      },
    ];
  }, [detail]);

  const allImages = useMemo((): ReportPreviewImage[] => {
    const map = (urls: string[], label: string) => urls.map(url => ({ url, label }));
    return [
      ...map(detail.media.beforeImageUrls, 'Ảnh trước dọn dẹp'),
      ...map(detail.media.progressImageUrls, 'Ảnh tiến độ'),
      ...map(detail.media.afterImageUrls, 'Ảnh sau dọn dẹp'),
    ];
  }, [detail.media]);

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
        onBack({ status: 'Completed' });
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
          onBack({ status: 'InProgress' });
        },
        onError: () => {
          toast.error('Từ chối xác thực thất bại. Vui lòng thử lại.');
        },
      }
    );
  };

  const canModerate = detail.status === 'PendingVerification';
  const canShare = hasCommunityCleanupShare(detail.share);
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

      {canShare ? (
        <CreateSuccessShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          eventId={eventId}
          title={detail.title}
          share={detail.share}
          thumbnailUrl={detail.thumbnailUrl}
          description={detail.description}
          meetingNote={detail.meetingNote}
          reportAddress={detail.reportAddress}
          startsAt={detail.startsAt}
          endsAt={detail.endsAt}
          headline="Chia sẻ chương trình"
          onFacebookShareSuccess={revealFacebookPost}
        />
      ) : null}

      {/* Thanh hành động — dính trên khi cuộn để nút duyệt luôn trong tầm tay */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/85 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2"
          onClick={() => onBack({ status: detail.status })}
        >
          <ArrowLeft className="mr-1 size-4" />
          Quay lại
        </Button>

        {canShare || canModerate ? (
          <div className="flex items-center gap-2">
            {canShare ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="mr-1.5 size-4" />
                Chia sẻ
              </Button>
            ) : null}
            {canModerate ? (
              <>
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
                  className="h-8 bg-brand text-brand-foreground hover:bg-brand-dark"
                  onClick={() => setVerifyOpen(true)}
                >
                  <CheckCircle2 className="mr-1.5 size-4" />
                  Duyệt hoàn thành
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── Bố cục 7/3: thông tin trái · timeline phải; divider 1px giữa hai cột ── */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-8 lg:grid-cols-[7fr_1px_3fr] lg:items-start lg:gap-8">
        {/* Sticky dưới thanh hành động — đứng yên khi cuộn timeline cột phải */}
        <aside className="min-w-0 lg:sticky lg:top-13 lg:self-start lg:pr-2">
          <EventInfoCard
            detail={detail}
            progressPercent={progressPercent}
            mapLat={mapLat}
            mapLng={mapLng}
            googleMapsUrl={googleMapsUrl}
            participants={participants?.items ?? []}
            isParticipantsPending={isParticipantsPending}
            facebookPage={detail.facebookPage}
            highlightFacebookPost={highlightFacebookPost}
          />
        </aside>

        {/* Đường kẻ dọc xám — cột riêng trong grid, self-stretch để kéo hết chiều cao hàng */}
        <div className="hidden bg-border lg:block lg:self-stretch" aria-hidden />

        <div className="min-w-0 lg:sticky lg:top-13 lg:max-h-[calc(100vh-4.25rem)] lg:overflow-y-auto lg:pl-2">
          <SectionBlock
            title="Vòng đời chương trình"
            description="Mốc thời gian và minh chứng Leader nộp ở từng giai đoạn"
          >
            <LifecycleSpine stages={lifecycleStages} onPreview={handlePreview} />
          </SectionBlock>
        </div>
      </div>
    </div>
  );
}
