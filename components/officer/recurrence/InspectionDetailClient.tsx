'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  History,
  IdCard,
  ImageIcon,
  LayoutDashboard,
  MapPin,
  Phone,
  Scale,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { AssignInspectionTeamDialog } from '@/components/officer/recurrence/AssignInspectionTeamDialog';
import {
  ClickableReportImage,
  ReportImagePreviewDialog,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInspectionDetail, useInspectionPayments } from '@/hooks/useOfficer';
import type {
  InspectionChecklistEvidence,
  InspectionDetail,
  InspectionPayment,
} from '@/lib/api/models/inspectionReport';
import {
  inspectionShowsClosedAt,
  inspectionShowsPenaltyFields,
  inspectionSlaIsOverdue,
  inspectionStatusBadgeClass,
  inspectionStatusLabelVi,
  resolveInspectionSubjectName,
} from '@/lib/constants/inspectionStatus';
import { violationLevelLabelVi } from '@/lib/constants/violationLevel';
import { cn } from '@/lib/utils';

const ReportLocationMap = dynamic(
  () => import('@/components/officer/tracking/ReportLocationMap').then(m => m.ReportLocationMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-56 w-full rounded-lg sm:h-64" />,
  }
);

const RECURRENCE_LIST_PATH = '/officer/recurrence';
const INSPECTIONS_LIST_PATH = '/officer/inspections';

const EMPTY = {
  team: 'Chưa gán đội thanh tra',
  subject: 'Đối tượng: Chưa cập nhật · Sẽ được Đội thanh tra bổ sung sau khảo sát',
  evidence: 'Chưa có bằng chứng hiện trường',
  categoryEmpty: 'Chưa có',
  penalty: 'Chưa ban hành quyết định xử phạt',
  waitingAccept: 'Đang chờ Đội thanh tra nhận việc',
} as const;

/** 5 mục checklist cố định — luôn hiện theo category. */
const CHECKLIST_SECTIONS = [
  {
    key: 'ViolationStatus',
    label: 'Tình trạng vi phạm',
    kind: 'text',
    description: 'Mô tả text từ đội thanh tra',
  },
  {
    key: 'ScenePhoto',
    label: 'Ảnh hiện trường',
    kind: 'photo',
    description: 'Gallery ảnh (≥2 trước khi nộp biên bản)',
  },
  {
    key: 'Video',
    label: 'Video',
    kind: 'video',
    description: 'Video tùy chọn (≤30MB)',
  },
  {
    key: 'Audio',
    label: 'Ghi âm',
    kind: 'audio',
    description: 'Ghi âm tùy chọn (≤10MB)',
  },
  {
    key: 'Other',
    label: 'Khác',
    kind: 'other',
    description: 'Text và/hoặc tệp đính kèm',
  },
] as const;

type ChecklistKey = (typeof CHECKLIST_SECTIONS)[number]['key'];

function formatViDateTime(iso: string | null | undefined): string {
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

function formatVnd(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

function formatBytes(size: number | null | undefined): string {
  if (size == null || !Number.isFinite(size) || size < 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

function entityTypeLabel(type: string | null | undefined): string {
  if (!type?.trim()) return '—';
  if (type === 'Individual') return 'Cá nhân';
  if (type === 'Organization' || type === 'Business') return 'Doanh nghiệp';
  return type;
}

function isBusinessEntity(type: string | null | undefined): boolean {
  return type === 'Organization' || type === 'Business';
}

function isIndividualEntity(type: string | null | undefined): boolean {
  return type === 'Individual';
}

function canManageInspectionTeam(status: string): boolean {
  return status === 'Draft' || status === 'InProgress';
}

function hasAssignedTeam(assignedTeamId: string | null | undefined): boolean {
  return Boolean(assignedTeamId?.trim());
}

function showsPenaltyBlock(status: string): boolean {
  return inspectionShowsPenaltyFields(status) || status === 'ClosedNoViolation';
}

function showsPaymentBlock(status: string): boolean {
  return inspectionShowsPenaltyFields(status);
}

function showsChecklistBlock(status: string, hasEvidence: boolean): boolean {
  if (status === 'Draft') return hasEvidence;
  return true;
}

function isImageMime(mime: string | null | undefined, url: string | null | undefined): boolean {
  if (mime?.startsWith('image/')) return true;
  if (!url) return false;
  return /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url);
}

function isVideoMime(mime: string | null | undefined, url: string | null | undefined): boolean {
  if (mime?.startsWith('video/')) return true;
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

function isAudioMime(mime: string | null | undefined, url: string | null | undefined): boolean {
  if (mime?.startsWith('audio/')) return true;
  if (!url) return false;
  return /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url);
}

function CopyIconButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <button
      type="button"
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      aria-label={`Sao chép ${label}`}
      title={`Sao chép ${label}`}
      onClick={async e => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(`Đã sao chép ${label}`);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error('Không sao chép được');
        }
      }}
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function Section({
  title,
  icon,
  children,
  action,
  description,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <section className="w-full min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
            {icon}
            {title}
          </h2>
          {description ? <div className="mt-0.5 text-xs text-slate-500">{description}</div> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('rounded-xl border border-slate-200/90 bg-white px-4 py-4 sm:px-5', className)}
    >
      {children}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-2.5 last:border-0 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

/** Hàng label / value ngang — kiểu Inspection Details trong ảnh mẫu. */
function DetailFieldRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <dt className="shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="flex min-w-0 max-w-[65%] items-start justify-end gap-1.5 text-right text-sm font-medium text-slate-900">
        {icon ? <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span> : null}
        <span className="min-w-0 wrap-break-word">{children}</span>
      </dd>
    </div>
  );
}

type MinuteTone = 'ok' | 'warn' | 'muted' | 'danger';

/** Hàng biên bản kiểu Inspection Items — trái nhãn, phải giá trị + icon trạng thái. */
function MinuteItemRow({
  label,
  value,
  tone = 'muted',
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: MinuteTone;
  hint?: string | null;
}) {
  const Icon =
    tone === 'ok'
      ? CheckCircle2
      : tone === 'warn'
        ? CircleAlert
        : tone === 'danger'
          ? XCircle
          : Clock;
  const toneClass =
    tone === 'ok'
      ? 'text-emerald-600'
      : tone === 'warn'
        ? 'text-amber-600'
        : tone === 'danger'
          ? 'text-red-600'
          : 'text-slate-400';

  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </div>
      <div
        className={cn(
          'flex max-w-[55%] shrink-0 items-start gap-1.5 text-right text-sm',
          toneClass
        )}
      >
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span className="min-w-0 font-medium wrap-break-word text-slate-900">{value}</span>
      </div>
    </div>
  );
}

