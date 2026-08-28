/**
 * Admin UI design tokens — canonical sizes from `components/admin/users`.
 *
 * Toolbar row: search/select `h-10`, primary CTA `size="sm"` + `h-9`.
 * Dialog/form footer: Button default `h-10`.
 * Form fields: ValidatedInput default `h-11`, SelectTrigger default `h-10`.
 * Table: body `text-sm`, head/badge `text-xs`.
 */

import { cn } from '@/lib/utils';

/** Primary brand actions (CTA, active segmented toggle). */
export const ADMIN_PRIMARY_BTN =
  'bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-600/30';

/** Page title in shell header (AdminTopHeader). */
export const ADMIN_PAGE_TITLE = 'text-lg font-bold tracking-tight text-foreground';

/** Page / section description under title. */
export const ADMIN_PAGE_DESCRIPTION = 'text-sm font-normal text-muted-foreground';

/** Subsection heading inside a view (e.g. module form title). */
export const ADMIN_SECTION_TITLE = 'text-lg font-semibold tracking-tight text-foreground';

/** Field label in forms (users dialogs). */
export const ADMIN_FIELD_LABEL = 'text-sm font-medium text-foreground';

/** Toolbar filter label (search, status toggle). */
export const ADMIN_TOOLBAR_LABEL = 'text-sm font-medium leading-none text-foreground';

/** Table body cells — users list uses `text-sm`. */
export const ADMIN_TABLE_BODY = 'text-sm';

/** Table column header — users list `ADMIN_TABLE_HEAD_CELL`. */
export const ADMIN_TABLE_HEAD =
  'h-auto border-0 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground';

/** Meta line (counts, hints). */
export const ADMIN_META_TEXT = 'text-xs text-muted-foreground';

/** Badge / status pill in tables. */
export const ADMIN_BADGE_TEXT = 'text-xs font-medium';

/** Summary strip label (AdminUserSummaryStrip). */
export const ADMIN_SUMMARY_LABEL = 'text-xs font-medium text-muted-foreground';

/** Summary strip value (AdminUserSummaryStrip). */
export const ADMIN_SUMMARY_VALUE =
  'text-xl font-bold tabular-nums leading-none tracking-tight text-foreground';

/** Sidebar section label (uppercase rail). */
export const ADMIN_RAIL_SECTION_LABEL =
  'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

/** Toolbar search + select height (users: h-10). */
export const ADMIN_TOOLBAR_CONTROL = 'h-10';

/** Toolbar primary CTA — users: `size="sm"` + `h-9`. */
export const ADMIN_TOOLBAR_CTA = cn('h-9 shrink-0', ADMIN_PRIMARY_BTN);

/** Dialog / form footer primary — users: Button default h-10. */
export const ADMIN_DIALOG_PRIMARY_BTN = ADMIN_PRIMARY_BTN;

/** Row icon action — users table: `size-8`. */
export const ADMIN_ROW_ACTION_ICON = 'size-8 text-muted-foreground';

/** Pagination prev/next — users grid views: `size="sm"` + `h-9`. */
export const ADMIN_PAGINATION_BTN = 'h-9 gap-1';

/** ValidatedInput in toolbar/filter (no counter footer). */
export const ADMIN_SEARCH_INPUT_CLASS = cn(ADMIN_TOOLBAR_CONTROL, 'rounded-md pl-10 pr-9');

/** SelectTrigger in toolbar filters. */
export const ADMIN_TOOLBAR_SELECT = cn(ADMIN_TOOLBAR_CONTROL, 'rounded-md');

/** Numeric input in settings forms — align toolbar height. */
export const ADMIN_NUMBER_INPUT_CLASS = cn(
  ADMIN_TOOLBAR_CONTROL,
  'w-[5.5rem] text-right font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
);

/** Full-width text input in inline settings rows. */
export const ADMIN_TEXT_INPUT_CLASS = cn(ADMIN_TOOLBAR_CONTROL, 'min-w-[8rem] md:min-w-[10rem]');

/** @deprecated use ADMIN_TOOLBAR_CONTROL */
export const ADMIN_CONTROL_HEIGHT = ADMIN_TOOLBAR_CONTROL;

/** @deprecated use ADMIN_TOOLBAR_CTA pattern */
export const ADMIN_CONTROL_HEIGHT_SM = 'h-9';
