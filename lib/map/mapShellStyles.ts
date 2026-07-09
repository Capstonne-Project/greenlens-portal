import { cn } from '@/lib/utils';

/** Sidebar / nav surface width animation — khớp mapShellStore MAP_SHELL_SIDEBAR_WIDTH_MS */
export const SIDEBAR_WIDTH_TRANSITION =
  'transition-[width] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)]';

/** CSS custom properties set on sidebar aside (dynamic widths from store). */
export const SIDEBAR_CSS_VARS = {
  '--sidebar-rail-gutter': 'clamp(0.7rem, 1vw, 0.95rem)',
  '--sidebar-slide-distance': 'clamp(0.45rem, 0.8vw, 0.7rem)',
  '--nav-item-inset': '7px',
  '--nav-tile-size-square':
    'min(2rem, calc(var(--sidebar-collapsed-width) - 2 * var(--nav-item-inset)))',
  '--nav-icon-size': '0.9375rem',
} as const;

export function mapShellRootClass(interClassName: string) {
  return cn('relative h-screen w-screen overflow-hidden', interClassName);
}

export function mapShellMapLayerClass() {
  return 'absolute inset-0 z-0 size-full';
}

export function mapShellContentPanelClass() {
  return 'absolute inset-0 z-0 overflow-auto';
}

export function mapShellMapClass() {
  return 'absolute inset-0 z-0 size-full min-h-screen';
}

export function mapSidebarAsideClass(expanded: boolean, pinned: boolean) {
  return cn(
    'group/sidebar absolute top-0 left-0 z-30 flex h-full flex-col items-stretch overflow-hidden',
    'border-r-[0.2rem] border-emerald-600 bg-[#1a1f2e] shadow-[2px_0_12px_rgb(0_0_0/12%)]',
    SIDEBAR_WIDTH_TRANSITION,
    'w-[var(--sidebar-collapsed-width)]',
    expanded && 'w-[var(--sidebar-expanded-width)]',
    pinned && 'shadow-[4px_0_20px_rgb(0_0_0/18%)]'
  );
}

export function mapSidebarPinClass(active: boolean) {
  return cn(
    'absolute top-2.5 right-2.5 z-[2] flex size-[1.7rem] cursor-pointer items-center justify-center',
    'rounded-md border border-transparent bg-transparent text-white/75',
    'transition-[background,color,border-color] duration-150 ease-out',
    'hover:border-white/14 hover:bg-white/12 hover:text-white focus-visible:border-white/14 focus-visible:bg-white/12 focus-visible:text-white focus-visible:outline-none',
    active &&
      'text-white hover:border-emerald-600/55 hover:bg-emerald-600/22 focus-visible:border-emerald-600/55 focus-visible:bg-emerald-600/22'
  );
}

export function mapSidebarPinIconClass(solid: boolean) {
  return cn('size-3.5 text-sm', solid ? 'map-pin-icon--solid' : 'map-pin-icon--outline');
}

export function mapSidebarLogoClass(expanded: boolean) {
  return cn(
    'flex h-[clamp(3rem,6vh,3.5rem)] w-full shrink-0 items-center justify-start border-b border-white/[0.08]',
    'px-[var(--sidebar-rail-gutter)]',
    expanded && 'gap-[0.62rem] pr-[2.6rem]'
  );
}

export function mapSidebarBrandClass(expanded: boolean) {
  return cn('hidden min-w-0 flex-col pointer-events-none', expanded && 'flex pointer-events-auto');
}

export function mapSidebarProfileFooterClass(expanded: boolean) {
  return cn(
    'w-full border-t border-white/[0.12] pt-1 pb-2',
    expanded ? 'bg-transparent' : 'bg-white/[0.04]'
  );
}

type NavItemOptions = {
  active?: boolean;
  expanded?: boolean;
  loginCta?: boolean;
};

export function mapNavItemClass({ loginCta }: NavItemOptions) {
  return cn(
    'group/nav relative flex h-[clamp(2.4rem,4.6vh,2.75rem)] w-full cursor-pointer items-center justify-start',
    'border-none bg-transparent px-[var(--nav-item-inset)] text-white no-underline',
    loginCta && 'text-white hover:text-white'
  );
}

export function mapNavItemSurfaceClass({ active, expanded, loginCta }: NavItemOptions) {
  return cn(
    'relative isolate inline-flex shrink-0 items-center justify-start overflow-hidden rounded-[0.35rem] gap-0',
    'size-[var(--nav-tile-size-square)]',
    SIDEBAR_WIDTH_TRANSITION,
    'before:absolute before:inset-0 before:-z-0 before:rounded-[inherit] before:bg-transparent before:transition-[background] before:duration-200 before:ease-out before:content-[""]',
    expanded && 'w-full gap-[0.62rem]',
    active && 'before:bg-[rgba(90,94,104,0.92)]',
    expanded && !active && !loginCta && 'group-hover/nav:before:bg-[rgba(255,255,255,0.16)]',
    loginCta && 'before:bg-[rgba(5,150,105,0.72)] group-hover/nav:before:bg-[rgba(5,150,105,0.88)]'
  );
}

