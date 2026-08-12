'use client';

import { cn } from '@/lib/utils';
import { LayoutGrid, List } from 'lucide-react';

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
