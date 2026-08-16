'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  History,
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { AssignInspectionTeamDialog } from '@/components/officer/recurrence/AssignInspectionTeamDialog';
import { RecordPaymentDialog } from '@/components/officer/recurrence/RecordPaymentDialog';
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
import { goBackWithListSoftReload } from '@/utils/notificationNavigation';
import { useQueryClient } from '@tanstack/react-query';
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
    loading: () => <Skeleton className="h-36 w-full rounded-lg" />,
  }
);

const RECURRENCE_LIST_PATH = '/officer/recurrence';

function inspectionDetailBackHref(options: {
  isInspectionsQueueRoute: boolean;
  inspectionId: string;
  reportId: string | null | undefined;
}): string {
  if (options.isInspectionsQueueRoute) {
    const params = new URLSearchParams({ tab: 'inspections' });
    if (options.inspectionId) params.set('highlight', options.inspectionId);
    return `${RECURRENCE_LIST_PATH}?${params.toString()}`;
  }
  const reportId = options.reportId?.trim();
  if (reportId) {
    return `${RECURRENCE_LIST_PATH}?${new URLSearchParams({ highlight: reportId }).toString()}`;
  }
  return RECURRENCE_LIST_PATH;
}

const EMPTY = {
  team: 'Chưa gán đội thanh tra',
  subject: 'Đối tượng: Chưa cập nhật · Sẽ được Đội thanh tra bổ sung sau khảo sát',
  evidence: 'Chưa có bằng chứng hiện trường',
  categoryEmpty: 'Chưa có',
  penalty: 'Chưa ban hành quyết định xử phạt',
  waitingAccept: 'Đang chờ Đội thanh tra nhận việc',
} as const;

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

/**
 * Mục checklist hiện ở Điều 3 (bằng chứng).
 * `ViolationStatus` tách riêng → Điều 1 (4 dòng mô tả).
 */
const CHECKLIST_SECTIONS = [
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

/** 4 dòng «Tình trạng vi phạm» hiển thị ở Điều 1 thay cho một ô Mô tả. */
type ViolationDetailKey = 'location' | 'scale' | 'exhibits' | 'note';

const VIOLATION_DETAIL_FIELDS: { key: ViolationDetailKey; label: string }[] = [
  { key: 'location', label: 'Vị trí cụ thể' },
  { key: 'scale', label: 'Mức độ - quy mô vi phạm' },
  { key: 'exhibits', label: 'Tang vật - hành vi vi phạm' },
  { key: 'note', label: 'Ghi chú thêm' },
];

/** Ghép mô tả checklist ViolationStatus (có thể nhiều item). */
function joinViolationStatusText(items: InspectionChecklistEvidence[]): string {
  return items
    .filter(i => (i.category?.trim() || '') === 'ViolationStatus')
    .map(i => i.description?.trim())
    .filter((t): t is string => Boolean(t))
    .join('\n');
}

/**
 * Tách text có nhãn (mobile) thành 4 trường.
 * Không khớp nhãn → đổ toàn bộ vào «Tang vật - hành vi vi phạm» (thay chỗ mô tả cũ).
 */
function parseViolationDetailFields(
  raw: string,
  fallbackDescription?: string | null
): Record<ViolationDetailKey, string | null> {
  const empty: Record<ViolationDetailKey, string | null> = {
    location: null,
    scale: null,
    exhibits: null,
    note: null,
  };

  const text = raw.trim();
  if (!text) {
    const fb = fallbackDescription?.trim() || null;
    return fb ? { ...empty, exhibits: fb } : empty;
  }

  const labelMatchers: { key: ViolationDetailKey; re: RegExp }[] = [
    { key: 'location', re: /Vị trí cụ thể\s*:?/gi },
    { key: 'scale', re: /Mức độ\s*[-–—]\s*quy mô vi phạm\s*:?/gi },
    { key: 'exhibits', re: /Tang vật\s*[-–—]\s*hành vi vi phạm\s*:?/gi },
    { key: 'note', re: /Ghi chú thêm\s*:?/gi },
  ];

  type Hit = { key: ViolationDetailKey; start: number; end: number };
  const hits: Hit[] = [];
  for (const { key, re } of labelMatchers) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m) hits.push({ key, start: m.index, end: m.index + m[0].length });
  }

  if (hits.length === 0) {
    return { ...empty, exhibits: text };
  }

  hits.sort((a, b) => a.start - b.start);
  const result = { ...empty };
  for (let i = 0; i < hits.length; i += 1) {
    const hit = hits[i]!;
    const valueStart = hit.end;
    const valueEnd = i + 1 < hits.length ? hits[i + 1]!.start : text.length;
    const value = text.slice(valueStart, valueEnd).trim().replace(/^:\s*/, '');
    result[hit.key] = value || null;
  }
  return result;
}

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

/** Còn / quá hạn so với `slaInspectionDueAt` — khớp caption Hạn xử lý trên report detail. */
function formatSlaRemaining(dueIso: string): string | null {
  const due = new Date(dueIso).getTime();
  if (Number.isNaN(due)) return null;
  const hours = Math.round((due - Date.now()) / (60 * 60 * 1000));
  if (hours < 0) {
    const abs = Math.abs(hours);
    if (abs < 24) return `Quá hạn ${abs} giờ`;
    return `Quá hạn ${Math.floor(abs / 24)} ngày`;
  }
  if (hours < 24) return `Còn ${hours} giờ`;
  return `Còn ${Math.floor(hours / 24)} ngày`;
}

