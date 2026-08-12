import { getBadgeDisplay } from '@/lib/constants/adminBadges';
import type { AdminBadge } from '@/lib/api/models/adminBadge';
import { resolveBadgeIconUrl } from '@/utils/adminBadgeUi';
import { Medal } from 'lucide-react';
import Image from 'next/image';

interface BadgeIconProps {
  badge: AdminBadge;
  dimmed?: boolean;
  size?: 'sm' | 'md';
}

export function BadgeIcon({ badge, dimmed, size = 'md' }: BadgeIconProps) {
  const { iconBg, iconFg } = getBadgeDisplay(badge.code);
  const url = resolveBadgeIconUrl(badge.iconUrl);
  const box = size === 'sm' ? 'size-9' : 'size-11';
  const img = size === 'sm' ? 'size-7' : 'size-8';

  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-full ${iconBg} ${
        dimmed ? 'opacity-60' : ''
      }`}
    >
      {url ? (
        <Image
          src={url}
          alt=""
          width={size === 'sm' ? 28 : 32}
          height={size === 'sm' ? 28 : 32}
          className={`${img} object-contain`}
          unoptimized
        />
      ) : (
        <Medal className={`${size === 'sm' ? 'size-4' : 'size-5'} ${iconFg}`} aria-hidden />
      )}
    </span>
  );
}
