'use client';

// import { ReportAssignmentPanel } from '@/components/officer/tracking/ReportAssignmentPanel';
import { Button } from '@/components/ui/button';
import { useReportDetail } from '@/hooks/useOfficer';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type { ReportDetail, ReportSeverity, ReportStatus } from '@/lib/api/services/fetchReport';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  AlignLeft,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Hourglass,
  LayoutGrid,
  Layers,
  MapPin,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Tag,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

// ── Token maps (re-used from queue) ───────────────────────────────────────────

const SEVERITY_LABEL: Record<ReportSeverity, string> = {
  Critical: 'Nghiêm trọng',
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp',
};

const SEVERITY_SET_BY_LABEL: Record<string, string> = {
  User: 'Người dùng',
  AI: 'Hệ thống AI',
  Officer: 'Cán bộ',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  Submitted: 'Chờ xác minh',
  Verified: 'Đã xác minh',
  Dispatched: 'Chờ phân công',
  Assigned: 'Đã phân công',
  InProgress: 'Đang xử lý',
  Resolved: 'Đã giải quyết',
  Closed: 'Đã đóng',
  Rejected: 'Từ chối',
  Duplicate: 'Trùng lặp',
  PenaltyIssued: 'Đã xử phạt',
  ClosedNoViolation: 'Đóng — không vi phạm',
};

/** Badge mức độ — chỉ dùng ở chế độ xem, không áp dụng dropdown Select. */
const SEVERITY_CLASS: Record<ReportSeverity, string> = {
  Critical: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  High: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  Medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};

const STATUS_CLASS: Record<ReportStatus, string> = {
  Submitted: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Verified: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Dispatched: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  Assigned: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  InProgress: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Resolved: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  Closed: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200',
  Rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Duplicate: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  PenaltyIssued: 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200',
  ClosedNoViolation: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200',
};

function SeverityBadge({ severity }: { severity: ReportSeverity }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold',
        SEVERITY_CLASS[severity]
      )}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold',
        STATUS_CLASS[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// ── SLA countdown ─────────────────────────────────────────────────────────────

type SlaLevel = 'safe' | 'warn' | 'critical' | 'overdue';

interface SlaTokenSet {
  bar: string;
  badge: string;
  badgeLabel: string;
  countdownBg: string;
  countdownText: string;
  countdownLabel: string;
  verifyBtn: string;
  bannerText: string | null;
}

const SLA_TOKENS: Record<SlaLevel, SlaTokenSet> = {
  safe: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    badgeLabel: 'Trong hạn',
    countdownBg: 'bg-emerald-50 border-emerald-200',
    countdownText: 'text-emerald-700',
    countdownLabel: 'Thời gian còn lại',
    verifyBtn: 'bg-emerald-600 hover:bg-emerald-500',
    bannerText: null,
  },
  warn: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    badgeLabel: 'Cần chú ý',
    countdownBg: 'bg-amber-50 border-amber-200',
    countdownText: 'text-amber-700',
    countdownLabel: 'Thời gian còn lại',
    verifyBtn: 'bg-orange-500 hover:bg-orange-400',
    bannerText: null,
  },
  critical: {
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    badgeLabel: 'Sắp hết hạn',
    countdownBg: 'bg-red-50 border-red-200',
    countdownText: 'text-red-700',
    countdownLabel: 'Thời gian còn lại',
    verifyBtn: 'bg-red-600 hover:bg-red-500',
    bannerText: 'Sắp hết hạn xác minh — cần xử lý ngay',
  },
  overdue: {
    bar: 'bg-red-700',
    badge: 'bg-red-700 text-white',
    badgeLabel: 'Quá hạn',
    countdownBg: 'bg-red-100 border-red-300',
    countdownText: 'text-red-700',
    countdownLabel: 'Báo cáo này cần xử xác minh ngay',
    verifyBtn: 'bg-red-700 hover:bg-red-600',
    bannerText: null,
  },
};

/**
 * useSlaCountdown — single 1Hz tick, derive everything else from `now`.
 * Tick stops when component unmounts (clearInterval cleanup).
 */