function MetaRow({
  icon: Icon,
  label,
  children,
  align = 'center',
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  align?: 'center' | 'start';
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[auto_10.5rem_minmax(0,1fr)] gap-x-3 gap-y-1',
        align === 'start' ? 'items-start' : 'items-center'
      )}
    >
      <Icon
        className={cn(
          'size-4 shrink-0 self-center text-muted-foreground',
          align === 'start' && 'mt-0.5 self-start'
        )}
        aria-hidden
      />
      <span
        className={cn(
          'text-sm leading-5 text-muted-foreground',
          align === 'start' ? 'pt-0.5' : 'leading-5'
        )}
      >
        {label}
      </span>
      <div className={cn('min-w-0 text-sm leading-5', align === 'center' && 'flex items-center')}>
        {children}
      </div>
    </div>
  );
}

function formatVnd(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

/** Tên gọi để ký — từ cuối trong họ tên VN (VD "Xử Phạt Trưởng" → "Trưởng"). */
function resolveGivenName(fullName: string | null | undefined): string | null {
  const trimmed = fullName?.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1] ?? null;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

function canManageInspectionTeam(status: string): boolean {
  return status === 'Draft' || status === 'InProgress';
}

function hasAssignedTeam(assignedTeamId: string | null | undefined): boolean {
  return Boolean(assignedTeamId?.trim());
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

/**
 * Native `<source type>` từ BE thường sai (`audio/m4a`, `audio/x-m4a`, `video/mp4`)
 * → Chrome/Safari bỏ source, nút play không phát. Gắn `src` trên `<audio>`, để browser sniff.
 */
function FieldAudioPlayer({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <p className="text-sm text-slate-500">
        Không phát được ghi âm.{' '}
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sky-700 hover:underline"
        >
          Tải file
        </a>
      </p>
    );
  }

  return (
    <audio
      key={src}
      src={src}
      controls
      preload="metadata"
      playsInline
      className="w-full"
      onError={() => setFailed(true)}
    />
  );
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

/** Section label — đồng bộ officer detail (CommunityCleanup SectionHeading). */
function SectionEyebrow({ index, label }: { index: number; label: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="font-mono text-sm font-semibold tabular-nums text-brand sm:text-base">
        {String(index).padStart(2, '0')}
      </span>
      <span className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
        {label}
      </span>
    </div>
  );
}

const INSPECTION_MINUTES_SECTION_ID = 'inspection-minutes';

function Section({
  index,
  title,
  children,
  action,
  description,
  id,
}: {
  index: number;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="w-full min-w-0 scroll-mt-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="min-w-0">
          <SectionEyebrow index={index} label={title} />
          {description ? (
            <p className="mt-1.5 text-xs font-normal text-slate-500">{description}</p>
          ) : null}
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

/**
 * Một "chỗ điền" trong biên bản giấy: nhãn nhỏ phía trên (như tiêu đề in sẵn
 * trên form), giá trị viết vào gạch chân — filled = đã có dữ liệu thật,
 * unfilled = gạch chân trống (chưa điền, chờ Đội thanh tra/Thanh tra cập nhật).
 */
function MinuteField({
  label,
  value,
  span = 1,
  placeholder = '.......................................',
}: {
  label: string;
  value: ReactNode | null | undefined;
  span?: 1 | 2;
  placeholder?: string;
}) {
  const isEmpty = value == null || value === '';
  return (
    <div className={cn('min-w-0', span === 2 && 'sm:col-span-2')}>
      <p className="text-[10.5px] font-medium tracking-wide text-slate-400 uppercase">{label}</p>
      <p
        className={cn(
          'mt-1.5 border-b border-dotted border-slate-300 pb-2 text-sm leading-relaxed wrap-break-word',
          isEmpty ? 'text-slate-300 italic' : 'font-medium text-slate-900'
        )}
      >
        {isEmpty ? placeholder : value}
      </p>
    </div>
  );
}

/** Điều mục đánh số trong biên bản — kiểu "Điều 1.", "Điều 2." của văn bản hành chính. */
function MinuteArticle({
  number,
  title,
  children,
  /** true = xếp dọc full-width, khoảng cách dòng rộng hơn (Điều 1). */
  stacked = false,
}: {
  number: number;
  title: string;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div className="border-t border-slate-100 pt-6 first:border-t-0 first:pt-0">
      <h4 className="mb-4 text-sm font-semibold text-slate-800">
        <span className="text-brand">Điều {number}. </span> {title}
      </h4>
      <div
        className={
          stacked ? 'grid grid-cols-1 gap-y-6' : 'grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2'
        }
      >
        {children}
      </div>
    </div>
  );
}

const EXHIBIT_LETTERS = ['a', 'b', 'c', 'd'] as const;

/**
 * Bằng chứng checklist trình bày như mục con của Điều (a., b., c. …) —
 * chữ + media nằm ngay trong luồng văn bản, không dùng card/border kiểu
 * app-widget để giữ cảm giác một tờ biên bản liền mạch.
 */
function MinuteExhibits({ items }: { items: InspectionChecklistEvidence[] }) {
  const buckets = useMemo(() => partitionEvidence(items), [items]);

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

  return (
    <div className="space-y-5">
      <ReportImagePreviewDialog
        images={photoPreview}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChangeIndex={setPreviewIndex}
      />

      {CHECKLIST_SECTIONS.map((section, i) => {
        const list = buckets[section.key];
        return (
          <div key={section.key} className="grid grid-cols-[1.25rem_1fr] gap-x-1">
            <span className="text-[13px] font-medium text-slate-400">{EXHIBIT_LETTERS[i]}.</span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-700">{section.label}</p>

              {list.length === 0 ? (
                <p className="mt-1 border-b border-dotted border-slate-300 pb-2 text-sm text-slate-300 italic">
                  {EMPTY.categoryEmpty}
                </p>
              ) : section.kind === 'photo' ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {list.map(item => {
                    const url = item.mediaUrl;
                    if (!url || !isImageMime(item.mimeType, url)) {
                      return (
                        <div
                          key={item.id}
                          className="flex size-16 items-center justify-center rounded bg-slate-100 text-[10px] text-slate-400"
                        >
                          Lỗi
                        </div>
                      );
                    }
                    const idx = photoPreview.findIndex(p => p.url === url);
                    return (
                      <ClickableReportImage
                        key={item.id}
                        url={url}
                        label={item.description || 'Ảnh hiện trường'}
                        uploadedAt={item.uploadedAt ?? undefined}
                        onPreview={() => setPreviewIndex(idx >= 0 ? idx : 0)}
                        className="size-16 rounded ring-1 ring-slate-200 transition hover:ring-brand/50"
                      />
                    );
                  })}
                </div>
              ) : section.kind === 'video' ? (
                <div className="mt-1.5 space-y-2">
                  {list.map(item => (
                    <div key={item.id} className="max-w-xs">
                      {item.mediaUrl && isVideoMime(item.mimeType, item.mediaUrl) ? (
                        <video
                          controls
                          preload="metadata"
                          className="aspect-video w-full rounded bg-slate-900 object-contain"
                        >
                          <source src={item.mediaUrl} type={item.mimeType ?? undefined} />
                        </video>
                      ) : (
                        <p className="text-sm text-slate-500">Không phát được video</p>
                      )}
                      <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400">
                        {[formatViDateTime(item.uploadedAt), formatDuration(item.durationSeconds)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : section.kind === 'audio' ? (
                <div className="mt-1.5 space-y-2">
                  {list.map(item => (
                    <div key={item.id} className="max-w-md">
                      {item.mediaUrl ? (
                        <FieldAudioPlayer src={item.mediaUrl} />
                      ) : (
                        <p className="text-sm text-slate-500">Không có file ghi âm</p>
                      )}
                      <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400">
                        {[formatViDateTime(item.uploadedAt), formatDuration(item.durationSeconds)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-1 space-y-1.5">
                  {list.map(item => (
                    <p key={item.id} className="text-sm text-slate-800">
                      {item.description?.trim() ? item.description : null}
                      {item.mediaUrl ? (
                        <a
                          href={item.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
                        >
                          <FileText className="size-3" aria-hidden />
                          Tệp đính kèm
                        </a>
                      ) : null}
                      <span className="ml-1.5 font-mono text-[11px] tabular-nums text-slate-400">
                        ({formatViDateTime(item.uploadedAt)})
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Biên bản vi phạm hành chính — tờ văn bản thật thay cho danh sách key-value:
 * tiêu đề quốc hiệu, các Điều đánh số, chỗ trắng được điền trực tiếp từ dữ liệu
 * hồ sơ (InspectionDetail). Không cần bấm — mọi mục luôn hiển thị đầy đủ.
 */
type StampTone = 'unpaid' | 'partial' | 'paid';

const PAYMENT_STAMP: Record<string, { text: string; tone: StampTone } | undefined> = {
  PenaltyIssued: { text: 'CHƯA THANH TOÁN', tone: 'unpaid' },
  Overdue: { text: 'QUÁ HẠN NỘP PHẠT', tone: 'unpaid' },
  PartiallyPaid: { text: 'NỘP MỘT PHẦN', tone: 'partial' },
  Paid: { text: 'ĐÃ THANH TOÁN', tone: 'paid' },
  /** Sau ghi nhận nộp phạt đủ, BE chuyển Closed — vẫn hiện mộc đã thanh toán. */
  Closed: { text: 'ĐÃ THANH TOÁN', tone: 'paid' },
};

/**
 * Con dấu trạng thái nộp phạt — đóng dán lên góc biên bản như dấu mộc thật,
 * thay cho ô thống kê Đã nộp/Còn lại/Tiến độ tách riêng. Chỉ hiện khi hồ sơ
 * đã ban hành QĐ xử phạt (trạng thái nộp phạt mới có ý nghĩa). Kèm địa danh
 * LEO lập hồ sơ + ngày (ban hành QĐ / ngày nộp gần nhất khi đã thanh toán).
 */
function latestPaymentAt(payments: InspectionPayment[]): string | null {
  let latest: string | null = null;
  let latestMs = Number.NEGATIVE_INFINITY;
  for (const p of payments) {
    const iso = p.paidAt?.trim() || p.createdAt?.trim() || null;
    if (!iso) continue;
    const t = new Date(iso).getTime();
    if (!Number.isNaN(t) && t >= latestMs) {
      latestMs = t;
      latest = iso;
    }
  }
  return latest;
}

function PaymentStamp({
  status,
  issuerLabel,
  stampedAt,
}: {
  status: string;
  issuerLabel: string | null;
  stampedAt: string | null | undefined;
}) {
  const stamp = PAYMENT_STAMP[status];
  if (!stamp) return null;

  const toneClass =
    stamp.tone === 'unpaid'
      ? 'border-red-600 text-red-600'
      : stamp.tone === 'partial'
        ? 'border-amber-600 text-amber-600'
        : 'border-red-600 text-red-600';

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-6 right-4 z-10 -rotate-12 select-none sm:top-8 sm:right-8',
        'rounded-md border-[3px] px-3 py-1.5 text-center font-mono uppercase sm:px-4 sm:py-2',
        'opacity-80 mix-blend-multiply',
        toneClass
      )}
      aria-hidden
    >
      <p className="text-[11px] font-black tracking-[0.08em] sm:text-sm">{stamp.text}</p>
      {issuerLabel ? (
        <p className="mt-0.5 text-[8px] font-semibold tracking-wide normal-case sm:text-[9px]">
          {issuerLabel}
        </p>
      ) : null}
      {stampedAt ? (
        <p className="text-[8px] font-semibold tabular-nums normal-case sm:text-[9px]">
          {formatViDateTime(stampedAt)}
        </p>
      ) : null}
    </div>
  );
}

function MinutesDocument({ data }: { data: InspectionDetail }) {
  const entity = data.violatingEntity;
  const subjectName = resolveInspectionSubjectName(entity?.name, data.violatorName);
  const displayName = entity?.name?.trim() || subjectName;
  const displayAddress =
    entity?.address?.trim() || data.violatorAddress?.trim() || data.arrivalNote?.trim() || null;
  const identity = entity?.identityNumber?.trim() || data.violatorIdentity?.trim() || null;

  const showPenaltyFields = inspectionShowsPenaltyFields(data.status);
  const showClosed = inspectionShowsClosedAt(data.status);
  const inspectorFullName =
    data.issuedByInspectorName?.trim() || data.createdByOfficerName?.trim() || null;
  const inspectorSignature = resolveGivenName(inspectorFullName);

  const paymentStamp = PAYMENT_STAMP[data.status];
  const stampAt =
    paymentStamp?.tone === 'paid' || paymentStamp?.tone === 'partial'
      ? (latestPaymentAt(data.payments) ?? data.penaltyIssuedAt)
      : data.penaltyIssuedAt;

  const violationDetailFields = parseViolationDetailFields(
    joinViolationStatusText(data.checklistEvidence),
    data.violationDescription
  );

  return (
    <Panel className="relative overflow-hidden !px-0 !py-0 sm:!px-0">
      <PaymentStamp
        status={data.status}
        issuerLabel={data.createdByOfficerName?.trim() || null}
        stampedAt={stampAt}
      />

      {/* Tiêu đầu — quốc hiệu rút gọn kiểu văn bản hành chính */}
      <div className=" border-slate-200 px-6 py-6 text-center sm:px-10">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
          Cộng hòa xã hội chủ nghĩa việt nam
        </p>
        <p className="text-[11px] font-semibold text-slate-400">Độc lập – Tự do – Hạnh phúc</p>
        <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900 sm:text-lg">
          Biên bản kiểm tra, xử lý vi phạm môi trường
        </h3>
        <p className="mt-1.5 font-mono text-xs tabular-nums text-slate-400">
          Số hồ sơ: {data.reportCode?.trim() || data.id}
        </p>
      </div>

      <div className="space-y-7 px-10 py-7 sm:px-20 sm:py-9">
        <MinuteArticle number={1} title="Nội dung vi phạm" stacked>
          {VIOLATION_DETAIL_FIELDS.map(({ key, label }) => (
            <MinuteField key={key} label={label} value={violationDetailFields[key]} />
          ))}
        </MinuteArticle>

        <MinuteArticle number={2} title="Đối tượng vi phạm">
          <MinuteField label="Tên / đơn vị" value={displayName} span={2} />
          <MinuteField label="Địa chỉ" value={displayAddress} span={2} />
          <MinuteField label="CCCD / MST" value={identity || entity?.taxCode?.trim()} />
          <MinuteField
            label="Tái phạm"
            value={data.isRepeatOffender ? 'Có tái phạm' : 'Không tái phạm'}
          />
        </MinuteArticle>

        <div className="border-t border-slate-100 pt-6">
          <h4 className="mb-4 text-sm font-semibold text-slate-800">
            <span className="text-brand">Điều 3. </span> Quá trình điều tra &amp; bằng chứng hiện
            trường
          </h4>
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <MinuteField
              label="Tiếp nhận nhiệm vụ"
              value={data.acceptedAt ? formatViDateTime(data.acceptedAt) : null}
            />
            <MinuteField
              label="Xác nhận hiện trường"
              value={data.arrivalConfirmedAt ? formatViDateTime(data.arrivalConfirmedAt) : null}
            />
            <MinuteField
              label="Nộp báo cáo hiện trường"
              value={
                data.fieldInvestigationSubmittedAt
                  ? formatViDateTime(data.fieldInvestigationSubmittedAt)
                  : null
              }
              span={2}
            />
          </div>

          <div className="mt-4">
            {data.checklistEvidence.length > 0 ? (
              <MinuteExhibits items={data.checklistEvidence} />
            ) : (
              <p className="border-b border-dotted border-slate-300 pb-2 text-sm text-slate-300 italic">
                {EMPTY.evidence}
              </p>
            )}
          </div>
        </div>

        {showPenaltyFields ? (
          <MinuteArticle number={4} title="Quyết định xử phạt">
            <MinuteField label="Mức vi phạm" value={violationLevelLabelVi(data.violationLevel)} />
            <MinuteField label="Số tiền phạt" value={formatVnd(data.penaltyAmount)} />
            <MinuteField label="Số quyết định" value={data.penaltyDecisionNumber?.trim()} />
            <MinuteField
              label="Ngày ban hành"
              value={data.penaltyIssuedAt ? formatViDateTime(data.penaltyIssuedAt) : null}
            />
            <MinuteField
              label="Hạn nộp phạt"
              value={data.penaltyDueDate ? formatViDateTime(data.penaltyDueDate) : null}
            />
            <MinuteField label="Người ban hành" value={data.issuedByInspectorName?.trim()} />
            {data.additionalPenaltyMeasures?.trim() ? (
              <MinuteField
                label="Biện pháp kèm theo"
                value={data.additionalPenaltyMeasures}
                span={2}
              />
            ) : null}
          </MinuteArticle>
        ) : (
          <MinuteArticle number={4} title="Quyết định xử phạt">
            <MinuteField label="Số quyết định" value={null} span={2} />
          </MinuteArticle>
        )}

        {showClosed ? (
          <MinuteArticle number={5} title="Đóng hồ sơ">
            <MinuteField label="Lý do đóng" value={data.closedReason?.trim()} span={2} />
            <MinuteField
              label="Ngày đóng"
              value={data.closedAt ? formatViDateTime(data.closedAt) : null}
              span={2}
            />
          </MinuteArticle>
        ) : null}
      </div>

      {/* Chỗ ký — chỉ người được giao xử phạt, nằm bên phải như văn bản giấy thật */}
      <div className="border-t border-slate-200 px-6 py-7 sm:px-10">
        <div className="ml-auto w-56 text-center">
          <p className="text-xs font-semibold text-slate-600">Người được giao xử phạt</p>
          <p className="mt-0.5 text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
          <p
            className={cn(
              'mt-8 font-mono text-base',
              inspectorSignature ? 'font-semibold text-slate-800' : 'text-slate-300 italic'
            )}
          >
            {inspectorSignature || '..............'}
          </p>
          <p className="mt-1 border-t border-dotted border-slate-300 pt-1.5 text-xs text-slate-600">
            {inspectorFullName || '.......................'}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function isValidCoordPair(
  lat: number | null | undefined,
  lng: number | null | undefined
): lat is number {
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

/** Ưu tiên GPS xác nhận hiện trường; fallback tọa độ báo cáo (`latitude` / `longitude`). */
function resolveFieldMapCoords(data: InspectionDetail): {
  latitude: number;
  longitude: number;
  source: 'arrival' | 'report';
} | null {
  if (isValidCoordPair(data.arrivalLatitude, data.arrivalLongitude)) {
    return {
      latitude: data.arrivalLatitude,
      longitude: data.arrivalLongitude!,
      source: 'arrival',
    };
  }
  if (isValidCoordPair(data.latitude, data.longitude)) {
    return {
      latitude: data.latitude,
      longitude: data.longitude!,
      source: 'report',
    };
  }
  return null;
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
  detail: ReactNode;
  tooltip?: string | null;
  done: boolean;
  /** Step tiếp nhận: avatar đội + tên + dòng thanh tra. */
  teamCard?: {
    teamId: string;
    teamName: string;
    inspectorName: string | null;
  } | null;
  /** Step xác nhận hiện trường. */
  arrivalScene?: {
    inspectorName: string | null;
    note: string | null;
    coords: { latitude: number; longitude: number } | null;
  } | null;
};

function buildProgressSteps(d: InspectionDetail): ProgressStep[] {
  const arrivalCoords = resolveFieldMapCoords(d);
  const teamCard = hasAssignedTeam(d.assignedTeamId)
    ? {
        teamId: d.assignedTeamId?.trim() || 'team',
        teamName: d.assignedTeamName?.trim() || 'Đội thanh tra',
        inspectorName: d.issuedByInspectorName?.trim() || null,
      }
    : null;

  const steps: ProgressStep[] = [
    {
      key: 'created',
      step: 1,
      shortLabel: 'Lập hồ sơ',
      title: 'Lập hồ sơ xử phạt',
      at: d.createdAt,
      detail: d.createdByOfficerName ? (
        <>
          Cán bộ lập hồ sơ:{' '}
          <span className="font-semibold text-slate-700">{d.createdByOfficerName}</span>
        </>
      ) : null,
      done: Boolean(d.createdAt),
    },
    {
      key: 'team',
      step: 2,
      shortLabel: 'Gán đội',
      title: 'Gán đội thanh tra',
      at: teamCard ? d.createdAt : null,
      detail: teamCard ? null : EMPTY.team,
      done: Boolean(teamCard),
      teamCard,
    },
    {
      key: 'accepted',
      step: 3,
      shortLabel: 'Tiếp nhận',
      title: 'Tiếp nhận nhiệm vụ',
      at: d.acceptedAt,
      detail: null,
      done: Boolean(d.acceptedAt),
      teamCard,
    },
    {
      key: 'arrival',
      step: 4,
      shortLabel: 'Hiện trường',
      title: 'Xác nhận hiện trường',
      at: d.arrivalConfirmedAt,
      detail: null,
      done: Boolean(d.arrivalConfirmedAt),
      arrivalScene: d.arrivalConfirmedAt
        ? {
            inspectorName: d.issuedByInspectorName?.trim() || null,
            note: d.arrivalNote?.trim() || null,
            coords: arrivalCoords
              ? { latitude: arrivalCoords.latitude, longitude: arrivalCoords.longitude }
              : null,
          }
        : null,
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
      detail: d.penaltyIssuedAt ? (
        <>
          {d.issuedByInspectorName?.trim() ? (
            <>
              Ban hành bởi cán bộ thanh tra{' '}
              <span className="font-semibold text-slate-700">{d.issuedByInspectorName.trim()}</span>
            </>
          ) : (
            'Đã ban hành quyết định xử phạt.'
          )}
          {d.penaltyDecisionNumber?.trim() ? (
            <>
              <br />
              Số QĐ: {d.penaltyDecisionNumber.trim()}
            </>
          ) : null}
        </>
      ) : null,
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
    /** Done theo `status` Closed* hoặc có `closedAt` (BE có thể set closedAt trước khi sync status). */
    done: d.status === 'Closed' || d.status === 'ClosedNoViolation' || Boolean(d.closedAt),
  });

  return steps;
}

/**
 * Timeline dọc — toàn bộ 7 mốc hiển thị cùng lúc như một hồ sơ pháp lý,
 * không ẩn sau click. Mốc hiện tại (chưa done, đầu tiên chưa xong) được
 * nhấn bằng viền + pulse; các mốc done nối bằng rail xanh brand đặc.
 */
function InvestigationTimeline({
  steps,
  currentKey,
}: {
  steps: ProgressStep[];
  currentKey: string;
}) {
  return (
    <ol className="relative">
      {steps.map((step, index) => {
        const isCurrent = step.key === currentKey;
        const isLast = index === steps.length - 1;
        const railFilled = step.done;

        return (
          <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  'absolute top-8 left-3.75 z-0 w-px translate-x-[-0.5px]',
                  'h-[calc(100%-2rem)]',
                  railFilled ? 'bg-brand' : 'bg-slate-200'
                )}
                aria-hidden
              />
            ) : null}

            <div className="relative z-10 flex size-8 shrink-0 items-center justify-center">
              {isCurrent ? (
                <span
                  className="pointer-events-none absolute inset-0 rounded-full bg-brand/30 media-step-pulse-ring"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full font-mono text-xs font-semibold tabular-nums',
                  step.done && 'bg-brand text-brand-foreground',
                  isCurrent &&
                    !step.done &&
                    'border-2 border-brand bg-white text-brand shadow-sm ring-4 ring-brand/15',
                  !step.done && !isCurrent && 'border border-slate-200 bg-white text-slate-400'
                )}
                aria-hidden
              >
                {step.done ? <Check className="size-4" /> : step.step}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              {/* Title + time — căn giữa theo chiều cao vòng step (size-8) */}
              <div className="flex min-h-8 items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                  <h3
                    className={cn(
                      'text-sm font-semibold leading-none',
                      step.done || isCurrent ? 'text-slate-900' : 'text-slate-400'
                    )}
                  >
                    {step.title}
                  </h3>
                  {isCurrent && !step.done ? (
                    <span className="inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                      Đang chờ
                    </span>
                  ) : null}
                  {step.tooltip ? (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="font-mono text-[11px] text-slate-400 underline decoration-dotted hover:text-slate-600"
                          >
                            id
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="font-mono text-xs">
                          {step.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                </div>
                <span className="shrink-0 text-right text-xs leading-none tabular-nums text-slate-500">
                  {step.at ? (
                    formatViDateTime(step.at)
                  ) : step.done ? (
                    '—'
                  ) : (
                    <span className="italic text-slate-400">Chưa thực hiện</span>
                  )}
                </span>
              </div>

              {step.teamCard ? (
                <div className="mt-5 mb-1 flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200/80"
                    aria-hidden
                  >
                    {getInitials(step.teamCard.teamName)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{step.teamCard.teamName}</p>
                    {step.teamCard.inspectorName ? (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Cán bộ thanh tra{' '}
                        <span className="font-semibold text-slate-700">
                          {step.teamCard.inspectorName} (Đội trưởng)
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : step.arrivalScene ? (
                <div className="mt-3 max-w-lg space-y-3 pt-1">
                  <p className="text-sm leading-relaxed text-slate-600">
                    {step.arrivalScene.inspectorName ? (
                      <>
                        Hiện trường xác nhận bởi{' '}
                        <span className="font-semibold text-slate-700">
                          cán bộ thanh tra {step.arrivalScene.inspectorName} (Đội trưởng)
                        </span>
                      </>
                    ) : (
                      'Hiện trường đã được xác nhận.'
                    )}
                  </p>
                  {step.arrivalScene.note ? (
                    <div className="flex items-center gap-2 border-l-2 border-brand/50 pl-2.5">
                      <span className="shrink-0 text-sm font-semibold text-slate-700">
                        Ghi chú:
                      </span>
                      <p className="min-w-0 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word text-slate-500">
                        {step.arrivalScene.note}
                      </p>
                    </div>
                  ) : null}
                  {step.arrivalScene.coords ? (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-500">Xem vị trí hiện trường</p>
                      <div className="overflow-hidden rounded-lg ring-1 ring-slate-200/90">
                        <ReportLocationMap
                          latitude={step.arrivalScene.coords.latitude}
                          longitude={step.arrivalScene.coords.longitude}
                          className="h-36 w-full"
                        />
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${step.arrivalScene.coords.latitude},${step.arrivalScene.coords.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline"
                      >
                        <MapPin className="size-3.5" aria-hidden />
                        Mở Maps
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : step.key === 'field' && step.done ? (
                <button
                  type="button"
                  className="mt-5 mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline"
                  onClick={() => {
                    document
                      .getElementById(INSPECTION_MINUTES_SECTION_ID)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <FileText className="size-3.5" aria-hidden />
                  Xem thông tin biên bản điều tra
                </button>
              ) : step.detail ? (
                <p
                  className={cn(
                    'max-w-lg text-sm leading-relaxed text-slate-500',
                    step.key === 'created' ? 'mt-5 mb-1' : 'mt-1.5'
                  )}
                >
                  {step.detail}
                </p>
              ) : !step.done &&
                (step.key === 'accepted' || step.key === 'arrival' || step.key === 'field') ? (
                <p className="mt-1.5 text-sm text-slate-400">
                  Chờ Đội thanh tra cập nhật trên Mobile.
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function partitionEvidence(items: InspectionChecklistEvidence[]) {
  const buckets: Record<ChecklistKey, InspectionChecklistEvidence[]> = {
    ScenePhoto: [],
    Video: [],
    Audio: [],
    Other: [],
  };

  for (const item of items) {
    const raw = item.category?.trim() || 'Other';
    // ViolationStatus đã chuyển lên Điều 1 — không hiện lại ở Điều 3.
    if (raw === 'ViolationStatus') continue;
    if (raw === 'ScenePhoto' || raw === 'Video' || raw === 'Audio') {
      buckets[raw].push(item);
    } else {
      buckets.Other.push(item);
    }
  }

  return buckets;
}

function PaymentTable({ payments }: { payments: InspectionPayment[] }) {
  if (payments.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có khoản nộp nào được ghi nhận.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
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

/** Tab lịch sử nộp phạt — GET /v1/inspections/{id}/payments. Chỉ xem, hành động ghi nhận nộp phạt nằm ở tab Tổng quan. */
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
        <h2 className="text-lg font-bold tracking-tight text-slate-900">Lịch sử nộp phạt</h2>
        {isFetching ? (
          <Skeleton className="size-4 rounded-full" aria-label="Đang cập nhật" />
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3">
          <p className="text-xs font-normal text-slate-500">Tổng tiền phạt</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
            {formatVnd(data.penaltyAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3">
          <p className="text-xs font-normal text-slate-500">Đã nộp</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-800">
            {formatVnd(data.paidAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3">
          <p className="text-xs font-normal text-slate-500">Còn lại</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
            {formatVnd(data.remainingAmount)}
          </p>
        </div>
      </div>

      <Panel>
        <p className="mb-3 text-xs font-medium text-slate-500">
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
  'hover:text-slate-900',
  'focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-0',
  'data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-slate-900 data-[state=active]:shadow-none',
  'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent',
  'data-[state=active]:after:bg-brand'
);

/** Banner disclaimer đồ án — cột phải cạnh meta «Hồ sơ xử phạt» (thấy ngay khi mở trang). */
function CapstoneMinutesDisclaimer() {
  return (
    <aside
      role="note"
      aria-label="Lưu ý: biên bản mô phỏng đồ án"
      className="flex w-fit max-w-full justify-self-end gap-3 rounded-lg border-2 border-amber-400 bg-amber-50 px-3.5 py-3 shadow-sm ring-1 ring-amber-300/50 sm:px-4 sm:py-3.5"
    >
      <AlertTriangle
        className="mt-0.5 size-5 shrink-0 text-amber-600"
        strokeWidth={2.25}
        aria-hidden
      />
      <div className="min-w-0 space-y-1.5">
        <p className="text-[11px] font-bold tracking-wide text-amber-900 uppercase">
          Lưu ý — không có giá trị pháp lý
        </p>
        <ul className="list-none space-y-1 text-xs leading-snug text-amber-950/95 sm:text-[13px]">
          <li>
            Biên bản nhằm <span className="font-semibold">biểu diễn thông tin</span> vi phạm ô nhiễm
            trên hệ thống GreenLens.
          </li>
          <li>Không phải biểu mẫu hành chính chính thức.</li>
          <li>Không có giá trị pháp lý.</li>
          <li>Không đại diện quy trình / biểu mẫu của cơ quan nhà nước áp dụng thực tế.</li>
        </ul>
      </div>
    </aside>
  );
}

function InspectionDetailHeader({
  data,
  onAssignClick,
}: {
  data: InspectionDetail;
  onAssignClick: (mode: 'assign' | 'change') => void;
}) {
  const pathname = usePathname();
  const slaOverdue = inspectionSlaIsOverdue(data.status, data.slaInspectionDueAt);
  const teamAssigned = hasAssignedTeam(data.assignedTeamId);
  const canTeamAction = canManageInspectionTeam(data.status);
  const teamLabel = data.assignedTeamName?.trim() || 'Đã gán đội';

  const reportHref = data.reportId
    ? `/officer/verify/${data.reportId}?from=${encodeURIComponent(pathname)}`
    : null;

  const reportCode = data.reportCode?.trim() || null;
  const slaRemaining = data.slaInspectionDueAt ? formatSlaRemaining(data.slaInspectionDueAt) : null;

  return (
    <header className="border-b border-slate-200 pb-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-8">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h1 className="text-xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl">
              Hồ sơ xử phạt
            </h1>
            <span
              className={cn(
                'inline-flex shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold leading-none',
                inspectionStatusBadgeClass(data.status)
              )}
            >
              {inspectionStatusLabelVi(data.status)}
            </span>
            {data.isRepeatOffender ? (
              <span className="inline-flex shrink-0 rounded-md bg-orange-100 px-2 py-0.5 text-[11px] font-semibold leading-none text-orange-800">
                Tái phạm
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex min-w-0 max-w-full items-center gap-1">
            {reportHref ? (
              <Link
                href={reportHref}
                className="truncate font-mono text-sm tabular-nums text-slate-400 hover:text-brand hover:underline"
              >
                {reportCode || 'Báo cáo gốc'}
              </Link>
            ) : (
              <span className="truncate font-mono text-sm tabular-nums text-slate-400">
                {reportCode || '—'}
              </span>
            )}
            {reportCode ? <CopyIconButton value={reportCode} label="Mã báo cáo" /> : null}
          </div>

          <div className="mt-5 space-y-4">
            <MetaRow icon={UserRound} label="Cán bộ lập hồ sơ">
              <p className="text-sm font-semibold text-foreground">
                {data.createdByOfficerName?.trim() || '—'}
              </p>
            </MetaRow>

            <MetaRow icon={CalendarDays} label="Hạn xử lý">
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium tabular-nums',
                    slaOverdue ? 'text-red-600' : 'text-foreground'
                  )}
                >
                  {data.slaInspectionDueAt ? formatViDateTime(data.slaInspectionDueAt) : '—'}
                </p>
                {slaRemaining ? (
                  <p
                    className={cn(
                      'mt-0.5 text-xs',
                      slaOverdue ? 'font-medium text-red-600' : 'text-muted-foreground'
                    )}
                  >
                    {slaRemaining}
                  </p>
                ) : null}
              </div>
            </MetaRow>

            <MetaRow icon={Users} label="Đội phụ trách">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5">
                <p
                  className={cn(
                    'text-sm',
                    teamAssigned ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {teamAssigned ? teamLabel : 'Chưa phân công'}
                </p>
                {canTeamAction ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 px-2.5 text-xs font-medium"
                    onClick={() => onAssignClick(teamAssigned ? 'change' : 'assign')}
                  >
                    {teamAssigned ? 'Đổi đội' : 'Gán đội'}
                  </Button>
                ) : null}
              </div>
            </MetaRow>
          </div>
        </div>

        <CapstoneMinutesDisclaimer />
      </div>
    </header>
  );
}

function InspectionDetailBody({
  data,
  onRecordPaymentClick,
}: {
  data: InspectionDetail;
  onRecordPaymentClick: () => void;
}) {
  const steps = useMemo(() => buildProgressSteps(data), [data]);

  const currentKey = useMemo(() => {
    // Chỉ đánh dấu mốc đang chờ; khi mọi step đã xong → không còn "current".
    return steps.find(s => !s.done)?.key ?? '';
  }, [steps]);

  const waitingAccept = data.status === 'Draft' && !data.acceptedAt ? EMPTY.waitingAccept : null;

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {/* 1) Tiến độ điều tra (trái, sticky) + Biên bản (phải, hẹp như trang giấy) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:gap-10">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Section
            index={1}
            title="Tiến độ điều tra"
            description="Toàn bộ mốc xử lý hồ sơ"
            action={
              waitingAccept ? (
                <span
                  title={waitingAccept}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200/70"
                >
                  <Clock className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">Chờ đội nhận việc</span>
                </span>
              ) : undefined
            }
          >
            <InvestigationTimeline steps={steps} currentKey={currentKey} />
          </Section>
        </div>

        <Section
          id={INSPECTION_MINUTES_SECTION_ID}
          index={2}
          title="Biên bản"
          description="Mô phỏng trực quan — không phải biểu mẫu hành chính chính thức"
          action={
            data.canRecordPayment ? (
              <Button
                type="button"
                size="sm"
                className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand-dark"
                onClick={onRecordPaymentClick}
              >
                <Banknote className="size-3.5" aria-hidden />
                Ghi nhận nộp phạt
              </Button>
            ) : undefined
          }
        >
          <MinutesDocument data={data} />
        </Section>
      </div>
    </div>
  );
}

export function InspectionDetailClient() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const inspectionId = typeof params.id === 'string' ? params.id : '';

  const isInspectionsQueueRoute = pathname.startsWith('/officer/inspections');

  const { data, isPending, isError, isFetching, refetch } = useInspectionDetail(inspectionId);
  const backPath = inspectionDetailBackHref({
    isInspectionsQueueRoute,
    inspectionId,
    reportId: data?.reportId,
  });
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamDialogMode, setTeamDialogMode] = useState<'assign' | 'change'>('assign');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

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
          className="gap-1.5 px-2 text-slate-500 hover:text-slate-900"
          onClick={() =>
            goBackWithListSoftReload({
              router,
              queryClient,
              from: null,
              fallbackHref: backPath,
            })
          }
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại danh sách
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
              <InspectionDetailBody
                key={data.id}
                data={data}
                onRecordPaymentClick={() => {
                  void refetch();
                  setPaymentDialogOpen(true);
                }}
              />
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
            <RecordPaymentDialog
              open={paymentDialogOpen}
              onOpenChange={setPaymentDialogOpen}
              inspectionId={data.id}
              remainingAmount={
                data.penaltyAmount != null && data.paidAmount != null
                  ? data.penaltyAmount - data.paidAmount
                  : data.penaltyAmount
              }
            />
          </Tabs>
        )}
      </div>
    </div>
  );
}
