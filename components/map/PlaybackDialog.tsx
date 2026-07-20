'use client';

import { useEffect } from 'react';
import { Calendar, ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlaybackDialogProps = {
  open: boolean;
  onClose: () => void;
};

const SELECT_CHEVRON =
  'appearance-none bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat bg-white pr-9 pl-3';

function formatMockDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(11, 13, 0, 0);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function PlaybackDialog({ open, onClose }: PlaybackDialogProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const startLabel = formatMockDate(0);
  const endLabel = formatMockDate(1);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
      role="presentation"
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="relative z-[101] w-[420px] max-w-[calc(100vw-48px)] rounded-xl bg-white px-7 pt-7 pb-5 shadow-[0_20px_60px_rgba(0,0,0,0.35),0_4px_16px_rgba(0,0,0,0.2)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="playback-dialog-title"
      >
        <h2 id="playback-dialog-title" className="mb-5 text-lg font-bold text-gray-900">
          Select mode &amp; date range
        </h2>

        <button
          type="button"
          className="mb-5 inline-flex cursor-pointer items-center gap-2 rounded-[20px] border-none bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-[7px] text-[13px] font-semibold text-white"
        >
          <Lock size={14} aria-hidden />
          Unlock Playback
          <ChevronRight size={14} aria-hidden />
        </button>

        <p className="mb-2.5 text-[13px] font-semibold text-gray-700">Playback Mode</p>
        <div
          className="mb-4 flex overflow-hidden rounded-lg border border-gray-200"
          role="tablist"
          aria-label="Playback mode"
        >
          <button
            type="button"
            className="flex h-9 flex-1 cursor-not-allowed items-center justify-center gap-[5px] border-none bg-transparent text-[13px] font-medium text-gray-400"
            disabled
          >
            <Lock size={12} color="#ef4444" aria-hidden />
            All In Area
          </button>
          <button
            type="button"
            className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-[5px] border-none bg-transparent text-[13px] font-medium text-gray-700 transition-[background] duration-150 ease-out"
          >
            Vessels
          </button>
          <button
            type="button"
            className="flex h-9 flex-1 cursor-not-allowed items-center justify-center gap-[5px] border-none bg-transparent text-[13px] font-medium text-gray-400"
            disabled
          >
            <Lock size={12} color="#ef4444" aria-hidden />
            Fleet
          </button>
          <button
            type="button"
            className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-[5px] border-none bg-gray-900 text-[13px] font-semibold text-white transition-[background] duration-150 ease-out"
            aria-selected
          >
            Demo
          </button>
        </div>

        <p className="mb-2.5 text-[13px] text-gray-700">
          Select one of the Demo Playbacks to replay.
        </p>
        <select
          className={cn(
            SELECT_CHEVRON,
            'h-10 w-full cursor-pointer rounded-md border border-gray-300 text-sm text-gray-700',
            "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]"
          )}
          defaultValue=""
          aria-label="Demo playback"
        >
          <option value="">- Select -</option>
          <option value="hcm-week">HCM — Last 7 days</option>
          <option value="hotspot-demo">Hotspot surge demo</option>
        </select>

        <p className="mt-5 mb-2.5 text-[13px] font-semibold text-gray-700">Date Range</p>
        <select
          className={cn(
            SELECT_CHEVRON,
            'h-9 w-[200px] cursor-pointer rounded-md border border-gray-300 bg-gray-100 text-sm text-gray-700',
            "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]"
          )}
          defaultValue="custom"
          disabled
        >
          <option value="custom">Custom</option>
        </select>
        <div className="mt-2.5 flex gap-3">
          <div
            className="flex h-9 flex-1 items-center justify-between rounded-md border border-gray-300 bg-gray-100 px-3 pr-9 text-[13px] text-gray-700"
            aria-label="Start date"
          >
            <span>{startLabel}</span>
            <Calendar size={14} color="#9ca3af" aria-hidden />
          </div>
          <div
            className="flex h-9 flex-1 items-center justify-between rounded-md border border-gray-300 bg-gray-100 px-3 pr-9 text-[13px] text-gray-700"
            aria-label="End date"
          >
            <span>{endLabel}</span>
            <Calendar size={14} color="#9ca3af" aria-hidden />
          </div>
        </div>

        <div className="mt-6 flex items-center">
          <button
            type="button"
            className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-gray-700"
          >
            SHARE
          </button>
          <span className="flex-1" />
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent px-3 py-2 text-[13px] font-medium text-gray-500"
            onClick={onClose}
          >
            CANCEL
          </button>
          <button
            type="button"
            className="ml-1 cursor-pointer rounded-md border-none bg-gray-900 px-5 py-2 text-[13px] font-semibold text-white"
            onClick={() => {
              console.info('[MapPlayback] Demo playback started');
              onClose();
            }}
          >
            PLAY
          </button>
        </div>
      </div>
    </div>
  );
}
