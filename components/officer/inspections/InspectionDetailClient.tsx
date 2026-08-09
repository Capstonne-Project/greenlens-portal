'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Banknote,
  Check,
  CircleAlert,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  History,
  LayoutDashboard,
  MapPin,
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

function Section({
  index,
  title,
  children,
  action,
  description,
}: {
  index: number;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <section className="w-full min-w-0">
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
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-slate-100 pt-6 first:border-t-0 first:pt-0">
      <h4 className="mb-4 text-sm font-semibold text-slate-800">
        <span className="text-brand">Điều {number}.</span> {title}
      </h4>
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

const EXHIBIT_LETTERS = ['a', 'b', 'c', 'd', 'e'] as const;

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
              ) : section.kind === 'text' ? (
                <div className="mt-1 space-y-2">
                  {list.map(item => (
                    <p key={item.id} className="text-sm leading-relaxed text-slate-800">
                      {item.description?.trim() || '—'}
                      <span className="ml-1.5 font-mono text-[11px] tabular-nums text-slate-400">
                        ({formatViDateTime(item.uploadedAt)})
                      </span>
                    </p>
                  ))}
                </div>
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
                    <div key={item.id} className="max-w-xs">
                      {item.mediaUrl && isAudioMime(item.mimeType, item.mediaUrl) ? (
                        <audio controls preload="metadata" className="w-full">
                          <source src={item.mediaUrl} type={item.mimeType ?? undefined} />
                        </audio>
                      ) : (
                        <p className="text-sm text-slate-500">Không phát được ghi âm</p>
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
};

/**
 * Con dấu trạng thái nộp phạt — đóng dán lên góc biên bản như dấu mộc thật,
 * thay cho ô thống kê Đã nộp/Còn lại/Tiến độ tách riêng. Chỉ hiện khi hồ sơ
 * đã ban hành QĐ xử phạt (trạng thái nộp phạt mới có ý nghĩa). Kèm địa danh
 * LEO lập hồ sơ + ngày ban hành QĐ — giống dấu mộc cơ quan có ghi ngày/nơi đóng.
 */
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
        : 'border-brand text-brand';

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
  const slaOverdue = inspectionSlaIsOverdue(data.status, data.slaInspectionDueAt);
  const inspectorFullName =
    data.issuedByInspectorName?.trim() || data.createdByOfficerName?.trim() || null;
  const inspectorSignature = resolveGivenName(inspectorFullName);

  const fieldCoords = resolveFieldMapCoords(data);
  const mapsHref = fieldCoords
    ? `https://www.google.com/maps?q=${fieldCoords.latitude},${fieldCoords.longitude}`
    : null;

  return (
    <Panel className="relative overflow-hidden !px-0 !py-0 sm:!px-0">
      <PaymentStamp
        status={data.status}
        issuerLabel={data.createdByOfficerName?.trim() || null}
        stampedAt={data.penaltyIssuedAt}
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
        <MinuteArticle number={1} title="Nội dung vi phạm">
          <MinuteField
            label="Mô tả hành vi vi phạm"
            value={data.violationDescription?.trim()}
            span={2}
          />
          <MinuteField label="Trạng thái hồ sơ" value={inspectionStatusLabelVi(data.status)} />
          <MinuteField
            label="Hạn xử lý (SLA)"
            value={
              data.slaInspectionDueAt ? (
                <span className={slaOverdue ? 'text-red-700' : undefined}>
                  {formatViDateTime(data.slaInspectionDueAt)}
                  {slaOverdue ? ' · Quá hạn' : ''}
                </span>
              ) : null
            }
          />
        </MinuteArticle>

        <div className="border-t border-slate-100 pt-6">
          <h4 className="mb-4 text-sm font-semibold text-slate-800">
            <span className="text-brand">Điều 2.</span> Đối tượng vi phạm &amp; vị trí hiện trường
          </h4>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <MinuteField label="Tên / đơn vị" value={displayName} span={2} />
              <MinuteField label="Địa chỉ" value={displayAddress} span={2} />
              <MinuteField label="CCCD / MST" value={identity || entity?.taxCode?.trim()} />
              <MinuteField
                label="Tái phạm"
                value={data.isRepeatOffender ? 'Có tái phạm' : 'Không tái phạm'}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1.5 text-[10.5px] font-medium tracking-wide text-slate-400 uppercase">
                Vị trí hiện trường
              </p>
              {fieldCoords ? (
                <div className="overflow-hidden rounded-lg ring-1 ring-slate-200/90">
                  <ReportLocationMap
                    latitude={fieldCoords.latitude}
                    longitude={fieldCoords.longitude}
                    className="h-32 w-full"
                  />
                  <div className="space-y-1 bg-slate-50 px-2.5 py-2">
                    <p className="font-mono text-[10px] leading-tight tabular-nums text-slate-500">
                      {fieldCoords.latitude.toFixed(5)}, {fieldCoords.longitude.toFixed(5)}
                    </p>
                    {mapsHref ? (
                      <a
                        href={mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-sky-700 hover:underline"
                      >
                        Mở Maps
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="border-b border-dotted border-slate-300 pb-2 text-sm text-slate-300 italic">
                  Chưa có tọa độ.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h4 className="mb-4 text-sm font-semibold text-slate-800">
            <span className="text-brand">Điều 3.</span> Quá trình điều tra &amp; bằng chứng hiện
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
            <MinuteField
              label="Ngày đóng"
              value={data.closedAt ? formatViDateTime(data.closedAt) : null}
            />
            <MinuteField label="Lý do đóng" value={data.closedReason?.trim()} />
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

/**
 * Timeline dọc — toàn bộ 7 mốc hiển thị cùng lúc như một hồ sơ pháp lý,
 * không ẩn sau click. Mốc hiện tại (chưa done, đầu tiên chưa xong) được
 * nhấn bằng viền + pulse; các mốc done nối bằng rail xanh brand đặc.
 */
function InvestigationTimeline({
  steps,
  currentKey,
  mapsHref,
}: {
  steps: ProgressStep[];
  currentKey: string;
  mapsHref: string | null;
}) {
  return (
    <ol className="relative">
      {steps.map((step, index) => {
        const isCurrent = step.key === currentKey;
        const isLast = index === steps.length - 1;
        const railFilled = step.done;

        return (
          <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  'absolute top-7 left-3.75 z-0 w-px translate-x-[-0.5px]',
                  'h-[calc(100%-1.75rem)]',
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

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h3
                  className={cn(
                    'text-sm font-semibold',
                    step.done || isCurrent ? 'text-slate-900' : 'text-slate-400'
                  )}
                >
                  {step.title}
                </h3>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {step.at ? (
                    formatViDateTime(step.at)
                  ) : step.done ? (
                    '—'
                  ) : (
                    <span className="italic text-slate-400">Chưa thực hiện</span>
                  )}
                </span>
                {isCurrent ? (
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
                      <TooltipContent className="font-mono text-xs">{step.tooltip}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>

              {step.detail ? (
                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-500">
                  {step.detail}
                </p>
              ) : !step.done &&
                (step.key === 'accepted' || step.key === 'arrival' || step.key === 'field') ? (
                <p className="mt-1.5 text-sm text-slate-400">
                  Chờ Đội thanh tra cập nhật trên Mobile.
                </p>
              ) : null}

              {step.key === 'arrival' && mapsHref ? (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline"
                >
                  <MapPin className="size-3.5" aria-hidden />
                  Xem vị trí hiện trường
                </a>
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
  const teamLabel = teamAssigned ? data.assignedTeamName?.trim() || 'Đã gán đội' : EMPTY.team;

  const reportHref = data.reportId
    ? `/officer/verify/${data.reportId}?from=${encodeURIComponent(pathname)}`
    : null;

  return (
    <header className="border-b border-slate-200 pb-5">
      <div className="min-w-0">
        {/* Tiêu đề đồng bộ list officer + badge nhỏ cạnh */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Hồ sơ xử phạt
          </h1>
          <span
            className={cn(
              'inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none',
              inspectionStatusBadgeClass(data.status)
            )}
          >
            {inspectionStatusLabelVi(data.status)}
          </span>
          {data.isRepeatOffender ? (
            <span className="inline-flex shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold leading-none text-orange-800">
              Tái phạm
            </span>
          ) : null}
        </div>

        {/* Code + Id — nhỏ hơn tiêu đề */}
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex min-w-0 max-w-full items-center gap-1">
            {reportHref ? (
              <Link
                href={reportHref}
                className="truncate font-mono text-xs font-semibold tracking-tight tabular-nums text-slate-600 hover:text-brand hover:underline sm:text-sm"
              >
                {data.reportCode?.trim() || 'Báo cáo gốc'}
              </Link>
            ) : (
              <span className="truncate font-mono text-xs font-semibold tracking-tight tabular-nums text-slate-600 sm:text-sm">
                {data.reportCode?.trim() || '—'}
              </span>
            )}
            {data.reportCode?.trim() ? (
              <CopyIconButton value={data.reportCode.trim()} label="Mã báo cáo" />
            ) : null}
          </div>

          <span aria-hidden className="hidden text-slate-300 sm:inline">
            ·
          </span>

          <div className="flex min-w-0 max-w-full items-center gap-1">
            <span className="sr-only">Id hồ sơ</span>
            <span className="min-w-0 truncate font-mono text-[11px] tabular-nums text-slate-400">
              {data.id}
            </span>
            <CopyIconButton value={data.id} label="Id hồ sơ" />
          </div>
        </div>

        <dl className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 sm:text-sm">
          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Người lập</dt>
            <dd>{data.createdByOfficerName?.trim() || '—'}</dd>
          </div>

          <span aria-hidden className="hidden text-slate-300 sm:inline">
            ·
          </span>

          <div className="flex items-baseline gap-1 font-mono tabular-nums">
            <dt className="not-sr-only text-slate-400">Tạo</dt>
            <dd>{formatViDateTime(data.createdAt)}</dd>
          </div>

          <span aria-hidden className="hidden text-slate-300 sm:inline">
            ·
          </span>

          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Đội thanh tra</dt>
            <dd>{teamLabel}</dd>
            {canTeamAction ? (
              <button
                type="button"
                className="font-medium text-brand hover:underline"
                onClick={() => onAssignClick(teamAssigned ? 'change' : 'assign')}
              >
                {teamAssigned ? 'Đổi đội' : 'Gán đội'}
              </button>
            ) : null}
          </div>
        </dl>

        {slaOverdue ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200/80">
            <CircleAlert className="size-3.5 shrink-0" aria-hidden />
            Hạn xử lý đã quá hạn — {formatViDateTime(data.slaInspectionDueAt)}
          </p>
        ) : null}
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
  const slaOverdue = inspectionSlaIsOverdue(data.status, data.slaInspectionDueAt);
  const steps = useMemo(() => buildProgressSteps(data), [data]);

  const currentKey = useMemo(() => {
    const firstPending = steps.find(s => !s.done);
    return firstPending?.key ?? steps[steps.length - 1]?.key ?? 'created';
  }, [steps]);

  const fieldCoords = resolveFieldMapCoords(data);
  const mapsHref = fieldCoords
    ? `https://www.google.com/maps?q=${fieldCoords.latitude},${fieldCoords.longitude}`
    : null;

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
            <p
              className={cn(
                'mb-4 font-mono text-xs tabular-nums',
                slaOverdue ? 'font-semibold text-red-600' : 'text-slate-500'
              )}
            >
              Hạn xử lý {formatViDateTime(data.slaInspectionDueAt)}
              {slaOverdue ? ' · Quá hạn' : ''}
            </p>
            <InvestigationTimeline steps={steps} currentKey={currentKey} mapsHref={mapsHref} />
          </Section>
        </div>

        <Section
          index={2}
          title="Biên bản"
          description="Điền trực tiếp từ dữ liệu hồ sơ"
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
  const inspectionId = typeof params.id === 'string' ? params.id : '';

  const isInspectionsQueueRoute = pathname.startsWith('/officer/inspections');
  const backPath = isInspectionsQueueRoute ? INSPECTIONS_LIST_PATH : RECURRENCE_LIST_PATH;
  const backLabel = isInspectionsQueueRoute
    ? 'Quay lại danh sách hồ sơ xử phạt'
    : 'Quay lại danh sách tái diễn';

  const { data, isPending, isError, isFetching, refetch } = useInspectionDetail(inspectionId);
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
              <InspectionDetailBody
                key={data.id}
                data={data}
                onRecordPaymentClick={() => setPaymentDialogOpen(true)}
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
