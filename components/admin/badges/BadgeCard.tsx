'use client';

import { BadgeIcon } from '@/components/admin/badges/BadgeIcon';
import { getBadgeDisplay } from '@/lib/constants/adminBadges';
import type { AdminBadge } from '@/lib/api/models/adminBadge';
import { formatBadgeThresholdValue, resolveBadgeIconUrl } from '@/utils/adminBadgeUi';
import { ArchiveRestore, CircleOff, Gauge, Pencil, Zap } from 'lucide-react';

interface BadgeCardProps {
  badge: AdminBadge;
  onEdit: (badge: AdminBadge) => void;
  onEditThreshold?: (badge: AdminBadge) => void;
  onToggle: (badge: AdminBadge, isActive: boolean) => void;
  onPreviewIcon?: (badge: AdminBadge) => void;
  toggleBusy?: boolean;
  thresholdBusy?: boolean;
}

function formatShortDate(iso: string | null): string {
  if (!iso?.trim()) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

function CriteriaChips({ badge }: { badge: AdminBadge }) {
  const chips: string[] = [];
  if (badge.requiredPoints != null) {
    chips.push(`${badge.requiredPoints.toLocaleString('vi-VN')} điểm`);
  }
  if (badge.requiredReportCount != null) {
    chips.push(`${badge.requiredReportCount.toLocaleString('vi-VN')} báo cáo`);
  }
  if (badge.requiredStreakDays != null) {
    chips.push(`${formatBadgeThresholdValue(badge.requiredStreakDays)} ngày liên tiếp`);
  }
  if (badge.requiredActionCount != null) {
    chips.push(`${formatBadgeThresholdValue(badge.requiredActionCount)} hành động`);
  }
  if (chips.length === 0) {
    return <span className="text-xs text-zinc-500">Điều kiện đặc biệt / thủ công</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(chip => (
        <span
          key={chip}
          className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

export function BadgeCard({
  badge,
  onEdit,
  onEditThreshold,
  onToggle,
  onPreviewIcon,
  toggleBusy,
  thresholdBusy,
}: BadgeCardProps) {
  const { accent } = getBadgeDisplay(badge.code);
  const inactive = !badge.isActive;
  const iconUrl = resolveBadgeIconUrl(badge.iconUrl);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        inactive ? 'bg-zinc-50' : 'bg-white'
      }`}
    >
      <div className="flex flex-1 flex-col p-5 pb-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold tabular-nums text-zinc-800">#{badge.code}</span>
          <span className="text-zinc-300" aria-hidden>
            ·
          </span>
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              inactive ? 'text-zinc-500' : 'text-zinc-600'
            }`}
          >
            {inactive ? (
              <CircleOff className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <Zap className="size-3.5 shrink-0" aria-hidden />
            )}
            {inactive ? 'Đã tắt' : 'Đang dùng'}
          </span>
        </div>

        <div className="mt-4 flex items-start gap-3">
          {iconUrl && onPreviewIcon ? (
            <button
              type="button"
              onClick={() => onPreviewIcon(badge)}
              className="shrink-0 rounded-full transition hover:ring-2 hover:ring-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              title="Xem icon"
              aria-label={`Xem icon ${badge.nameVi}`}
            >
              <BadgeIcon badge={badge} dimmed={inactive} />
            </button>
          ) : (
            <BadgeIcon badge={badge} dimmed={inactive} />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold leading-snug tracking-tight text-zinc-900">
              {badge.nameVi}
              {badge.nameEn ? (
                <span className="font-semibold text-zinc-500"> · {badge.nameEn}</span>
              ) : null}
            </h3>
            {badge.description ? (
              <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-zinc-600">
                {badge.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Điều kiện</p>
          <CriteriaChips badge={badge} />
        </div>

        <p className="mt-4 text-[11px] text-zinc-500">Tạo {formatShortDate(badge.createdAt)}</p>

        <div className="mt-4 flex items-center justify-end gap-1.5">
          {onEditThreshold ? (
            <button
              type="button"
              disabled={thresholdBusy}
              onClick={() => onEditThreshold(badge)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              title="Sửa ngưỡng"
              aria-label={`Sửa ngưỡng ${badge.nameVi}`}
            >
              <Gauge className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onEdit(badge)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-zinc-700 transition hover:bg-zinc-100"
            title="Sửa"
            aria-label={`Sửa ${badge.nameVi}`}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            disabled={toggleBusy}
            onClick={() => onToggle(badge, !badge.isActive)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
            title={inactive ? 'Kích hoạt' : 'Vô hiệu hóa'}
            aria-label={inactive ? `Kích hoạt ${badge.nameVi}` : `Vô hiệu hóa ${badge.nameVi}`}
          >
            {inactive ? <ArchiveRestore className="size-4" /> : <CircleOff className="size-4" />}
          </button>
        </div>
      </div>

      <div className={`h-1.5 w-full shrink-0 ${inactive ? 'bg-zinc-300' : accent}`} aria-hidden />
    </article>
  );
}
