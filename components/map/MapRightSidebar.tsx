'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Filter, Layers, Play, RefreshCw } from 'lucide-react';
import { PlaybackDialog } from './PlaybackDialog';

type MapRightSidebarProps = {
  onRefresh?: () => void;
};

/** Panel xám bọc ngoài — rộng 52px, nút căn giữa */
const MAP_TOOL_PANEL =
  'pointer-events-auto flex w-[42px] flex-col items-center gap-1.5 rounded-md bg-slate-700/95 p-2 shadow-[0_2px_12px_rgb(0_0_0/28%)] backdrop-blur-sm';

/** Nút icon 28×30px — bg + border + hover riêng */
const MAP_TOOL_BTN =
  'group relative flex h-[30px] w-[28px] shrink-0 cursor-pointer items-center justify-center rounded-sm border border-white/12 bg-[rgba(15,20,35,0.85)] text-white/75 backdrop-blur-sm transition-[background,color] duration-150 ease-out hover:bg-[rgba(30,40,65,0.95)] hover:text-white';

const MAP_TOOLTIP =
  'pointer-events-none absolute top-1/2 right-[calc(100%+10px)] z-30 w-40 -translate-y-1/2 rounded-md border border-white/15 bg-slate-900/95 px-3 py-2 text-xs leading-normal whitespace-normal text-white/90 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100';

type MapToolButtonProps = {
  label: string;
  tooltip: string;
  onClick?: () => void;
  children: ReactNode;
};

function MapToolButton({ label, tooltip, onClick, children }: MapToolButtonProps) {
  return (
    <button
      type="button"
      className={MAP_TOOL_BTN}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
      <span className={MAP_TOOLTIP}>{tooltip}</span>
    </button>
  );
}

export function MapRightSidebar({ onRefresh }: MapRightSidebarProps) {
  const [playbackOpen, setPlaybackOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return (
    <>
      <aside
        className="pointer-events-none absolute top-3 right-3 z-20 flex flex-col gap-2"
        aria-label="Công cụ bản đồ"
      >
        {/* Panel trên — Map Type, Filters, Playback */}
        <div className={MAP_TOOL_PANEL}>
          <MapToolButton label="Map Type" tooltip="Map Type">
            <Layers className="size-4" strokeWidth={1.75} aria-hidden />
          </MapToolButton>
          <MapToolButton label="Filter" tooltip="Filter">
            <Filter className="size-4" strokeWidth={1.75} aria-hidden />
          </MapToolButton>
          <MapToolButton label="Playback" tooltip="Playback" onClick={() => setPlaybackOpen(true)}>
            <Play className="size-4" strokeWidth={1.75} aria-hidden />
          </MapToolButton>
        </div>

        {/* Panel Refresh — ngay dưới panel trên, cách một khoảng (gap-2) */}
        <div className={MAP_TOOL_PANEL}>
          <MapToolButton label="Refresh map" tooltip="Click to refresh map" onClick={handleRefresh}>
            <RefreshCw className="size-4" strokeWidth={1.75} aria-hidden />
          </MapToolButton>
        </div>
      </aside>

      <PlaybackDialog open={playbackOpen} onClose={() => setPlaybackOpen(false)} />
    </>
  );
}
