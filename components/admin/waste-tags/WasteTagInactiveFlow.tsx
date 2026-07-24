'use client';

import { WasteTagGridCard } from '@/components/admin/waste-tags/WasteTagGridCard';
import type { WasteTag } from '@/lib/api/models/wasteTag';

interface WasteTagInactiveFlowProps {
  tags: WasteTag[];
  totalFiltered?: number;
  selectedId: string | null;
  togglingId: string | null;
  toggleBusy?: boolean;
  onSelect: (id: string) => void;
  onEdit: (tag: WasteTag) => void;
  onToggle: (tag: WasteTag, isActive: boolean) => void;
}

export function WasteTagInactiveFlow({
  tags,
  totalFiltered,
  selectedId,
  togglingId,
  toggleBusy,
  onSelect,
  onEdit,
  onToggle,
}: WasteTagInactiveFlowProps) {
  const countLabel =
    typeof totalFiltered === 'number' && totalFiltered !== tags.length
      ? `${tags.length} / ${totalFiltered} thẻ`
      : `${tags.length} thẻ đã tắt`;

  return (
    <div className="w-full min-w-0">
      <p className="mb-3 text-xs text-zinc-500">Đã tắt · {countLabel}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tags.map(tag => (
          <WasteTagGridCard
            key={tag.id}
            tag={tag}
            inactive
            selected={selectedId === tag.id}
            toggleBusy={togglingId === tag.id && toggleBusy}
            onSelect={() => onSelect(tag.id)}
            onEdit={onEdit}
            onToggle={t => onToggle(t, true)}
          />
        ))}
      </div>
    </div>
  );
}