export function mapNavItemIconRailClass() {
  return 'relative z-[1] flex size-[var(--nav-tile-size-square)] shrink-0 items-center justify-center';
}

export function mapNavItemIconClass() {
  return 'size-[var(--nav-icon-size)] shrink-0 text-[length:var(--nav-icon-size)]';
}

export function mapNavItemLabelClass(expanded: boolean, active?: boolean) {
  return cn(
    'relative z-[1] shrink-0 whitespace-nowrap text-[0.8125rem] font-medium text-current',
    expanded ? 'visible' : 'invisible',
    active && 'font-semibold'
  );
}

export function mapNavDropdownChevronBtnClass() {
  return cn(
    'relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-md border-none bg-transparent text-white/60',
    'transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30'
  );
}

/** Thời gian mở/đóng dropdown nav con — khớp chevron + panel (`duration-300` = 300ms). */
export const MAP_NAV_DROPDOWN_MS = 300;

export function mapNavDropdownChevronIconClass(open: boolean) {
  return cn('size-3 transition-transform duration-300 ease-out', open && 'rotate-180');
}

export function mapNavChildPanelClass(open: boolean) {
  return cn(
    'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
    open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
  );
}

export function mapNavChildPanelInnerClass() {
  return 'min-h-0 overflow-hidden';
}

export function mapNavChildListClass() {
  return cn(
    'relative flex flex-col gap-0.5 pb-1',
    'pl-[calc(var(--nav-item-inset)+var(--nav-tile-size-square)+0.62rem)]',
    'pr-[var(--nav-item-inset)]'
  );
}

export function mapNavChildConnectorClass() {
  return cn(
    'pointer-events-none absolute top-0 bottom-2 z-[2] w-px bg-white/20',
    'left-[calc(var(--nav-item-inset)+var(--nav-tile-size-square)/2-0.5px)]'
  );
}

export function mapNavChildLinkClass({ active }: { active?: boolean }) {
  return cn(
    'relative z-[1] flex min-h-[2rem] w-full items-center rounded-[0.35rem] px-2 py-1.5',
    'text-[0.8125rem] font-medium text-white/70 no-underline transition-colors',
    !active && 'hover:bg-white/[0.06] hover:text-white',
    active && 'bg-[rgba(90,94,104,0.92)] font-semibold text-white hover:bg-[rgba(90,94,104,0.92)]'
  );
}

export function mapOverviewPanelClass() {
  return 'min-h-full bg-slate-50 p-6';
}

export function mapDataPanelClass() {
  return 'flex min-h-[calc(100dvh-48px)] flex-col gap-0';
}

/**
 * Khung trang nav officer (Tổng quan, Xác minh, Phân công, …) — áp dụng 1 lần tại
 * `MapShellContent` variant `panel`. Mọi page/loading không bọc lại lớp này.
 */
export function mapOfficerNavPageShellClass(layer: 'outer' | 'inner') {
  return layer === 'outer' ? mapOverviewPanelClass() : mapDataPanelClass();
}

export function mapProfileTriggerClass(expanded: boolean) {
  return cn(
    'group/profile flex h-[clamp(2.4rem,4.6vh,2.75rem)] w-full cursor-pointer items-center justify-start border-none bg-transparent p-0 text-white',
    expanded
      ? 'px-[var(--nav-item-inset)]'
      : 'pl-[calc((var(--sidebar-collapsed-width)-var(--nav-tile-size-square))/2)] pr-0'
  );
}

export function mapProfileSurfaceClass(expanded: boolean, menuOpen: boolean) {
  return cn(
    'relative isolate inline-flex shrink-0 items-center justify-start overflow-hidden rounded-[0.35rem]',
    'size-[var(--nav-tile-size-square)]',
    SIDEBAR_WIDTH_TRANSITION,
    'before:absolute before:inset-0 before:-z-0 before:rounded-[inherit] before:bg-transparent before:transition-[background] before:duration-200 before:ease-out before:content-[""]',
    expanded && 'h-auto min-h-[var(--nav-tile-size-square)] w-full gap-[0.5rem] px-2.5 py-1',
    expanded &&
      (menuOpen
        ? 'before:bg-[rgba(255,255,255,0.16)]'
        : 'group-hover/profile:before:bg-[rgba(255,255,255,0.16)]')
  );
}

export function mapProfileInfoClass(expanded: boolean) {
  return cn(
    'relative z-[1] flex min-w-0 flex-col items-start justify-center overflow-hidden text-left leading-[1.15]',
    expanded ? 'visible min-w-0 flex-1' : 'invisible w-0 max-w-0 flex-none overflow-hidden'
  );
}
