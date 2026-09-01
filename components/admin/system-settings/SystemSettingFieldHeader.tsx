'use client';

import type { SystemSettingItem } from '@/lib/api/models/adminSystemSettings';

import {
  formatSystemSettingValueWithUnit,
  getSystemSettingDisplay,
  systemSettingValueToFormValue,
} from '@/utils/adminSystemSettingsUi';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

import { ChevronDown } from 'lucide-react';

import { useState } from 'react';

const DETAIL_COLLAPSE_THRESHOLD = 96;

interface SystemSettingFieldHeaderProps {
  item: SystemSettingItem;

  isModified?: boolean;
}

export function SystemSettingFieldHeader({ item, isModified }: SystemSettingFieldHeaderProps) {
  const display = getSystemSettingDisplay(item);

  const [expanded, setExpanded] = useState(false);

  const detailCollapsible = display.detail.length > DETAIL_COLLAPSE_THRESHOLD;

  const defaultLabel = formatSystemSettingValueWithUnit(item.defaultValue, item.unit);

  const showDefaultBadge = !isSystemSettingShowingDefault(item);

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
      </div>

      {showDefaultBadge ? (
        <p className="text-xs text-muted-foreground">
          Mặc định: <span className="font-medium text-foreground/80">{defaultLabel || '—'}</span>
        </p>
      ) : null}

      {display.detail ? (
        detailCollapsible ? (
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
        ) : (
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{display.detail}</p>
        )
      ) : null}
    </div>
  );
}

function isSystemSettingShowingDefault(item: SystemSettingItem): boolean {
  const effective = systemSettingValueToFormValue(item);
  const defaultValue = item.defaultValue.trim();
  return effective === defaultValue;
}
