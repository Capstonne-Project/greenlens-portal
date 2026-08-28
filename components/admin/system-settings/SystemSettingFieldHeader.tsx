'use client';

import type { SystemSettingItem } from '@/lib/api/models/adminSystemSettings';

import { getSystemSettingDisplay } from '@/utils/adminSystemSettingsUi';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { ChevronDown, CircleHelp } from 'lucide-react';

import { useState } from 'react';

interface SystemSettingFieldHeaderProps {
  item: SystemSettingItem;

  isModified?: boolean;
}

export function SystemSettingFieldHeader({ item, isModified }: SystemSettingFieldHeaderProps) {
  const display = getSystemSettingDisplay(item);

  const [expanded, setExpanded] = useState(false);

  const detailLong = display.detail.length > 96;

  return (
    <div className="min-w-0 space-y-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <label
          htmlFor={`setting-${item.key}`}
          className="text-sm font-medium leading-snug text-foreground"
        >
          {display.label}
        </label>

        {isModified ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            · Đã sửa
          </span>
        ) : null}

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-5 text-muted-foreground"
                aria-label={`Thông tin kỹ thuật: ${display.key}`}
              >
                <CircleHelp className="size-3.5" aria-hidden />
              </Button>
            </TooltipTrigger>

            <TooltipContent
              side="top"
              className="max-w-xs border-0 bg-slate-900 text-xs text-slate-100"
            >
              <p className="font-mono text-xs text-slate-400">{display.key}</p>

              <p className="mt-1 leading-relaxed">{display.detail}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {!detailLong ? (
        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{display.detail}</p>
      ) : (
        <div>
          <p
            className={cn(
              'max-w-xl text-xs leading-relaxed text-muted-foreground',

              !expanded && 'line-clamp-1'
            )}
          >
            {display.detail}
          </p>

          <Button
            type="button"
            variant="link"
            onClick={() => setExpanded(v => !v)}
            className="h-auto p-0 text-xs font-medium text-emerald-700 hover:text-emerald-800"
          >
            {expanded ? 'Thu gọn' : 'Chi tiết'}

            <ChevronDown
              className={cn('size-3 transition-transform', expanded && 'rotate-180')}
              aria-hidden
            />
          </Button>
        </div>
      )}
    </div>
  );
}
