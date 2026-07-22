'use client';

import { PollutionCategoryIcon } from '@/components/admin/pollution-categories/PollutionCategoryIcon';
import { getPollutionCategoryDisplay } from '@/lib/constants/pollutionCategories';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import { ArchiveRestore, CircleOff, FileText, Pencil, Zap } from 'lucide-react';

interface PollutionCategoryCardProps {
  category: PollutionCategory;
  onEdit: (category: PollutionCategory) => void;
  onArchiveToggle: (category: PollutionCategory, archive: boolean) => void;
  archiveBusy?: boolean;
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

export function PollutionCategoryCard({
  category,
  onEdit,
  onArchiveToggle,
  archiveBusy,
}: PollutionCategoryCardProps) {
  const { descriptionVi, accent } = getPollutionCategoryDisplay(category);
  const archived = category.isArchived;
  const reportPct = Math.min(
    100,
    Math.max(
      archived ? 0 : 12,
      category.reportCount === 0 ? 8 : 18 + Math.min(category.reportCount, 10) * 8
    )
  );

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        archived ? 'bg-zinc-50' : 'bg-white'
      }`}
    >
      <div className="flex flex-1 flex-col p-5 pb-4">
        {/* Header: #CODE · status */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold tabular-nums text-zinc-800">#{category.code}</span>
          <span className="text-zinc-300" aria-hidden>
            ·
          </span>
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              archived ? 'text-zinc-500' : 'text-zinc-600'
            }`}
          >
            {archived ? (
              <FileText className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <Zap className="size-3.5 shrink-0" aria-hidden />
            )}
            {archived ? 'Ngưng' : 'Đang dùng'}
          </span>
        </div>

        <h3 className="mt-4 text-[15px] font-bold leading-snug tracking-tight text-zinc-900">
          {category.nameVi}
          {category.nameEn ? (
            <span className="font-semibold text-zinc-500"> · {category.nameEn}</span>
          ) : null}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-600">{descriptionVi}</p>

        {/* Timeline */}
        <div className="mt-6">
          <div className="mb-2 flex items-end justify-between gap-3 text-[11px] text-zinc-500">
            <span>Tạo {formatShortDate(category.createdAt)}</span>
            <span className="font-medium tabular-nums text-zinc-700">
              {category.reportCount.toLocaleString('vi-VN')} báo cáo
            </span>
          </div>
          <div className="relative flex h-3 items-center">
            <span className="absolute left-0 z-10 size-2.5 rounded-full border-2 border-zinc-400 bg-white" />
            <span className="absolute right-0 z-10 size-2.5 rounded-full border-2 border-zinc-300 bg-white" />
            <div className="mx-1 h-px w-full bg-zinc-300" />
            <div
              className={`absolute left-1 top-1/2 h-[3px] -translate-y-1/2 rounded-full ${
                archived ? 'bg-zinc-400' : 'bg-zinc-900'
              }`}
              style={{ width: `calc(${reportPct}% - 4px)` }}
            />
          </div>
        </div>

        {/* Footer: avatar + visible action icons */}
        <div className="mt-6 flex items-center gap-3">
          <PollutionCategoryIcon category={category} dimmed={archived} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">{category.nameVi}</p>
            <p className="truncate text-xs text-zinc-500">
              {archived ? 'Đã ngưng sử dụng' : 'Via danh mục hệ thống'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-zinc-700 transition hover:bg-zinc-100"
              title="Sửa"
              aria-label={`Sửa ${category.nameVi}`}
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              disabled={archiveBusy}
              onClick={() => onArchiveToggle(category, !archived)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              title={archived ? 'Kích hoạt' : 'Ngưng'}
              aria-label={archived ? `Kích hoạt ${category.nameVi}` : `Ngưng ${category.nameVi}`}
            >
              {archived ? <ArchiveRestore className="size-4" /> : <CircleOff className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className={`h-1.5 w-full shrink-0 ${archived ? 'bg-zinc-300' : accent}`} aria-hidden />
    </article>
  );
}