function useSlaCountdown(createdAt: string, slaDueAt: string) {
  const startMs = useMemo(() => new Date(createdAt).getTime(), [createdAt]);
  const endMs = useMemo(() => new Date(slaDueAt).getTime(), [slaDueAt]);
  const totalMs = Math.max(1, endMs - startMs);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const isOverdue = now >= endMs;
  const elapsedMs = Math.min(totalMs, Math.max(0, now - startMs));
  const remainingMs = Math.max(0, endMs - now);
  const percentElapsed = Math.min(100, (elapsedMs / totalMs) * 100);

  let level: SlaLevel;
  if (isOverdue) level = 'overdue';
  else if (percentElapsed >= 75) level = 'critical';
  else if (percentElapsed >= 50) level = 'warn';
  else level = 'safe';

  return { isOverdue, remainingMs, percentElapsed, level, totalMs };
}

function formatHMS(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShort(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Sub-components ────────────────────────────────────────────────────────────

function HeaderStrip({
  detail,
  pendingCategoryName,
}: {
  detail: ReportDetail;
  pendingCategoryName: string;
}) {
  return (
    <h1 className="text-2xl font-bold tracking-tight text-foreground">
      Khu vực {pendingCategoryName} tại {detail.address}
    </h1>
  );
}

type GalleryImage = ReportDetail['media'][number];

function GalleryImg({
  img,
  sizes,
  className = '',
}: {
  img: GalleryImage;
  sizes: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={img.url}
        alt=""
        fill
        className="object-cover transition duration-300 hover:scale-105"
        sizes={sizes}
        unoptimized
      />
    </div>
  );
}

function GalleryModal({ images, onClose }: { images: GalleryImage[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center border-b border-border bg-white px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Đóng"
        >
          <X className="size-5" />
        </button>
        <span className="ml-4 text-sm font-semibold text-foreground">
          Tất cả ảnh ({images.length})
        </span>
      </div>
      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={img.id} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <Image
                src={img.url}
                alt={`Ảnh ${i + 1}`}
                fill
                className="object-cover"
                sizes="33vw"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Gallery({ media }: { media: ReportDetail['media'] }) {
  const images = media.filter(m => m.mediaType === 'Image');
  const [showAll, setShowAll] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        Không có hình ảnh
      </div>
    );
  }

  const showAllBtn = (
    <button
      type="button"
      onClick={() => setShowAll(true)}
      className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow transition hover:bg-white"
    >
      <Camera className="size-3.5" />
      Xem tất cả {images.length} ảnh
    </button>
  );

  const H = 'h-[480px]';
  const gap = 'gap-0.5';

  let grid: React.ReactNode;

  if (images.length === 1) {
    grid = (
      <div className={`relative ${H} overflow-hidden rounded-xl`}>
        <Image src={images[0].url} alt="" fill className="object-cover" sizes="100vw" unoptimized />
      </div>
    );
  } else if (images.length === 2) {
    grid = (
      <div className={`grid ${H} grid-cols-2 ${gap} overflow-hidden rounded-xl`}>
        <GalleryImg img={images[0]} sizes="50vw" />
        <GalleryImg img={images[1]} sizes="50vw" />
      </div>
    );
  } else if (images.length === 3) {
    grid = (
      <div className={`grid ${H} grid-cols-2 ${gap} overflow-hidden rounded-xl`}>
        <GalleryImg img={images[0]} sizes="50vw" />
        <div className={`grid grid-rows-2 ${gap}`}>
          <GalleryImg img={images[1]} sizes="50vw" />
          <GalleryImg img={images[2]} sizes="50vw" />
        </div>
      </div>
    );
  } else if (images.length === 4) {
    grid = (
      <div className={`grid ${H} grid-cols-2 ${gap} overflow-hidden rounded-xl`}>
        <GalleryImg img={images[0]} sizes="50vw" />
        <div className={`grid grid-rows-2 ${gap}`}>
          <GalleryImg img={images[1]} sizes="50vw" />
          <div className={`grid grid-cols-2 ${gap}`}>
            <GalleryImg img={images[2]} sizes="25vw" />
            <GalleryImg img={images[3]} sizes="25vw" />
          </div>
        </div>
      </div>
    );
  } else {
    // 5+ images — main layout: 1 big left + 2×2 right
    const sides = images.slice(1, 5);
    const hasMore = images.length > 5;
    grid = (
      <div className={`grid ${H} grid-cols-2 ${gap} overflow-hidden rounded-xl`}>
        <GalleryImg img={images[0]} sizes="50vw" />
        <div className={`grid grid-cols-2 grid-rows-2 ${gap}`}>
          {sides.map((img, i) => {
            const isLast = i === 3;
            return (
              <div key={img.id} className="relative overflow-hidden">
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover transition duration-300 hover:scale-105"
                  sizes="25vw"
                  unoptimized
                />
                {isLast && hasMore && showAllBtn}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      {grid}
      {showAll && <GalleryModal images={images} onClose={() => setShowAll(false)} />}
    </>
  );
}

function LocationCard({
  detail,
  pendingCategoryName,
  pendingSeverity,
  editing,
  pendingCategoryId,
  setPendingCategoryId,
  setPendingSeverity,
  categories,
  catsLoading,
}: {
  detail: ReportDetail;
  pendingCategoryName: string;
  pendingSeverity: ReportSeverity;
  editing: boolean;
  pendingCategoryId: string;
  setPendingCategoryId: (id: string) => void;
  setPendingSeverity: (s: ReportSeverity) => void;
  categories: { id: string; nameVi: string }[];
  catsLoading: boolean;
}) {
  const [mapType, setMapType] = useState<'m' | 'k'>('m');
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const mapsUrl = `https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`;

  const readOnlyItems: Array<{
    icon: typeof TrendingUp;
    label: string;
    value: ReactNode;
  }> = [
    { icon: TrendingUp, label: 'Điểm ưu tiên', value: detail.priorityScore.toFixed(2) },
    { icon: Users, label: 'Lượt báo cáo', value: `${detail.reporterCount} người` },
    {
      icon: RefreshCw,
      label: 'Trạng thái',
      value: <StatusBadge status={detail.status} />,
    },
    {
      icon: RefreshCw,
      label: 'Đã mở lại',
      value: detail.reopenedCount > 0 ? `${detail.reopenedCount} lần` : 'Không',
    },
  ];

  // Inline-edit Select trigger: underline only, no border-box, matches read-only display size.
  const editSelectTriggerClass =
    'h-auto w-full rounded-none border-x-0 border-t-0 border-b border-foreground/40 bg-transparent px-0 py-1 text-lg font-medium text-foreground shadow-none focus:border-emerald-500 focus:ring-0 data-[state=open]:border-emerald-500';

  return (
    <div>
      {/* ── Section 1: Thông tin báo cáo ── */}
      <div className="border-t border-border py-8">
        <h2 className="text-2xl font-semibold text-foreground">Thông tin báo cáo ô nhiễm</h2>
        <div className="mt-5 grid grid-cols-1 gap-y-5 sm:grid-cols-2">
          {/* Loại ô nhiễm — inline editable */}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
              <Tag className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Loại ô nhiễm</p>
              {editing ? (
                <Select
                  value={pendingCategoryId}
                  onValueChange={setPendingCategoryId}
                  disabled={catsLoading}
                >
                  <SelectTrigger className={editSelectTriggerClass}>
                    <SelectValue placeholder={catsLoading ? 'Đang tải...' : 'Chọn loại'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id} className="text-base">
                        {cat.nameVi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg font-medium text-foreground">{pendingCategoryName}</p>
              )}
            </div>
          </div>

          {/* Mức độ — inline editable */}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
              <AlertTriangle className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Mức độ</p>
              {editing ? (
                <Select
                  value={pendingSeverity}
                  onValueChange={v => setPendingSeverity(v as ReportSeverity)}
                >
                  <SelectTrigger className={editSelectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Critical', 'High', 'Medium', 'Low'] as ReportSeverity[]).map(s => (
                      <SelectItem key={s} value={s} className="text-base">
                        {SEVERITY_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-0.5">
                  <SeverityBadge severity={pendingSeverity} />
                </div>
              )}
            </div>
          </div>

          {/* Read-only rows */}
          {readOnlyItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                <Icon className="size-4 text-muted-foreground" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="mt-0.5 text-lg font-medium text-foreground">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {detail.description && (
          <div className="mt-5 flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
              <AlignLeft className="size-4 text-muted-foreground" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Mô tả</p>
              <p className="text-base leading-relaxed text-foreground">{detail.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Map ── */}
      <div className="border-t border-border py-8">
        <h2 className="text-xl mb-6 font-semibold text-foreground">Nơi {pendingCategoryName}</h2>
        <p className="mb-6 text-base text-muted-foreground">{detail.address}</p>
        <div className="relative mt-3 overflow-hidden rounded-xl border border-border">
          <iframe
            key={mapType}
            title="map"
            width="100%"
            height="470"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${detail.latitude},${detail.longitude}&z=15&t=${mapType}&output=embed`}
            className="block"
          />
          {/* Layer toggle icon + panel */}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={() => setShowLayerPanel(v => !v)}
              className="flex size-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/10 transition hover:bg-gray-50"
              aria-label="Chọn loại bản đồ"
            >
              <Layers className="size-5 text-gray-700" />
            </button>

            {showLayerPanel && (
              <div className="w-36 overflow-hidden rounded-xl bg-white py-0.5 shadow-xl ring-1 ring-black/10">
                {/* Mặc định */}
                <button
                  type="button"
                  onClick={() => {
                    setMapType('m');
                    setShowLayerPanel(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs transition hover:bg-gray-50 ${mapType === 'm' ? 'font-semibold' : 'font-normal text-gray-700'}`}
                >
                  {/* Map icon — white background */}
                  <span className="flex size-6 shrink-0 items-center justify-center rounded border border-gray-200 bg-white">
                    <LayoutGrid className="size-3.5 text-gray-700" />
                  </span>
                  Mặc định
                </button>

                <div className="mx-3 border-t border-gray-100" />

                {/* Vệ tinh */}
                <button
                  type="button"
                  onClick={() => {
                    setMapType('k');
                    setShowLayerPanel(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-gray-50 ${mapType === 'k' ? 'font-semibold' : 'font-normal text-gray-700'}`}
                >
                  {/* Satellite icon — dark background */}
                  <span className="flex size-6 shrink-0 items-center justify-center rounded border border-gray-700 bg-gray-800">
                    <LayoutGrid className="size-3.5 text-white" />
                  </span>
                  Vệ tinh
                </button>
              </div>
            )}
          </div>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          <MapPin className="size-3" />
          Mở trên Google Maps
        </a>
      </div>
    </div>
  );
}

function AiInsightCard({ detail }: { detail: ReportDetail }) {
  const suspicious = detail.priorityScore >= 0.7;
  const possibleDuplicate = detail.reporterCount > 1;
  const reopened = detail.reopenedCount > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-foreground">Phân tích AI</h2>

      <div className="space-y-3">
        <InsightRow
          label="Nghi ngờ trùng"
          value={possibleDuplicate ? `${detail.reporterCount} báo cáo` : 'Không'}
          tone={possibleDuplicate ? 'warn' : 'neutral'}
        />
        <InsightRow
          label="Khả nghi"
          value={suspicious ? 'Có' : 'Không'}
          tone={suspicious ? 'danger' : 'neutral'}
        />
        <InsightRow
          label="Đã mở lại"
          value={reopened ? `${detail.reopenedCount} lần` : 'Không'}
          tone={reopened ? 'warn' : 'neutral'}
        />
        <InsightRow
          label="Điểm ưu tiên"
          value={detail.priorityScore.toFixed(2)}
          tone={suspicious ? 'warn' : 'neutral'}
        />
        <InsightRow
          label="Mức độ đặt bởi"
          value={SEVERITY_SET_BY_LABEL[detail.severitySetBy] ?? detail.severitySetBy}
          tone={detail.severitySetBy === 'AI' ? 'warn' : 'neutral'}
        />
      </div>
    </div>
  );
}

function InsightRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'warn' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'bg-red-50 text-red-600 ring-red-200'
      : tone === 'warn'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-gray-100 text-gray-500 ring-transparent';

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-lg text-muted-foreground">{label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-base font-semibold ring-1 ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

function SlaActionCard({
  detail,
  editingCategory,
  onToggleEditCategory,
}: {
  detail: ReportDetail;
  editingCategory: boolean;
  onToggleEditCategory: () => void;
}) {
  const { isOverdue, remainingMs, percentElapsed, level, totalMs } = useSlaCountdown(
    detail.createdAt,
    detail.slaVerifyDueAt
  );
  const tokens = SLA_TOKENS[level];

  const totalHours = Math.round(totalMs / 3600000);
  const startShort = formatShort(detail.createdAt);
  const endShort = formatShort(detail.slaVerifyDueAt);
  const startFull = formatDateTime(detail.createdAt);
  const endFull = formatDateTime(detail.slaVerifyDueAt);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Warning banner — only critical / overdue */}
      {tokens.bannerText && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{tokens.bannerText}</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <Shield className="size-4" />
            <h2 className="text-base font-semibold">Thời hạn xác minh</h2>
          </div>
        </div>

        {/* Big countdown box */}
        <div className={`mb-3 rounded-lg border px-4 py-5 text-center ${tokens.countdownBg}`}>
          <p
            className={`font-mono text-3xl font-bold tabular-nums tracking-wider ${tokens.countdownText}`}
            aria-live="polite"
          >
            {isOverdue ? 'QUÁ HẠN' : formatHMS(remainingMs)}
          </p>
          <p className={`mt-1 text-xs ${tokens.countdownText}`}>{tokens.countdownLabel}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-linear ${tokens.bar}`}
            style={{ width: `${percentElapsed}%` }}
            role="progressbar"
            aria-valuenow={Math.round(percentElapsed)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>{startShort}</span>
          <span className={`font-medium ${tokens.countdownText}`}>
            {Math.round(percentElapsed)}% đã qua
          </span>
          <span>{endShort}</span>
        </div>

        {/* Info list */}
        <div className="mb-5 space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-3.5" />
              Báo cáo lúc
            </span>
            <span className="font-medium text-foreground">{startFull}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-3.5" />
              Hạn chót
            </span>
            <span className="font-medium text-foreground">{endFull}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Hourglass className="size-3.5" />
              Tổng thời gian
            </span>
            <span className="font-medium text-foreground">{totalHours} giờ</span>
          </div>
        </div>

        {/* Chỉnh loại — xác minh/từ chối qua cổng bản đồ DEO */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={onToggleEditCategory}
            className={
              editingCategory
                ? 'col-span-2 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                : 'col-span-2 text-foreground'
            }
            aria-pressed={editingCategory}
          >
            {editingCategory ? (
              <Check className="mr-1.5 size-4" />
            ) : (
              <SlidersHorizontal className="mr-1.5 size-4" />
            )}
            {editingCategory ? 'Hoàn tất chỉnh' : 'Chỉnh loại'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  detail,
  onAssignNow,
  status,
  editingCategory,
  onToggleEditCategory,
}: {
  detail: ReportDetail;
  onAssignNow: () => void;
  status: ReportStatus;
  editingCategory: boolean;
  onToggleEditCategory: () => void;
}) {
  if (status === 'InProgress') {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Trạng thái</h2>
        <div className="flex flex-col items-center rounded-lg bg-purple-50/70 px-4 py-5 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-purple-100 ring-4 ring-purple-50">
            <Hourglass className="size-6 text-purple-600" />
          </div>
          <p className="mt-3 text-lg font-semibold text-purple-700">Đang xử lý</p>
          <p className="mt-1 text-base text-muted-foreground">
            Báo cáo đã được phân công đội và đang trong quá trình khắc phục.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'Verified' || status === 'Dispatched') {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Trạng thái</h2>
        <div className="flex flex-col items-center rounded-lg bg-emerald-50/70 px-4 py-5 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>
          <p className="mt-3 text-lg font-semibold text-emerald-700">
            {status === 'Dispatched' ? 'Chờ phân công' : 'Đã xác minh'}
          </p>
          <p className="mt-1 text-base text-muted-foreground">
            {status === 'Dispatched'
              ? 'Báo cáo đã dispatch và sẵn sàng gán đội xử lý.'
              : 'Báo cáo đã được xác nhận hợp lệ và sẵn sàng phân công.'}
          </p>
        </div>

        <Button
          className="mt-4 w-full rounded-4xl bg-emerald-600 text-white hover:bg-emerald-500"
          onClick={onAssignNow}
        >
          Phân công đội xử lý
        </Button>
      </div>
    );
  }

  if (status !== 'Submitted') {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Trạng thái</h2>
        <div className="flex flex-col items-center rounded-lg bg-muted/50 px-4 py-5 text-center">
          <p className="text-lg font-semibold text-foreground">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <SlaActionCard
      detail={detail}
      editingCategory={editingCategory}
      onToggleEditCategory={onToggleEditCategory}
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function VerifyDetailClient({
  id,
  onBack,
  detailMode = 'verify',
}: {
  id: string;
  /** Khi embed (vd. tab Phân công) — quay lại danh sách thay vì route /officer/verify */
  onBack?: () => void;
  /** `tracking` — hiển thị panel phân công & chuyển giao đội. */
  detailMode?: 'verify' | 'tracking';
}) {
  const router = useRouter();
  const { data: detail, isLoading, isError } = useReportDetail(id);
  const { data: categories = [], isLoading: catsLoading } = useCatalogPollutionCategories();

  const [pendingCategoryId, setPendingCategoryId] = useState<string>('');
  const [pendingSeverity, setPendingSeverity] = useState<ReportSeverity>('Medium');
  const [editingCategory, setEditingCategory] = useState(false);

  // Sync pending state once detail loads (runs once)
  const [synced, setSynced] = useState(false);
  if (detail && !synced) {
    setPendingCategoryId(detail.categoryId);
    setPendingSeverity(detail.severity);
    setSynced(true);
  }

  const pendingCategoryName =
    categories.find(c => c.id === pendingCategoryId)?.nameVi ?? detail?.categoryName ?? '';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-40 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-56 animate-pulse rounded-xl bg-muted" />
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="space-y-4">
        <BackLink onBack={onBack} />
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Không thể tải chi tiết báo cáo. Vui lòng thử lại.
        </div>
      </div>
    );
  }

  const handleAssignNow = () => {
    if (onBack && detailMode !== 'tracking') {
      onBack();
      return;
    }
    router.push(`/officer/assign?highlightReportId=${detail.id}`);
  };

  return (
    <div className="space-y-4">
      <BackLink onBack={onBack} />

      <HeaderStrip detail={detail} pendingCategoryName={pendingCategoryName} />

      <Gallery media={detail.media} />

      {/* Content below gallery — padded on both sides */}
      <div className="px-14 xl:px-24">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left — scrollable content */}
          <div className="min-w-0 space-y-4">
            {/* Title block */}
            <div className="pb-4 pt-4">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Được báo cáo bởi{' '}
                {SEVERITY_SET_BY_LABEL[detail.severitySetBy] ?? detail.severitySetBy}
              </h1>
              <div className="mt-1.5 flex items-center gap-1.5 text-base text-muted-foreground">
                <MapPin className="size-3.5 shrink-0 text-red-500" />
                <span>{detail.address}</span>
                <span className="size-1 rounded-full bg-foreground" />
                <span>
                  {new Date(detail.createdAt).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <LocationCard
              detail={detail}
              pendingCategoryName={pendingCategoryName}
              pendingSeverity={pendingSeverity}
              editing={editingCategory}
              pendingCategoryId={pendingCategoryId}
              setPendingCategoryId={setPendingCategoryId}
              setPendingSeverity={setPendingSeverity}
              categories={categories}
              catsLoading={catsLoading}
            />

            {detailMode === 'tracking' && (
              // <ReportAssignmentPanel detail={detail} onGoToAssign={handleAssignNow} />
              <div>ReportAssignmentPanel</div>
            )}
          </div>

          {/* Right — sticky: AI insight above action card */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-19 lg:self-start">
            <AiInsightCard detail={detail} />
            <ActionCard
              detail={detail}
              onAssignNow={handleAssignNow}
              status={detail.status}
              editingCategory={editingCategory}
              onToggleEditCategory={() => setEditingCategory(v => !v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BackLink({ onBack }: { onBack?: () => void }) {
  const className =
    'inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground';

  if (onBack) {
    return (
      <button type="button" onClick={onBack} className={className}>
        <ArrowLeft className="size-3.5" />
        Quay lại danh sách
      </button>
    );
  }

  return (
    <Link href="/officer/assign" className={className}>
      <ArrowLeft className="size-3.5" />
      Quay lại danh sách
    </Link>
  );
}
