'use client';

import { WasteTagGridCard } from '@/components/admin/waste-tags/WasteTagGridCard';
import type { WasteTag } from '@/lib/api/models/wasteTag';

interface WasteTagCatalogFlowProps {
  tags: WasteTag[];
  totalFiltered?: number;
  selectedId: string | null;
  togglingId: string | null;
  toggleBusy?: boolean;
  onSelect: (id: string) => void;
  onEdit: (tag: WasteTag) => void;
  onToggle: (tag: WasteTag) => void;
}

export function WasteTagCatalogFlow({
  tags,
  totalFiltered,
  selectedId,
  togglingId,
  toggleBusy,
  onSelect,
  onEdit,
  onToggle,
}: WasteTagCatalogFlowProps) {
  const countLabel =
    typeof totalFiltered === 'number' && totalFiltered !== tags.length
      ? `${tags.length} / ${totalFiltered} thẻ`
      : `${tags.length} thẻ`;

  return (
    <div className="w-full min-w-0">
      <p className="mb-3 text-xs text-zinc-500">
        Đang dùng · {countLabel} · sắp theo thứ tự hiển thị
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tags.map(tag => (
          <WasteTagGridCard
            key={tag.id}
            tag={tag}
            selected={selectedId === tag.id}
            toggleBusy={togglingId === tag.id && toggleBusy}
            onSelect={() => onSelect(tag.id)}
            onEdit={onEdit}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
