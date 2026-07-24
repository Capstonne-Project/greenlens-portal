/**
 * Shared Admin data-table chrome — mirrors Officer Verify slate header styling.
 * Page vertical scroll lives in AdminAppShell only (no nested flex-1 scrollports).
 */

import { cn } from '@/lib/utils';

export const ADMIN_TABLE_ROW_BORDER = 'border-b border-slate-200';

export const ADMIN_TABLE_HEAD_CELL =
  'h-auto border-0 bg-slate-100 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500';

/** Edge inset — first/last match so headers aren't flush to panel border. */
export function adminTableCellPad(
  position: 'first' | 'middle' | 'last',
  layer: 'head' | 'body' = 'body'
): string {
  const y = layer === 'head' ? 'py-3.5' : 'py-4';
  if (position === 'first') return cn('px-0', y, 'ps-14 pe-3');
  if (position === 'last') return cn('px-0', y, 'ps-3 pe-14');
  return cn(y, 'px-3 sm:px-4');
}

/**
 * Full-bleed white table band over panel padding.
 * Do NOT use flex-1 / overflow-auto here — that nested a second scrollbar
 * and stretched a huge empty white region under short tables.
 */
export const ADMIN_TABLE_SHELL = '-mx-6 bg-white';

/** Width clip only; vertical scroll is AdminAppShell. */
export const ADMIN_TABLE_SCROLL = 'w-full min-w-0';

/** Natural width — avoid min-w-4xl forcing a permanent horizontal scrollbar. */
export const ADMIN_TABLE_CLASS = 'w-full min-w-0 table-fixed';
