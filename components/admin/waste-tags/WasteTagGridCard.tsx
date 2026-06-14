'use client';

import { WasteTagIcon } from '@/components/admin/waste-tags/WasteTagIcon';
import type { WasteTag } from '@/lib/api/models/wasteTag';
import { ArchiveRestore, Pencil, PowerOff } from 'lucide-react';

interface WasteTagGridCardProps {
  tag: WasteTag;
  selected?: boolean;
  inactive?: boolean;
  toggleBusy?: boolean;
  onSelect?: () => void;
  onEdit: (tag: WasteTag) => void;
  onToggle: (tag: WasteTag) => void;
}

export function WasteTagGridCard({
  tag,
  selected,
  inactive,
  toggleBusy,
  onSelect,
  onEdit,
  onToggle,
}: WasteTagGridCardProps) {
  return (
    <article
      className={`group relative flex min-h-[210px] flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 ease-out ${
        inactive
          ? 'border-dashed border-muted-foreground/25 bg-muted/20'
          : 'border-border/80 hover:-translate-y-0.5 hover:border-emerald-600/30 hover:shadow-md'
      } ${selected ? 'border-emerald-600/50 shadow-md ring-2 ring-emerald-600/15' : ''}`}
    >
      <div
        className={`h-1 w-full ${
          inactive
            ? 'bg-gradient-to-r from-muted-foreground/20 to-transparent'
            : 'bg-gradient-to-r from-emerald-500/80 via-emerald-400/50 to-transparent'
        }`}
        aria-hidden
      />

      <div className="flex flex-1 flex-col p-4">
        <header className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <WasteTagIcon tag={tag} dimmed={inactive} size="sm" />
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-800/90">
              {tag.code}
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums ${
              inactive ? 'bg-muted text-muted-foreground' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            Thứ tự {tag.displayOrder}
          </span>
        </header>

        <button type="button" onClick={onSelect} className="text-left">
          <h3 className="font-semibold leading-snug text-foreground transition-colors group-hover:text-emerald-800">
            {tag.nameVi}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{tag.nameEn}</p>
        </button>

        <div className="mt-3 flex-1 rounded-md bg-muted/30 px-3 py-2.5">
          {tag.description ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {tag.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60">Chưa có mô tả</p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(tag)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border/80 bg-background py-2 text-sm font-medium text-foreground transition hover:border-emerald-600/30 hover:bg-emerald-50/80 hover:text-emerald-900"
          >
            <Pencil className="size-3.5" />
            Sửa
          </button>
          <button
            type="button"
            disabled={toggleBusy}
            onClick={() => onToggle(tag)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-medium transition disabled:opacity-50 ${
              inactive
                ? 'border-emerald-200/80 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/80'
                : 'border-border/80 bg-background text-muted-foreground hover:border-red-200/80 hover:bg-red-50/50 hover:text-red-700'
            }`}
          >
            {inactive ? (
              <>
                <ArchiveRestore className="size-3.5" />
                Bật lại
              </>
            ) : (
              <>
                <PowerOff className="size-3.5" />
                Tắt
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
