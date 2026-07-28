'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileOutput, LayoutGrid, List } from 'lucide-react';

export type WorkforceViewMode = 'board' | 'list';

const VIEW_TOGGLE_CLASS = (active: boolean) =>
  cn(
    'flex size-8 cursor-pointer items-center justify-center rounded-lg transition-all',
    active ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
  );

/** Board/list switch — cùng style LeoTracking (emerald), board bên trái. */
export function WorkforceViewModeSwitch({
  value,
  onChange,
}: {
  value: WorkforceViewMode;
  onChange: (mode: WorkforceViewMode) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Chế độ xem">
      <button
        type="button"
        onClick={() => onChange('board')}
        title="Board"
        aria-pressed={value === 'board'}
        className={VIEW_TOGGLE_CLASS(value === 'board')}
      >
        <LayoutGrid className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        title="Danh sách"
        aria-pressed={value === 'list'}
        className={VIEW_TOGGLE_CLASS(value === 'list')}
      >
        <List className="size-4" aria-hidden />
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
