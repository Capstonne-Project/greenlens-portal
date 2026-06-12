'use client';

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

  const boxClass = size === 'sm' ? 'size-8 rounded-md' : 'size-10 rounded-lg';

  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-emerald-50 ring-1 ring-emerald-100 ${boxClass} ${
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
          style={{ width: size === 'sm' ? 20 : 24, height: size === 'sm' ? 20 : 24 }}
          unoptimized
        />
      ) : (
        <Tag className={`text-emerald-700 ${size === 'sm' ? 'size-4' : 'size-5'}`} aria-hidden />
      )}
    </span>
  );
}
