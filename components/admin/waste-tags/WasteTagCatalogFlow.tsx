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
  return (
    <div className="w-full min-w-0">
      <header className="mb-6 flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-700">Đang dùng trên form báo cáo</p>
          <h2 className="mt-0.5 text-lg font-semibold text-foreground">
            {typeof totalFiltered === 'number' && totalFiltered !== tags.length
              ? `${tags.length} / ${totalFiltered} thẻ trên trang này`
              : `${tags.length} loại rác thải`}
          </h2>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sắp theo thứ tự hiển thị — đồng bộ với dropdown khi công dân gửi báo cáo.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