function hasArrivalCoords(data: InspectionDetail): boolean {
  return (
    data.arrivalLatitude != null &&
    data.arrivalLongitude != null &&
    Number.isFinite(data.arrivalLatitude) &&
    Number.isFinite(data.arrivalLongitude) &&
    !(data.arrivalLatitude === 0 && data.arrivalLongitude === 0)
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy aria-label="Đang tải hồ sơ xử phạt">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

type ProgressStep = {
  key: string;
  step: number;
  shortLabel: string;
  title: string;
  at: string | null;
  detail: string | null;
  tooltip?: string | null;
  done: boolean;
};

function buildProgressSteps(d: InspectionDetail): ProgressStep[] {
  const steps: ProgressStep[] = [
    {
      key: 'created',
      step: 1,
      shortLabel: 'Lập hồ sơ',
      title: 'Lập hồ sơ xử phạt',
      at: d.createdAt,
      detail: d.createdByOfficerName ? `LEO: ${d.createdByOfficerName}` : null,
      done: Boolean(d.createdAt),
    },
    {
      key: 'team',
      step: 2,
      shortLabel: 'Gán đội',
      title: 'Gán đội thanh tra',
      at: null,
      detail: hasAssignedTeam(d.assignedTeamId)
        ? d.assignedTeamName?.trim() || 'Đã gán đội'
        : EMPTY.team,
      done: hasAssignedTeam(d.assignedTeamId),
    },
    {
      key: 'accepted',
      step: 3,
      shortLabel: 'Tiếp nhận',
      title: 'Tiếp nhận nhiệm vụ',
      at: d.acceptedAt,
      detail: null,
      tooltip: d.acceptedByUserId,
      done: Boolean(d.acceptedAt),
    },
    {
      key: 'arrival',
      step: 4,
      shortLabel: 'Hiện trường',
      title: 'Xác nhận hiện trường',
      at: d.arrivalConfirmedAt,
      detail:
        d.arrivalLatitude != null && d.arrivalLongitude != null
          ? `${d.arrivalLatitude.toFixed(5)}, ${d.arrivalLongitude.toFixed(5)}${
              d.arrivalNote ? ` · ${d.arrivalNote}` : ''
            }`
          : d.arrivalNote,
      done: Boolean(d.arrivalConfirmedAt),
    },
    {
      key: 'field',
      step: 5,
      shortLabel: 'Biên bản',
      title: 'Nộp biên bản điều tra',
      at: d.fieldInvestigationSubmittedAt,
      detail: null,
      done: Boolean(d.fieldInvestigationSubmittedAt),
    },
  ];

  if (d.status === 'ClosedNoViolation') {
    steps.push({
      key: 'closeNoViolation',
      step: 6,
      shortLabel: 'Không xử phạt',
      title: 'Đóng — không xử phạt',
      at: d.closedAt,
      detail: d.closedReason,
      done: Boolean(d.closedAt),
    });
  } else {
    steps.push({
      key: 'penalty',
      step: 6,
      shortLabel: 'Quyết định',
      title: 'Ban hành quyết định xử phạt',
      at: d.penaltyIssuedAt,
      detail: [
        d.penaltyDecisionNumber ? `Số QĐ: ${d.penaltyDecisionNumber}` : null,
        d.issuedByInspectorName ? `Thanh tra: ${d.issuedByInspectorName}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      done: Boolean(d.penaltyIssuedAt),
    });
  }

  steps.push({
    key: 'closed',
    step: 7,
    shortLabel: 'Đóng',
    title: 'Đóng hồ sơ',
    at: d.closedAt,
    detail: d.closedReason,
    done: d.status === 'Closed',
  });

  return steps;
}

/** Timeline ngang giống Minh chứng tracking — chỉ text meta, không nhúng media. */
function InvestigationProgressTimeline({
  steps,
  activeKey,
  onSelect,
}: {
  steps: ProgressStep[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  const activeIndex = Math.max(
    0,
    steps.findIndex(s => s.key === activeKey)
  );

  return (
    <ol className="relative mt-2 flex w-full items-start">
      {steps.map((stage, index) => {
        const isActive = index === activeIndex;
        const passedVisual = stage.done && index < activeIndex;
        const connectorFilled = index > 0 && steps[index - 1]?.done;

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
                passedVisual && 'bg-emerald-500 text-white',
                isActive &&
                  'border-2 border-emerald-500 bg-background text-emerald-800 shadow-sm ring-4 ring-emerald-500/25',
                !passedVisual &&
                  !isActive &&
                  'border-2 border-border bg-background text-muted-foreground'
              )}
              aria-pressed={isActive}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Bước ${stage.step}: ${stage.shortLabel}`}
            >
              {isActive ? (
                <>
                  <span
                    className="pointer-events-none absolute -inset-1 rounded-full bg-emerald-500/45 media-step-pulse-ring"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute -inset-1 rounded-full bg-emerald-500/35 media-step-pulse-ring [animation-delay:0.35s]"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute -inset-1 rounded-full bg-emerald-400/30 media-step-pulse-ring [animation-delay:0.7s]"
                    aria-hidden
                  />
                </>
              ) : null}
              <span className="relative z-10">{stage.step}</span>
            </button>

            <p
              className={cn(
                'mt-2 max-w-20 text-center text-[11px] font-medium leading-tight sm:max-w-none sm:text-xs',
                isActive ? 'font-semibold text-emerald-800' : 'text-muted-foreground'
              )}
            >
              {stage.shortLabel}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {stage.done ? 'Xong' : 'Chờ'}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function InvestigationStepPanel({
  step,
  mapsHref,
}: {
  step: ProgressStep;
  mapsHref: string | null;
}) {
  return (
    <div className="mt-5 flex min-h-32 flex-col items-center justify-center px-4 py-5 text-center">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
            step.done
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
              : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
          )}
        >
          {step.done ? 'Đã thực hiện' : 'Chưa thực hiện'}
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <p className="text-sm tabular-nums text-slate-700">
          <span className="text-slate-500">Thời điểm </span>
          {step.at ? formatViDateTime(step.at) : '—'}
          {step.tooltip ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-1.5 text-[10px] text-slate-400 underline decoration-dotted"
                  >
                    id
                  </button>
                </TooltipTrigger>
                <TooltipContent className="font-mono text-xs">{step.tooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </p>
        {step.detail ? (
          <p className="max-w-lg text-sm leading-relaxed text-slate-600">{step.detail}</p>
        ) : !step.done ? (
          <p className="max-w-md text-sm text-slate-500">
            {step.key === 'created' || step.key === 'team'
              ? 'Bước điều phối — không kèm ảnh/media.'
              : 'Chờ Đội thanh tra cập nhật trên Mobile.'}
          </p>
        ) : null}
      </div>

      {step.key === 'arrival' && mapsHref ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline"
        >
          <MapPin className="size-3.5" aria-hidden />
          Xem vị trí hiện trường
        </a>
      ) : null}
    </div>
  );
}

function partitionEvidence(items: InspectionChecklistEvidence[]) {
  const buckets: Record<ChecklistKey, InspectionChecklistEvidence[]> = {
    ViolationStatus: [],
    ScenePhoto: [],
    Video: [],
    Audio: [],
    Other: [],
  };

  for (const item of items) {
    const raw = item.category?.trim() || 'Other';
    if (raw === 'ViolationStatus' || raw === 'ScenePhoto' || raw === 'Video' || raw === 'Audio') {
      buckets[raw].push(item);
    } else {
      buckets.Other.push(item);
    }
  }

  return buckets;
}

function ChecklistEvidenceSection({ items }: { items: InspectionChecklistEvidence[] }) {
  const buckets = useMemo(() => partitionEvidence(items), [items]);
  const allEmpty = items.length === 0;

  const photoPreview = useMemo(() => {
    return buckets.ScenePhoto.filter(i => i.mediaUrl && isImageMime(i.mimeType, i.mediaUrl)).map(
      (i): ReportPreviewImage => ({
        url: i.mediaUrl!,
        label: i.description || 'Ảnh hiện trường',
        uploadedAt: i.uploadedAt ?? undefined,
      })
    );
  }, [buckets.ScenePhoto]);

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (allEmpty) {
    return (
      <Panel>
        <p className="text-sm text-slate-500">{EMPTY.evidence}</p>
      </Panel>
    );
  }

  return (
    <>
      <ReportImagePreviewDialog
        images={photoPreview}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChangeIndex={setPreviewIndex}
      />

      <div className="space-y-6">
        {CHECKLIST_SECTIONS.map(section => {
          const list = buckets[section.key];
          return (
            <div key={section.key} className="rounded-xl border border-slate-200/90 bg-white">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{section.label}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">{section.description}</p>
                </div>
                <span className="text-[11px] tabular-nums text-slate-400">{list.length}</span>
              </div>

              <div className="px-4 py-4 sm:px-5">
                {list.length === 0 ? (
                  <p className="text-sm text-slate-500">{EMPTY.categoryEmpty}</p>
                ) : section.kind === 'text' ? (
                  <ul className="space-y-2">
                    {list.map(item => (
                      <li
                        key={item.id}
                        className="rounded-lg bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-800 ring-1 ring-slate-200/70"
                      >
                        <p className="whitespace-pre-wrap">{item.description?.trim() || '—'}</p>
                        <p className="mt-1.5 text-[11px] tabular-nums text-slate-400">
                          {formatViDateTime(item.uploadedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : section.kind === 'photo' ? (
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {list.map(item => {
                      const url = item.mediaUrl;
                      if (!url || !isImageMime(item.mimeType, url)) {
                        return (
                          <li
                            key={item.id}
                            className="flex aspect-4/3 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400 ring-1 ring-border/50"
                          >
                            Không phải ảnh
                          </li>
                        );
                      }
                      const idx = photoPreview.findIndex(p => p.url === url);
                      return (
                        <li key={item.id}>
                          <ClickableReportImage
                            url={url}
                            label={item.description || 'Ảnh hiện trường'}
                            uploadedAt={item.uploadedAt ?? undefined}
                            onPreview={() => setPreviewIndex(idx >= 0 ? idx : 0)}
                            className="aspect-4/3 w-full rounded-xl ring-1 ring-border/50 transition hover:ring-emerald-400/50"
                          />
                        </li>
                      );
                    })}
                  </ul>
                ) : section.kind === 'video' ? (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {list.map(item => (
                      <li
                        key={item.id}
                        className="overflow-hidden rounded-xl ring-1 ring-border/60"
                      >
                        {item.mediaUrl && isVideoMime(item.mimeType, item.mediaUrl) ? (
                          <video
                            controls
                            preload="metadata"
                            className="aspect-video w-full bg-slate-900 object-contain"
                          >
                            <source src={item.mediaUrl} type={item.mimeType ?? undefined} />
                          </video>
                        ) : (
                          <div className="flex aspect-video items-center justify-center bg-slate-100 text-sm text-slate-500">
                            Không phát được video
                          </div>
                        )}
                        <div className="space-y-0.5 px-3 py-2">
                          {item.description ? (
                            <p className="text-xs text-slate-700">{item.description}</p>
                          ) : null}
                          <p className="text-[11px] text-slate-400">
                            {[
                              formatViDateTime(item.uploadedAt),
                              formatBytes(item.sizeBytes),
                              formatDuration(item.durationSeconds),
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : section.kind === 'audio' ? (
                  <ul className="space-y-3">
                    {list.map(item => (
                      <li
                        key={item.id}
                        className="rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-200/70"
                      >
                        {item.mediaUrl && isAudioMime(item.mimeType, item.mediaUrl) ? (
                          <audio controls preload="metadata" className="w-full">
                            <source src={item.mediaUrl} type={item.mimeType ?? undefined} />
                          </audio>
                        ) : (
                          <p className="text-sm text-slate-500">Không phát được ghi âm</p>
                        )}
                        <p className="mt-2 text-[11px] text-slate-400">
                          {[
                            item.description,
                            formatViDateTime(item.uploadedAt),
                            formatBytes(item.sizeBytes),
                            formatDuration(item.durationSeconds),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-3">
                    {list.map(item => (
                      <li
                        key={item.id}
                        className="rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-200/70"
                      >
                        {item.description?.trim() ? (
                          <p className="text-sm whitespace-pre-wrap text-slate-800">
                            {item.description}
                          </p>
                        ) : null}
                        {item.mediaUrl ? (
                          <a
                            href={item.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
                          >
                            <FileText className="size-3.5" aria-hidden />
                            Mở tệp đính kèm
                            <ExternalLink className="size-3" aria-hidden />
                          </a>
                        ) : null}
                        {!item.description?.trim() && !item.mediaUrl ? (
                          <p className="text-sm text-slate-500">—</p>
                        ) : null}
                        <p className="mt-1.5 text-[11px] text-slate-400">
                          {[formatViDateTime(item.uploadedAt), formatBytes(item.sizeBytes)]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function PaymentTable({ payments }: { payments: InspectionPayment[] }) {
  if (payments.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có khoản nộp nào được ghi nhận.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            <th className="py-2 pr-3 font-medium">Số tiền</th>
            <th className="py-2 pr-3 font-medium">Ngày nộp</th>
            <th className="py-2 pr-3 font-medium">Người ghi nhận</th>
            <th className="py-2 pr-3 font-medium">Ghi chú</th>
            <th className="py-2 font-medium">Chứng từ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map(p => (
            <tr key={p.id} className="align-top">
              <td className="py-2.5 pr-3 font-semibold tabular-nums text-slate-900">
                {formatVnd(p.amount)}
              </td>
              <td className="py-2.5 pr-3 tabular-nums text-slate-600">
                {formatViDateTime(p.paidAt)}
              </td>
              <td className="py-2.5 pr-3 text-slate-700">{p.recordedByUserName || '—'}</td>
              <td className="max-w-[12rem] py-2.5 pr-3 text-slate-600">{p.note || '—'}</td>
              <td className="py-2.5">
                {p.evidenceUrl ? (
                  <a
                    href={p.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
                  >
                    Xem
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Tab lịch sử nộp phạt — GET /v1/inspections/{id}/payments. */
function PaymentHistoryPanel({ inspectionId }: { inspectionId: string }) {
  const { data, isPending, isError, refetch, isFetching } = useInspectionPayments(inspectionId);

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy aria-label="Đang tải lịch sử nộp phạt">
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-destructive">Không tải được lịch sử nộp phạt.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-sm font-medium text-sky-700 hover:underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">Lịch sử nộp phạt</h2>
        {isFetching ? (
          <Skeleton className="size-4 rounded-full" aria-label="Đang cập nhật" />
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">Tổng tiền phạt</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
            {formatVnd(data.penaltyAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">Đã nộp</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-800">
            {formatVnd(data.paidAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">Còn lại</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
            {formatVnd(data.remainingAmount)}
          </p>
        </div>
      </div>

      <Panel>
        <p className="mb-3 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
          Các lần nộp ({data.payments.length})
        </p>
        <PaymentTable payments={data.payments} />
      </Panel>
    </div>
  );
}

const DETAIL_TAB_TRIGGER = cn(
  'relative h-auto gap-1.5 rounded-none border-0 bg-transparent px-0.5 pb-2.5 pt-0',
  'text-sm font-medium text-slate-500 shadow-none',
  'hover:text-slate-800',
  'focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:ring-offset-0',
  'data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-slate-900 data-[state=active]:shadow-none',
  'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent',
  'data-[state=active]:after:bg-slate-900'
);

function InspectionDetailHeader({
  data,
  onAssignClick,
}: {
  data: InspectionDetail;
  onAssignClick: (mode: 'assign' | 'change') => void;
}) {
  const slaOverdue = inspectionSlaIsOverdue(data.status, data.slaInspectionDueAt);
  const teamAssigned = hasAssignedTeam(data.assignedTeamId);
  const canTeamAction = canManageInspectionTeam(data.status);

  return (
    <header className="border-b border-slate-200 pb-4">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
        {/* Trái — hồ sơ: tiêu đề + mã/id + người lập */}
        <div className="min-w-0 space-y-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Hồ sơ xử phạt
            </h1>
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                inspectionStatusBadgeClass(data.status)
              )}
            >
              {inspectionStatusLabelVi(data.status)}
            </span>
            {data.isRepeatOffender ? (
              <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
                Tái phạm
              </span>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex min-w-0 max-w-full items-center gap-1.5">
              {data.reportId ? (
                <Link
                  href={`/officer/verify/${data.reportId}`}
                  className="truncate text-sm font-semibold tabular-nums text-sky-700 hover:underline"
                >
                  {data.reportCode?.trim() || 'Báo cáo gốc'}
                </Link>
              ) : (
                <span className="truncate text-sm font-semibold tabular-nums text-slate-800">
                  {data.reportCode?.trim() || '—'}
                </span>
              )}
              {data.reportCode?.trim() ? (
                <CopyIconButton value={data.reportCode.trim()} label="Mã báo cáo" />
              ) : null}
            </div>

            <div className="flex min-w-0 max-w-full items-center gap-1.5">
              <span className="min-w-0 truncate text-sm font-semibold tabular-nums text-slate-600">
                {data.id}
              </span>
              <CopyIconButton value={data.id} label="Id hồ sơ" />
            </div>
          </div>

          <p className="text-sm text-slate-500">
            Người lập {data.createdByOfficerName?.trim() || '—'}
            <span aria-hidden className="mx-1.5 text-slate-300">
              ·
            </span>
            Tạo {formatViDateTime(data.createdAt)}
          </p>

          {slaOverdue ? (
            <p className="inline-flex rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200/80">
              Hạn xử lý đã quá hạn — {formatViDateTime(data.slaInspectionDueAt)}
            </p>
          ) : null}
        </div>

        {/* Phải — đội thanh tra */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
              <Users className="size-4 text-slate-900" aria-hidden />
              Đội thanh tra
            </h2>
            {canTeamAction ? (
              <Button
                type="button"
                size="sm"
                className="h-8 bg-sky-700 text-xs text-white hover:bg-sky-600"
                onClick={() => onAssignClick(teamAssigned ? 'change' : 'assign')}
              >
                {teamAssigned ? 'Đổi đội' : 'Gán đội'}
              </Button>
            ) : null}
          </div>
          <Panel>
            {teamAssigned ? (
              <p className="text-sm font-semibold text-slate-900">
                {data.assignedTeamName?.trim() || 'Đã gán đội'}
              </p>
            ) : (
              <p className="text-sm text-slate-500">{EMPTY.team}</p>
            )}
          </Panel>
        </div>
      </div>
    </header>
  );
}

function SubjectLocationMinutesSection({ data }: { data: InspectionDetail }) {
  const entity = data.violatingEntity;
  const subjectName = resolveInspectionSubjectName(entity?.name, data.violatorName);
  const hasSubject = Boolean(subjectName);
  const showClosed = inspectionShowsClosedAt(data.status);
  const showPenaltyFields = inspectionShowsPenaltyFields(data.status);
  const slaOverdue = inspectionSlaIsOverdue(data.status, data.slaInspectionDueAt);
  const hasCoords = hasArrivalCoords(data);
  const mapsHref = hasCoords
    ? `https://www.google.com/maps?q=${data.arrivalLatitude},${data.arrivalLongitude}`
    : null;

  const displayName = entity?.name?.trim() || subjectName;
  const displayAddress =
    entity?.address?.trim() || data.violatorAddress?.trim() || data.arrivalNote?.trim() || null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
      {/* Cột trái — Thông tin đối tượng + Vị trí */}
      <div className="flex min-w-0 flex-col gap-8">
        <section className="min-w-0">
          <h2 className="mb-3 text-base font-semibold tracking-tight text-slate-900">
            Thông tin đối tượng
          </h2>
          <Panel className="!px-0 !py-0 sm:!px-0">
            <dl className="px-4 sm:px-5">
              {!hasSubject && !entity ? (
                <p className="py-4 text-sm text-slate-500">{EMPTY.subject}</p>
              ) : null}

              <DetailFieldRow label="Tên đối tượng" icon={<UserRound className="size-3.5" />}>
                {displayName || 'Chưa cập nhật'}
              </DetailFieldRow>

              <DetailFieldRow label="Loại" icon={<Building2 className="size-3.5" />}>
                {entityTypeLabel(entity?.type) !== '—'
                  ? entityTypeLabel(entity?.type)
                  : hasSubject
                    ? 'Cá nhân / chưa phân loại'
                    : '—'}
              </DetailFieldRow>

              {displayAddress ? (
                <DetailFieldRow label="Địa chỉ" icon={<MapPin className="size-3.5" />}>
                  {displayAddress}
                </DetailFieldRow>
              ) : null}

              {isBusinessEntity(entity?.type) && entity?.taxCode ? (
                <DetailFieldRow label="Mã số thuế" icon={<IdCard className="size-3.5" />}>
                  {entity.taxCode}
                </DetailFieldRow>
              ) : null}

              {(isIndividualEntity(entity?.type) && entity?.identityNumber) ||
              data.violatorIdentity ? (
                <DetailFieldRow label="CCCD / Định danh" icon={<IdCard className="size-3.5" />}>
                  {entity?.identityNumber?.trim() || data.violatorIdentity || '—'}
                </DetailFieldRow>
              ) : null}

              {entity?.phoneNumber ? (
                <DetailFieldRow label="Số điện thoại" icon={<Phone className="size-3.5" />}>
                  <a
                    href={`tel:${entity.phoneNumber}`}
                    className="text-sky-700 hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {entity.phoneNumber}
                  </a>
                </DetailFieldRow>
              ) : null}

              <DetailFieldRow label="Tái phạm">
                {data.isRepeatOffender ? (
                  <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800">
                    Có
                  </span>
                ) : (
                  'Không'
                )}
              </DetailFieldRow>

              <DetailFieldRow label="Người lập hồ sơ" icon={<Users className="size-3.5" />}>
                {data.createdByOfficerName?.trim() || '—'}
              </DetailFieldRow>

              <DetailFieldRow label="Ngày tạo" icon={<Clock className="size-3.5" />}>
                {formatViDateTime(data.createdAt)}
              </DetailFieldRow>
            </dl>
          </Panel>
        </section>

        <section className="min-w-0">
          <h2 className="mb-3 text-base font-semibold tracking-tight text-slate-900">
            Vị trí hiện trường
          </h2>
          <Panel className="overflow-hidden !p-0">
            {hasCoords ? (
              <>
                <ReportLocationMap
                  latitude={data.arrivalLatitude!}
                  longitude={data.arrivalLongitude!}
                  className="h-56 w-full sm:h-64"
                />
                <div className="flex flex-wrap items-start justify-between gap-2 border-t border-slate-100 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">
                      {data.arrivalNote?.trim() || displayAddress || 'Vị trí xác nhận hiện trường'}
                    </p>
                    <p className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                      {data.arrivalLatitude!.toFixed(5)}, {data.arrivalLongitude!.toFixed(5)}
                    </p>
                  </div>
                  {mapsHref ? (
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
                    >
                      Mở Maps
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center gap-2 px-4 text-center">
                <MapPin className="size-6 text-slate-300" aria-hidden />
                <p className="text-sm text-slate-500">
                  Chưa có tọa độ hiện trường (`arrivalLatitude` / `arrivalLongitude`).
                </p>
                <p className="text-xs text-slate-400">
                  Bản đồ sẽ hiển thị sau khi Đội thanh tra xác nhận hiện trường trên Mobile.
                </p>
              </div>
            )}
          </Panel>
        </section>
      </div>

      {/* Cột phải — Biên bản (Inspection Items) */}
      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Biên bản</h2>
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
              inspectionStatusBadgeClass(data.status)
            )}
          >
            {inspectionStatusLabelVi(data.status)}
          </span>
        </div>
        <Panel className="!px-0 !py-1 sm:!px-0">
          <div className="px-4 sm:px-5">
            <MinuteItemRow
              label="Nội dung vi phạm"
              value={data.violationDescription?.trim() || 'Chưa có mô tả'}
              tone={data.violationDescription?.trim() ? 'ok' : 'warn'}
              hint="Mô tả trong biên bản hiện trường"
            />
            <MinuteItemRow
              label="Trạng thái hồ sơ"
              value={inspectionStatusLabelVi(data.status)}
              tone={slaOverdue ? 'danger' : 'ok'}
            />
            <MinuteItemRow
              label="Tiếp nhận nhiệm vụ"
              value={data.acceptedAt ? formatViDateTime(data.acceptedAt) : 'Chưa tiếp nhận'}
              tone={data.acceptedAt ? 'ok' : 'muted'}
            />
            <MinuteItemRow
              label="Xác nhận hiện trường"
              value={
                data.arrivalConfirmedAt
                  ? formatViDateTime(data.arrivalConfirmedAt)
                  : 'Chưa xác nhận'
              }
              tone={data.arrivalConfirmedAt ? 'ok' : 'muted'}
            />
            <MinuteItemRow
              label="Nộp báo cáo hiện trường"
              value={
                data.fieldInvestigationSubmittedAt
                  ? formatViDateTime(data.fieldInvestigationSubmittedAt)
                  : 'Chưa nộp'
              }
              tone={data.fieldInvestigationSubmittedAt ? 'ok' : 'muted'}
            />
            <MinuteItemRow
              label="Hạn xử lý (SLA)"
              value={
                <>
                  {formatViDateTime(data.slaInspectionDueAt)}
                  {slaOverdue ? ' · Quá hạn' : ''}
                </>
              }
              tone={slaOverdue ? 'danger' : data.slaInspectionDueAt ? 'ok' : 'muted'}
            />
            {showPenaltyFields ? (
              <>
                <MinuteItemRow
                  label="Mức vi phạm"
                  value={violationLevelLabelVi(data.violationLevel)}
                  tone="ok"
                />
                <MinuteItemRow
                  label="Số tiền phạt"
                  value={formatVnd(data.penaltyAmount)}
                  tone="ok"
                />
                <MinuteItemRow
                  label="Số quyết định"
                  value={data.penaltyDecisionNumber?.trim() || '—'}
                  tone={data.penaltyDecisionNumber ? 'ok' : 'muted'}
                />
                <MinuteItemRow
                  label="Ngày ban hành"
                  value={formatViDateTime(data.penaltyIssuedAt)}
                  tone={data.penaltyIssuedAt ? 'ok' : 'muted'}
                />
                <MinuteItemRow
                  label="Hạn nộp phạt"
                  value={formatViDateTime(data.penaltyDueDate)}
                  tone={data.penaltyDueDate ? 'warn' : 'muted'}
                />
                <MinuteItemRow
                  label="Người ban hành"
                  value={data.issuedByInspectorName?.trim() || '—'}
                  tone={data.issuedByInspectorName ? 'ok' : 'muted'}
                />
              </>
            ) : (
              <MinuteItemRow
                label="Quyết định xử phạt"
                value="Chưa ban hành"
                tone="muted"
                hint="Sẽ có sau khi xử phạt"
              />
            )}
            {showClosed ? (
              <>
                <MinuteItemRow
                  label="Ngày đóng"
                  value={formatViDateTime(data.closedAt)}
                  tone="ok"
                />
                {data.closedReason?.trim() ? (
                  <MinuteItemRow label="Lý do đóng" value={data.closedReason} tone="ok" />
                ) : null}
              </>
            ) : null}
            {data.additionalPenaltyMeasures?.trim() ? (
              <MinuteItemRow
                label="Biện pháp kèm theo"
                value={data.additionalPenaltyMeasures}
                tone="ok"
              />
            ) : null}
            <MinuteItemRow
              label="Bằng chứng checklist"
              value={
                data.checklistEvidence.length > 0
                  ? `${data.checklistEvidence.length} mục`
                  : 'Chưa có'
              }
              tone={data.checklistEvidence.length > 0 ? 'ok' : 'muted'}
            />
          </div>
        </Panel>
      </section>
    </div>
  );
}

function InspectionDetailBody({ data }: { data: InspectionDetail }) {
  const showPenaltyFields = inspectionShowsPenaltyFields(data.status);
  const slaOverdue = inspectionSlaIsOverdue(data.status, data.slaInspectionDueAt);
  const steps = useMemo(() => buildProgressSteps(data), [data]);

  const defaultActiveKey = useMemo(() => {
    const lastDone = [...steps].reverse().find(s => s.done);
    return lastDone?.key ?? steps[0]?.key ?? 'created';
  }, [steps]);

  /** User pick; null = theo bước hoàn thành mới nhất (không sync qua effect). */
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const activeKey =
    pinnedKey != null && steps.some(s => s.key === pinnedKey) ? pinnedKey : defaultActiveKey;
  const activeStep = steps.find(s => s.key === activeKey) ?? steps[0];

  const hasEvidence = data.checklistEvidence.length > 0;
  const penalty = data.penaltyAmount;
  const paid = data.paidAmount ?? 0;
  const remaining =
    penalty != null && Number.isFinite(penalty) ? Math.max(penalty - paid, 0) : null;
  const paidRatio =
    penalty != null && penalty > 0 ? Math.min(100, Math.round((paid / penalty) * 100)) : null;

  const mapsHref =
    data.arrivalLatitude != null && data.arrivalLongitude != null
      ? `https://www.google.com/maps?q=${data.arrivalLatitude},${data.arrivalLongitude}`
      : null;

  const waitingAccept = data.status === 'Draft' && !data.acceptedAt ? EMPTY.waitingAccept : null;

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {/* 1) Tiến độ điều tra — đầu tiên, UI giống Minh chứng tracking */}
      <Section
        title="Tiến độ điều tra"
        icon={<Camera className="size-4 text-slate-900" />}
        description="Theo dõi các bước xử lý hồ sơ — media checklist tách riêng phía dưới"
        action={
          <span
            className={cn(
              'text-[11px] tabular-nums',
              slaOverdue ? 'font-medium text-red-600' : 'text-slate-500'
            )}
          >
            Hạn xử lý {formatViDateTime(data.slaInspectionDueAt)}
            {slaOverdue ? ' · Quá hạn' : ''}
          </span>
        }
      >
        {waitingAccept ? (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 ring-1 ring-amber-200/80">
            {waitingAccept}
          </p>
        ) : null}
        <InvestigationProgressTimeline
          steps={steps}
          activeKey={activeKey}
          onSelect={setPinnedKey}
        />
        {activeStep ? <InvestigationStepPanel step={activeStep} mapsHref={mapsHref} /> : null}
      </Section>

      {/* 2) Đối tượng (trái) + Vị trí + Biên bản (phải) — layout kiểu inspection detail mẫu */}
      <SubjectLocationMinutesSection data={data} />

      {/* 3) Checklist — 5 mục tách category */}
      {showsChecklistBlock(data.status, hasEvidence) ? (
        <Section
          title="Checklist & bằng chứng"
          icon={<ImageIcon className="size-4 text-slate-900" />}
          description="5 mục theo category — chỉ xem (Inspector Mobile upload)"
        >
          <ChecklistEvidenceSection items={data.checklistEvidence} />
        </Section>
      ) : null}

      {/* 4) QĐ xử phạt */}
      {showsPenaltyBlock(data.status) ? (
        <Section title="Quyết định xử phạt" icon={<Scale className="size-4 text-slate-900" />}>
          <Panel>
            {!showPenaltyFields ? (
              <p className="text-sm text-slate-500">{EMPTY.penalty}</p>
            ) : (
              <dl>
                <InfoRow label="Mức vi phạm">{violationLevelLabelVi(data.violationLevel)}</InfoRow>
                <InfoRow label="Số tiền phạt">{formatVnd(data.penaltyAmount)}</InfoRow>
                <InfoRow label="Số QĐ">{data.penaltyDecisionNumber || '—'}</InfoRow>
                <InfoRow label="Ngày ban hành">{formatViDateTime(data.penaltyIssuedAt)}</InfoRow>
                <InfoRow label="Hạn nộp">{formatViDateTime(data.penaltyDueDate)}</InfoRow>
                <InfoRow label="Người ban hành">{data.issuedByInspectorName || '—'}</InfoRow>
                {data.additionalPenaltyMeasures?.trim() ? (
                  <InfoRow label="Biện pháp kèm theo">
                    <span className="whitespace-pre-wrap">{data.additionalPenaltyMeasures}</span>
                  </InfoRow>
                ) : null}
              </dl>
            )}
          </Panel>
        </Section>
      ) : null}

      {/* 5) Thanh toán */}
      {showsPaymentBlock(data.status) ? (
        <Section title="Thanh toán" icon={<Scale className="size-4 text-slate-900" />}>
          <Panel>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/70">
                <p className="text-[11px] text-slate-500">Đã nộp</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-800">
                  {formatVnd(data.paidAmount)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/70">
                <p className="text-[11px] text-slate-500">Còn lại</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                  {formatVnd(remaining)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/70">
                <p className="text-[11px] text-slate-500">Tiến độ</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-sky-800">
                  {paidRatio != null ? `${paidRatio}%` : '—'}
                </p>
              </div>
            </div>
            {paidRatio != null ? (
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    'h-full rounded-full',
                    paidRatio >= 100 ? 'bg-emerald-500' : 'bg-sky-600'
                  )}
                  style={{ width: `${paidRatio}%` }}
                />
              </div>
            ) : null}
            <PaymentTable payments={data.payments} />
          </Panel>
        </Section>
      ) : null}
    </div>
  );
}

export function InspectionDetailClient() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const inspectionId = typeof params.id === 'string' ? params.id : '';

  const isInspectionsQueueRoute = pathname.startsWith('/officer/inspections');
  const backPath = isInspectionsQueueRoute ? INSPECTIONS_LIST_PATH : RECURRENCE_LIST_PATH;
  const backLabel = isInspectionsQueueRoute
    ? 'Quay lại danh sách hồ sơ xử phạt'
    : 'Quay lại danh sách tái diễn';

  const { data, isPending, isError, isFetching, refetch } = useInspectionDetail(inspectionId);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamDialogMode, setTeamDialogMode] = useState<'assign' | 'change'>('assign');

  const openTeamDialog = (mode: 'assign' | 'change') => {
    setTeamDialogMode(mode);
    setTeamDialogOpen(true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-16 pt-2 sm:pb-20">
      {/* Back sát mép layout như cũ — không áp gutter nội dung */}
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2 text-slate-600"
          onClick={() => router.push(backPath)}
        >
          <ArrowLeft className="size-4" aria-hidden />
          {backLabel}
        </Button>
        {isFetching && !isPending ? (
          <Skeleton className="size-4 rounded-full" aria-label="Đang cập nhật" />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-4 sm:px-6 lg:px-8">
        {isPending ? (
          <div className="space-y-6">
            <div className="space-y-2 border-b border-slate-200 pb-4">
              <Skeleton className="h-7 w-48 max-w-full" />
              <Skeleton className="h-5 w-64 max-w-full" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
            <DetailSkeleton />
          </div>
        ) : isError || !data ? (
          <div className="flex h-52 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-destructive">Không tải được chi tiết hồ sơ xử phạt.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-sm font-medium text-sky-700 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="flex min-w-0 flex-1 flex-col gap-5">
            <TabsList
              className={cn(
                'h-auto w-full justify-start gap-6 rounded-none bg-transparent p-0',
                'border-b border-slate-200'
              )}
            >
              <TabsTrigger value="overview" className={DETAIL_TAB_TRIGGER}>
                <LayoutDashboard className="size-3.5 shrink-0" aria-hidden />
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="payment-history" className={DETAIL_TAB_TRIGGER}>
                <History className="size-3.5 shrink-0" aria-hidden />
                Lịch sử nộp phạt
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 space-y-6 focus-visible:ring-0">
              <InspectionDetailHeader data={data} onAssignClick={openTeamDialog} />
              <InspectionDetailBody key={data.id} data={data} />
            </TabsContent>

            <TabsContent value="payment-history" className="mt-0 focus-visible:ring-0">
              <PaymentHistoryPanel inspectionId={data.id} />
            </TabsContent>

            <AssignInspectionTeamDialog
              open={teamDialogOpen}
              onOpenChange={setTeamDialogOpen}
              inspectionId={data.id}
              mode={teamDialogMode}
              currentTeamId={data.assignedTeamId}
            />
          </Tabs>
        )}
      </div>
    </div>
  );
}
