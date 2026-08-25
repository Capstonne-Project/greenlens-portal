'use client';

import type { SystemSettingItem } from '@/lib/api/models/adminSystemSettings';
import {
  formatSystemSettingConstraints,
  getSystemSettingDisplay,
} from '@/utils/adminSystemSettingsUi';

interface SystemSettingFieldHeaderProps {
  item: SystemSettingItem;
}

export function SystemSettingFieldHeader({ item }: SystemSettingFieldHeaderProps) {
  const display = getSystemSettingDisplay(item);

  return (
    <div className="min-w-0 space-y-1">
      <label
        htmlFor={`setting-${item.key}`}
        className="text-[15px] font-semibold leading-snug text-foreground"
      >
        {display.label}
      </label>
      <p className="font-mono text-[10px] leading-none text-muted-foreground/70">{display.key}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{display.detail}</p>
      {formatSystemSettingConstraints(item) ? (
        <p className="text-[11px] text-muted-foreground/90">
          {formatSystemSettingConstraints(item)}
        </p>
      ) : null}
    </div>
  );
}
