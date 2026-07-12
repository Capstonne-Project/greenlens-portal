'use client';

import { PollutionCategoryIcon } from '@/components/admin/pollution-categories/PollutionCategoryIcon';
import { getPollutionCategoryDisplay } from '@/lib/constants/pollutionCategories';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import { ArchiveRestore, CircleOff, MoreHorizontal, Pencil } from 'lucide-react';
import { useState } from 'react';

interface PollutionCategoryCardProps {
  category: PollutionCategory;
  onEdit: (category: PollutionCategory) => void;
  onArchiveToggle: (category: PollutionCategory, archive: boolean) => void;
  archiveBusy?: boolean;
}

export function PollutionCategoryCard({
  category,
  onEdit,
  onArchiveToggle,
  archiveBusy,
}: PollutionCategoryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { descriptionVi } = getPollutionCategoryDisplay(category);
  const archived = category.isArchived;

  return (
    <article
      className={`flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition ${
        archived ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <PollutionCategoryIcon category={category} dimmed={archived} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-snug text-foreground">{category.nameVi}</h3>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="Tuỳ chọn"
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10"
                    aria-label="Đóng menu"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-border bg-card py-1 text-sm shadow-lg">
                    <button
                      type="button"
                      className="flex w-full px-3 py-2 text-left hover:bg-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(category);
                      }}
                    >
                      Sửa
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              archived ? 'bg-muted text-muted-foreground' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${archived ? 'bg-muted-foreground' : 'bg-emerald-600'}`}
            />
            {archived ? 'Đã ngưng' : 'Đang dùng'}
          </span>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{descriptionVi}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Báo cáo đang dùng
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
          {category.reportCount.toLocaleString('vi-VN')}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Pencil className="size-4" />
          Sửa
        </button>
        <button
          type="button"
          disabled={archiveBusy}
          onClick={() => onArchiveToggle(category, !archived)}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-60 ${
            archived
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              : 'border-border hover:bg-muted'
          }`}
        >
          {archived ? (
            <>
              <ArchiveRestore className="size-4" />
              Kích hoạt
            </>
          ) : (
            <>
              <CircleOff className="size-4" />
              Ngưng
            </>
          )}
        </button>
      </div>
    </article>
  );
}
