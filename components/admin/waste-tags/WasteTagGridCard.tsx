'use client';

import { WasteTagIcon } from '@/components/admin/waste-tags/WasteTagIcon';
import { getWasteTagDisplay } from '@/lib/constants/adminWasteTags';
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
  const { accent } = getWasteTagDisplay(tag.code);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        inactive ? 'border-dashed border-zinc-300 bg-zinc-50' : 'border-border/70 bg-white'
      } ${selected ? 'ring-2 ring-zinc-900/10' : ''}`}
    >
      <div className="flex flex-1 flex-col gap-3 p-4 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold tabular-nums text-zinc-800">#{tag.code}</span>
          <span className="text-zinc-300" aria-hidden>
            ·
          </span>
          <span className="tabular-nums text-zinc-500">#{tag.displayOrder}</span>
          {inactive ? <span className="ml-auto font-medium text-zinc-500">Đã tắt</span> : null}
        </div>

        <button type="button" onClick={onSelect} className="text-left">
          <h3 className="text-[15px] font-bold leading-snug tracking-tight text-zinc-900">
            {tag.nameVi}
            {tag.nameEn ? (
              <span className="font-semibold text-zinc-500"> · {tag.nameEn}</span>
            ) : null}
          </h3>
          {tag.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-zinc-600">
              {tag.description}
            </p>
          ) : null}
        </button>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <WasteTagIcon tag={tag} dimmed={inactive} size="sm" />
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(tag)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-zinc-700 transition hover:bg-zinc-100"
              title="Sửa"
              aria-label={`Sửa ${tag.nameVi}`}
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              disabled={toggleBusy}
              onClick={() => onToggle(tag)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              title={inactive ? 'Bật lại' : 'Tắt'}
              aria-label={inactive ? `Bật lại ${tag.nameVi}` : `Tắt ${tag.nameVi}`}
            >
              {inactive ? <ArchiveRestore className="size-4" /> : <PowerOff className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className={`h-1.5 w-full shrink-0 ${inactive ? 'bg-zinc-300' : accent}`} aria-hidden />
    </article>
  );
}
