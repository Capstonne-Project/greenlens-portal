'use client';

import { getWasteTagDisplay } from '@/lib/constants/adminWasteTags';
import type { WasteTag } from '@/lib/api/models/wasteTag';
import { Tag } from 'lucide-react';
import Image from 'next/image';

interface WasteTagIconProps {
  tag: WasteTag;
  dimmed?: boolean;
  size?: 'sm' | 'md';
}

export function WasteTagIcon({ tag, dimmed, size = 'md' }: WasteTagIconProps) {
  const url = tag.iconUrl?.trim();
  const isRemoteIcon =
    url && (url.startsWith('http://') || url.startsWith('https://')) && url !== 'string';
  const { iconBg, iconFg } = getWasteTagDisplay(tag.code);

  const boxClass = size === 'sm' ? 'size-9 rounded-full' : 'size-10 rounded-full';
  const iconClass = size === 'sm' ? 'size-4' : 'size-5';

  return (
    <span
      className={`flex shrink-0 items-center justify-center ${iconBg} ${boxClass} ${
        dimmed ? 'opacity-60' : ''
      }`}
    >
      {isRemoteIcon ? (
        <Image
          src={url}
          alt=""
          width={size === 'sm' ? 20 : 24}
          height={size === 'sm' ? 20 : 24}
          className="object-contain"
          unoptimized
        />
      ) : (
        <Tag className={`${iconFg} ${iconClass}`} aria-hidden />
      )}
    </span>
  );
}
