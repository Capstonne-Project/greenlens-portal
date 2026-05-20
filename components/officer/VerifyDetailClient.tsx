'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRejectReport, useReportDetail, useVerifyReport } from '@/hooks/useOfficer';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type { ReportDetail, ReportSeverity, ReportStatus } from '@/lib/api/services/fetchReport';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  MapPin,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// ── Token maps (re-used from queue) ───────────────────────────────────────────

const SEVERITY_LABEL: Record<ReportSeverity, string> = {
  Critical: 'Nghiêm trọng',
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp',
};

const STATUS_CLASS: Record<ReportStatus, string> = {
  Submitted: 'bg-blue-50 text-blue-600',
  Verified: 'bg-emerald-50 text-emerald-600',
  InProgress: 'bg-purple-50 text-purple-600',
  Resolved: 'bg-green-50 text-green-600',
  Rejected: 'bg-red-50 text-red-600',
  Duplicate: 'bg-gray-100 text-gray-500',
  Closed: 'bg-gray-100 text-gray-500',
  PenaltyIssued: 'bg-orange-50 text-orange-600',
  ClosedNoViolation: 'bg-slate-100 text-slate-500',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSla(iso: string): { text: string; overdue: boolean } {
  const due = new Date(iso);
  const now = new Date();
  if (due < now) {
    const h = Math.floor((now.getTime() - due.getTime()) / 3600000);
    return { text: `Quá hạn ${h}h`, overdue: true };
  }
  const ms = due.getTime() - now.getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return { text: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, overdue: false };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HeaderStrip({
  detail,
  pendingCategoryName,
  pendingSeverity,
}: {
  detail: ReportDetail;
  pendingCategoryName: string;
  pendingSeverity: ReportSeverity;
}) {
  const sla = formatSla(detail.slaVerifyDueAt);
  const categoryChanged = pendingCategoryName !== detail.categoryName;
  const severityChanged = pendingSeverity !== detail.severity;

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-bold tracking-tight text-foreground">{detail.code}</h1>

        <Badge
          variant="secondary"
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[detail.status]}`}
        >
          {detail.status}
        </Badge>

        {detail.isAnonymous && (
          <Badge
            variant="outline"
            className="rounded-full border-gray-200 px-2.5 py-0.5 text-xs text-gray-500"
          >
            Citizen ẩn danh
          </Badge>
        )}

        <div className="flex-1" />

        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Hạn xử lý
          </p>
          <p
            className={`font-mono text-sm font-semibold ${sla.overdue ? 'text-red-500' : 'text-foreground'}`}
          >
            {sla.text}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          {'Loại: '}
          <span
            className={`font-medium ${categoryChanged ? 'text-emerald-600' : 'text-foreground'}`}
          >
            {pendingCategoryName}
          </span>
        </span>
        <span className="size-1.5 rounded-full bg-foreground/70" />
        <span>
          {'Mức độ: '}
          <span
            className={`font-medium ${severityChanged ? 'text-emerald-600' : 'text-foreground'}`}
          >
            {SEVERITY_LABEL[pendingSeverity]}
          </span>
        </span>
        <span className="size-1.5 rounded-full bg-foreground/70" />
        <span>{formatDateTime(detail.createdAt)}</span>
      </div>
    </div>
  );
}

function Gallery({ media }: { media: ReportDetail['media'] }) {
  const images = media.filter(m => m.mediaType === 'Image');
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        Không có hình ảnh
      </div>
    );
  }

  const safeActive = Math.min(active, images.length - 1);
  const current = images[safeActive];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted">
        {current && (
          <Image
            src={current.url}
            alt={`Hình ảnh ${safeActive + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 60vw"
            unoptimized
          />
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive(p => (p === 0 ? images.length - 1 : p - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setActive(p => (p === images.length - 1 ? 0 : p + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white">
              {safeActive + 1}/{images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-md ring-2 transition ${
                i === safeActive ? 'ring-emerald-500' : 'ring-transparent hover:ring-border'
              }`}
              aria-label={`Chọn ảnh ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={`Thumb ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LocationCard({
  detail,
  pendingCategoryName,
  pendingSeverity,
}: {
  detail: ReportDetail;
  pendingCategoryName: string;
  pendingSeverity: ReportSeverity;
}) {
  const [copied, setCopied] = useState(false);
  const coords = `${detail.latitude.toFixed(6)}, ${detail.longitude.toFixed(6)}`;
  const mapsUrl = `https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coords);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Vị trí & mô tả</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Toạ độ
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="font-mono text-sm font-semibold text-foreground">{coords}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Copy toạ độ"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Địa chỉ suy diễn
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{detail.address || '—'}</p>
          {(detail.wardCode || detail.provinceCode) && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {detail.wardCode} · {detail.provinceCode}
            </p>
          )}
        </div>
      </div>

      {/* Map preview placeholder — replace with real map SDK later */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative mt-4 block aspect-[16/7] overflow-hidden rounded-lg border border-border bg-gradient-to-br from-emerald-50 via-sky-50 to-violet-50 transition hover:opacity-90"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1.5">
            <MapPin className="size-7 text-red-500 drop-shadow" />
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur">
              Mở trên Google Maps
            </span>
          </div>
        </div>
      </a>

      {/* Severity classification */}
      <div className="mt-4 rounded-lg bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900">
        {'Loại: '}
        <span
          className={`font-semibold ${pendingCategoryName !== detail.categoryName ? 'underline decoration-dotted' : ''}`}
        >
          {pendingCategoryName}
        </span>
        {' · Mức độ: '}
        <span
          className={`font-semibold ${pendingSeverity !== detail.severity ? 'underline decoration-dotted' : ''}`}
        >
          {SEVERITY_LABEL[pendingSeverity]}
        </span>
        {' · Đặt bởi: '}
        <span className="font-semibold">{detail.severitySetBy}</span>
      </div>

      {detail.description && (
        <p className="mt-3 text-sm leading-relaxed text-foreground">Mô tả: {detail.description}</p>
      )}
    </div>
  );
}

function AiInsightCard({ detail }: { detail: ReportDetail }) {
  const suspicious = detail.priorityScore >= 0.7;
  const possibleDuplicate = detail.reporterCount > 1;
  const reopened = detail.reopenedCount > 0;

  const SEVERITY_SET_BY_LABEL: Record<string, string> = {
    User: 'Người dùng',
    AI: 'AI',
    Officer: 'Cán bộ',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Phân tích AI</h2>

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
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

function EditCategoryDialog({
  open,
  onClose,
  onSave,
  categoryId,
  setCategoryId,
  severity,
  setSeverity,
  categories,
  catsLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
  severity: ReportSeverity;
  setSeverity: (s: ReportSeverity) => void;
  categories: { id: string; nameVi: string }[];
  catsLoading: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Chỉnh loại / mức độ</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Loại ô nhiễm
            </label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={catsLoading}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder={catsLoading ? 'Đang tải...' : 'Chọn loại'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id} className="text-sm">
                    {cat.nameVi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Mức độ nghiêm trọng
            </label>
            <Select value={severity} onValueChange={v => setSeverity(v as ReportSeverity)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['Critical', 'High', 'Medium', 'Low'] as ReportSeverity[]).map(s => (
                  <SelectItem key={s} value={s} className="text-sm">
                    {SEVERITY_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
            onClick={() => {
              onSave();
              onClose();
            }}
          >
            <Check className="mr-1.5 size-4" />
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}

function VerifySuccessDialog({
  open,
  reportCode,
  onClose,
  onAssignNow,
}: {
  open: boolean;
  reportCode: string;
  onClose: () => void;
  onAssignNow: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
            <CheckCircle2 className="size-7 text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Xác minh thành công</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Báo cáo <span className="font-semibold text-foreground">{reportCode}</span> đã chuyển
            sang trạng thái <span className="font-semibold text-emerald-700">Đã xác minh</span>. Bạn
            có muốn phân công đội xử lý ngay để bắt đầu khắc phục không?
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Để sau
          </Button>
          <Button
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
            onClick={onAssignNow}
          >
            Phân công ngay
          </Button>
        </div>
      </div>
    </div>
  );
}

function RejectReportDialog({
  open,
  onClose,
  onConfirm,
  reportCode,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  reportCode: string;
  submitting: boolean;
}) {
  const [reason, setReason] = useState('');

  const QUICK_REASONS = [
    'Hình ảnh không rõ ràng, không đủ căn cứ xác minh.',
    'Vị trí GPS không khớp với ảnh báo cáo.',
    'Nội dung không thuộc phạm vi ô nhiễm môi trường.',
    'Báo cáo trùng với báo cáo đã xử lý trước đó.',
  ];

  if (!open) return null;

  const trimmed = reason.trim();
  const tooShort = trimmed.length < 10;
  const canSubmit = !tooShort && !submitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Từ chối báo cáo</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Vui lòng ghi rõ lý do từ chối báo cáo{' '}
              <span className="font-semibold text-foreground">{reportCode}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Lý do thường gặp
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] text-foreground transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {r.slice(0, 32)}…
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="reject-reason"
              className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder="Mô tả lý do cụ thể (tối thiểu 10 ký tự)..."
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
            <p className="mt-1 flex items-center justify-between text-[11px]">
              <span
                className={
                  tooShort && trimmed.length > 0 ? 'text-red-500' : 'text-muted-foreground'
                }
              >
                {tooShort && trimmed.length > 0
                  ? `Tối thiểu 10 ký tự (hiện tại ${trimmed.length})`
                  : 'Lý do sẽ gửi tới người báo cáo qua thông báo.'}
              </span>
              <span className="text-muted-foreground">{trimmed.length}/500</span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
            Huỷ
          </Button>
          <Button
            className="flex-1 bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300"
            onClick={() => canSubmit && onConfirm(trimmed)}
            disabled={!canSubmit}
          >
            <X className="mr-1.5 size-4" />
            {submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  onVerify,
  onReject,
  onAssignNow,
  verifyPending,
  rejectPending,
  status,
  pendingCategoryId,
  setPendingCategoryId,
  pendingSeverity,
  setPendingSeverity,
  categories,
  catsLoading,
}: {
  onVerify: () => void;
  onReject: () => void;
  onAssignNow: () => void;
  verifyPending: boolean;
  rejectPending: boolean;
  status: ReportStatus;
  pendingCategoryId: string;
  setPendingCategoryId: (id: string) => void;
  pendingSeverity: ReportSeverity;
  setPendingSeverity: (s: ReportSeverity) => void;
  categories: { id: string; nameVi: string }[];
  catsLoading: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const alreadyVerified = status !== 'Submitted';

  if (alreadyVerified) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Trạng thái</h2>
        <div className="flex flex-col items-center rounded-lg bg-emerald-50/70 px-4 py-5 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>
          <p className="mt-3 text-sm font-semibold text-emerald-700">Đã xác minh</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Báo cáo đã được xác nhận hợp lệ và sẵn sàng phân công.
          </p>
        </div>

        {status === 'Verified' && (
          <Button
            className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-500"
            onClick={onAssignNow}
          >
            Phân công đội xử lý
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Hành động xác minh</h2>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onVerify}
            disabled={verifyPending}
            className="col-span-2 bg-emerald-600 text-white hover:bg-emerald-500"
          >
            <Check className="mr-1.5 size-4" />
            {verifyPending ? 'Đang xử lý...' : 'Xác minh báo cáo'}
          </Button>

          <Button variant="outline" onClick={() => setEditOpen(true)} className="text-foreground">
            <SlidersHorizontal className="mr-1.5 size-4" />
            Chỉnh loại
          </Button>

          <Button variant="outline" className="text-foreground">
            <Copy className="mr-1.5 size-4" />
            Đánh dấu trùng
          </Button>

          <Button
            variant="outline"
            onClick={onReject}
            disabled={rejectPending}
            className="col-span-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <X className="mr-1.5 size-4" />
            Từ chối
          </Button>
        </div>
      </div>

      <EditCategoryDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={() => {}}
        categoryId={pendingCategoryId}
        setCategoryId={setPendingCategoryId}
        severity={pendingSeverity}
        setSeverity={setPendingSeverity}
        categories={categories}
        catsLoading={catsLoading}
      />
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function VerifyDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: detail, isLoading, isError } = useReportDetail(id);
  const verifyMutation = useVerifyReport();
  const rejectMutation = useRejectReport();
  const { data: categories = [], isLoading: catsLoading } = useCatalogPollutionCategories();

  const [pendingCategoryId, setPendingCategoryId] = useState<string>('');
  const [pendingSeverity, setPendingSeverity] = useState<ReportSeverity>('Medium');
  const [successOpen, setSuccessOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

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
        <BackLink />
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Không thể tải chi tiết báo cáo. Vui lòng thử lại.
        </div>
      </div>
    );
  }

  const handleVerify = () => {
    const dto: { overrideSeverity?: ReportSeverity; overrideCategoryId?: string } = {};
    if (pendingSeverity !== detail.severity) dto.overrideSeverity = pendingSeverity;
    if (pendingCategoryId !== detail.categoryId) dto.overrideCategoryId = pendingCategoryId;
    verifyMutation.mutate({ id: detail.id, dto }, { onSuccess: () => setSuccessOpen(true) });
  };

  const handleAssignNow = () => {
    setSuccessOpen(false);
    router.push(`/officer/assign?highlightReportId=${detail.id}`);
  };

  const handleReject = () => setRejectOpen(true);

  const handleConfirmReject = (reason: string) => {
    rejectMutation.mutate(
      { id: detail.id, dto: { reason } },
      { onSuccess: () => setRejectOpen(false) }
    );
  };

  return (
    <div className="space-y-4">
      <BackLink />

      <HeaderStrip
        detail={detail}
        pendingCategoryName={pendingCategoryName}
        pendingSeverity={pendingSeverity}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Gallery media={detail.media} />
          <LocationCard
            detail={detail}
            pendingCategoryName={pendingCategoryName}
            pendingSeverity={pendingSeverity}
          />
        </div>

        <div className="space-y-4">
          <AiInsightCard detail={detail} />
          <ActionCard
            onVerify={handleVerify}
            onReject={handleReject}
            onAssignNow={handleAssignNow}
            verifyPending={verifyMutation.isPending}
            rejectPending={rejectMutation.isPending}
            status={detail.status}
            pendingCategoryId={pendingCategoryId}
            setPendingCategoryId={setPendingCategoryId}
            pendingSeverity={pendingSeverity}
            setPendingSeverity={setPendingSeverity}
            categories={categories}
            catsLoading={catsLoading}
          />
        </div>
      </div>

      <VerifySuccessDialog
        open={successOpen}
        reportCode={detail.code}
        onClose={() => setSuccessOpen(false)}
        onAssignNow={handleAssignNow}
      />

      <RejectReportDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleConfirmReject}
        reportCode={detail.code}
        submitting={rejectMutation.isPending}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/officer/verify"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" />
      Quay lại danh sách
    </Link>
  );
}
