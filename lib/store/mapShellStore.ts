'use client';

import { create } from 'zustand';

/** Map camera padding animation duration (ms). */
export const MAP_SIDEBAR_TRANSITION_MS = 500;

/** Sidebar width transition — khớp CSS `.map-left-sidebar` (340ms). */
export const MAP_SHELL_SIDEBAR_WIDTH_MS = 340;

type MapShellState = {
  isPinned: boolean;
  isHovered: boolean;
  viewportWidth: number;
  togglePin: () => void;
  setHovered: (hovered: boolean) => void;
  setViewportWidth: (width: number) => void;
};

const DEFAULT_VIEWPORT_WIDTH = 1366;

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Responsive sidebar widths derived from viewport width. */
export function getResponsiveSidebarWidths(viewportWidth: number): {
  collapsed: number;
  expanded: number;
} {
  // Smaller footprint than before while keeping comfortable hit area.
  const collapsed = clamp(46, viewportWidth * 0.028, 50);
  const expanded = clamp(162, viewportWidth * 0.14, 210);
  return { collapsed, expanded };
}

export const useMapShellStore = create<MapShellState>(set => ({
  isPinned: false,
  isHovered: false,
  viewportWidth: DEFAULT_VIEWPORT_WIDTH,
  togglePin: () => set(state => ({ isPinned: !state.isPinned })),
  setHovered: isHovered => set({ isHovered }),
  setViewportWidth: viewportWidth => set({ viewportWidth }),
}));

/** Sidebar visually expanded (hover overlay or pinned workspace). */
export function selectSidebarExpanded(state: MapShellState): boolean {
  return state.isPinned || state.isHovered;
}

/** Left padding applied to map viewport only when pinned. */
export function selectMapPaddingLeft(state: MapShellState): number {
  return state.isPinned ? getResponsiveSidebarWidths(state.viewportWidth).expanded : 0;
}

/** Khớp `border-right: 0.2rem` trên `.map-left-sidebar`. */
const SIDEBAR_RAIL_BORDER_PX = 3.2;

/**
 * Panel (companies, dashboard):
 * - Collapsed / hover expand (không pin): inset = collapsed rail, expanded sidebar overlay.
 * - Pinned: inset = expanded width — content đẩy sang phải (workspace).
 */
export function selectPanelContentInsetLeft(state: MapShellState): number {
  const { collapsed, expanded } = getResponsiveSidebarWidths(state.viewportWidth);
  const rail = state.isPinned ? expanded : collapsed;
  return rail + SIDEBAR_RAIL_BORDER_PX;
}

export function selectSidebarCollapsedWidth(state: MapShellState): number {
  return getResponsiveSidebarWidths(state.viewportWidth).collapsed;
}

export function selectSidebarExpandedWidth(state: MapShellState): number {
  return getResponsiveSidebarWidths(state.viewportWidth).expanded;
}
