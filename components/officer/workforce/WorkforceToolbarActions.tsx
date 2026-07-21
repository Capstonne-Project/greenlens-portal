'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileOutput, LayoutGrid, List } from 'lucide-react';

export type WorkforceViewMode = 'board' | 'list';

/** Segmented board/list switch — khớp toolbar mẫu (joined, outer radius only). */
export function WorkforceViewModeSwitch({
  value,
  onChange,
}: {
  value: WorkforceViewMode;
  onChange: (mode: WorkforceViewMode) => void;
}) {
  return (
    <div
      className="inline-flex h-8 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white"
      role="group"
      aria-label="Chế độ xem"
    >
      <button
        type="button"
        onClick={() => onChange('board')}
        title="Board"
        aria-pressed={value === 'board'}
        className={cn(
          'flex size-8 cursor-pointer items-center justify-center border-r border-slate-200 transition-colors',
          value === 'board'
            ? 'bg-slate-800 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-50'
        )}
      >
        <LayoutGrid className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        title="Danh sách"
        aria-pressed={value === 'list'}
        className={cn(
          'flex size-8 cursor-pointer items-center justify-center transition-colors',
          value === 'list' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
        )}
      >
        <List className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

/** Export CSV — UI hardcode, chưa gắn API. */
export function WorkforceExportCsvButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 shrink-0 cursor-pointer gap-1.5 border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-none hover:bg-slate-50"
      onClick={() => undefined}
    >
      <FileOutput className="size-3.5" aria-hidden />
      Export to csv
    </Button>
  );
}
