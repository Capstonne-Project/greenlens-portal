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
  return (
    <div className="w-full min-w-0">
      <header className="mb-6 border-b border-border/60 pb-4">
        <p className="text-xs font-medium text-muted-foreground">Không còn trên dropdown</p>
        <h2 className="mt-0.5 text-lg font-semibold text-muted-foreground">
          {typeof totalFiltered === 'number' && totalFiltered !== tags.length
            ? `${tags.length} / ${totalFiltered} thẻ trên trang này`
            : `${tags.length} thẻ đã tắt`}
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
