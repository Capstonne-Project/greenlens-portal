'use client';

import { useMemo, useState } from 'react';
import { Info, MapPinned, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PublicMapSummaryData } from '@/lib/api/services/fetchMap';
import type { PublicMapPresence } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';

const PRESENCE_OPTIONS: { id: PublicMapPresence; label: string }[] = [
  { id: 'active', label: 'Còn ô nhiễm' },
  { id: 'cleaned', label: 'Đã dọn' },
  { id: 'all', label: 'Tất cả' },
];

function formatCount(value: number | undefined): string {
  return new Intl.NumberFormat('vi-VN').format(value ?? 0);
}

interface PublicMapChromeProps {
  presence: PublicMapPresence;
  onPresenceChange: (presence: PublicMapPresence) => void;
  provinceCode: string | null;
  onProvinceSelect: (province: {
    code: string | null;
    name?: string;
    longitude?: number;
    latitude?: number;
  }) => void;
  summary?: PublicMapSummaryData | null;
  isSummaryError?: boolean;
}

export function PublicMapChrome({
  presence,
  onPresenceChange,
  provinceCode,
  onProvinceSelect,
  summary,
  isSummaryError,
}: PublicMapChromeProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [provinceOpen, setProvinceOpen] = useState(false);

  const provinces = summary?.byProvince ?? [];

  const kpiLabel = useMemo(() => {
    if (isSummaryError) return 'Chưa có số liệu máy chủ';
    if (presence === 'cleaned') {
      return `${formatCount(summary?.nationalCleanedCount ?? summary?.nationalCount)} đã dọn (toàn quốc)`;
    }
    if (presence === 'all') {
      return `${formatCount(summary?.nationalCount)} công khai (toàn quốc)`;
    }
    return `${formatCount(summary?.nationalActiveCount ?? summary?.nationalCount)} còn ô nhiễm (toàn quốc)`;
  }, [isSummaryError, presence, summary]);

  return (
    <>
      {/* Filters + note — bottom-left stack */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-stretch gap-2 p-3 sm:inset-x-auto sm:right-auto sm:bottom-20 sm:left-4 sm:max-w-xs sm:items-start">
        <div
          className="pointer-events-auto flex rounded-xl bg-background/95 p-1 shadow-lg ring-1 ring-border/80 backdrop-blur-md"
          role="tablist"
          aria-label="Lớp bản đồ"
        >
          {PRESENCE_OPTIONS.map(option => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={presence === option.id}
              className={cn(
                'flex-1 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors sm:flex-none',
                presence === option.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onPresenceChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="bg-background/95 shadow-md ring-1 ring-border/80 backdrop-blur-md"
            onClick={() => {
              setProvinceOpen(v => !v);
              setNoteOpen(false);
            }}
          >
            <MapPinned className="size-3.5" aria-hidden />
            Tỉnh / TP
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="bg-background/95 shadow-md ring-1 ring-border/80 backdrop-blur-md"
            onClick={() => {
              setNoteOpen(v => !v);
              setProvinceOpen(false);
            }}
          >
            <Info className="size-3.5" aria-hidden />
            Chú thích
          </Button>
        </div>

        {noteOpen ? (
          <div className="pointer-events-auto rounded-xl bg-background/95 p-3 text-xs shadow-lg ring-1 ring-border/80 backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-semibold text-foreground">Chú thích</p>
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                aria-label="Đóng chú thích"
                onClick={() => setNoteOpen(false)}
              >
                <X className="size-3.5" />
              </button>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-red-500" aria-hidden />
                Đỏ — còn ô nhiễm / đang xử lý
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-600" aria-hidden />
                Xanh — đã dọn (Resolved / Closed)
              </li>
              <li>{kpiLabel}</li>
              {typeof summary?.reportCount === 'number' ? (
                <li>Trong khung nhìn: {formatCount(summary.reportCount)}</li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {provinceOpen ? (
          <div className="pointer-events-auto max-h-56 overflow-hidden rounded-xl bg-background/95 shadow-lg ring-1 ring-border/80 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-xs font-semibold">Tỉnh / thành phố</p>
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                aria-label="Đóng danh sách tỉnh"
                onClick={() => setProvinceOpen(false)}
              >
                <X className="size-3.5" />
              </button>
            </div>
            <ul className="max-h-44 overflow-y-auto p-1.5">
              <li>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs',
                    provinceCode == null
                      ? 'bg-emerald-50 font-medium text-emerald-900'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => onProvinceSelect({ code: null })}
                >
                  Toàn quốc
                </button>
              </li>
              {provinces.map(province => {
                const selected = provinceCode === province.code;
                return (
                  <li key={province.code}>
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs',
                        selected ? 'bg-emerald-50 font-medium text-emerald-900' : 'hover:bg-muted'
                      )}
                      onClick={() =>
                        onProvinceSelect({
                          code: province.code,
                          name: province.name,
                          longitude: province.centerLongitude ?? undefined,
                          latitude: province.centerLatitude ?? undefined,
                        })
                      }
                    >
                      <span className="line-clamp-1">{province.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatCount(province.count)}
                      </span>
                    </button>
                  </li>
                );
              })}
              {provinces.length === 0 ? (
                <li className="px-2.5 py-3 text-[11px] text-muted-foreground">
                  Chưa có danh sách tỉnh từ máy chủ.
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </>
  );
}
