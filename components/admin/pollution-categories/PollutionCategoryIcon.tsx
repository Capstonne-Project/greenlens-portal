import { getPollutionCategoryDisplay } from '@/lib/constants/pollutionCategories';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import { Cloud, Droplets, FlaskConical, Leaf, Trash2, Volume2 } from 'lucide-react';
import Image from 'next/image';

const CODE_ICONS: Record<string, typeof Cloud> = {
  SMOKE: Cloud,
  WASTEWATER: Droplets,
  TRASH: Trash2,
  CHEMICAL: FlaskConical,
  NOISE: Volume2,
  SOIL: Leaf,
};

interface PollutionCategoryIconProps {
  category: PollutionCategory;
  dimmed?: boolean;
}

export function PollutionCategoryIcon({ category, dimmed }: PollutionCategoryIconProps) {
  const { iconBg, iconFg } = getPollutionCategoryDisplay(category);
  const Icon = CODE_ICONS[category.code.toUpperCase()] ?? Leaf;
  const url = category.iconUrl?.trim();

  const isRemoteIcon = Boolean(url && /^https:\/\//i.test(url) && url !== 'string');

  return (
    <span
      className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${
        dimmed ? 'opacity-60' : ''
      }`}
    >
      {isRemoteIcon && url ? (
        <Image
          src={url}
          alt=""
          width={28}
          height={28}
          className="size-7 object-contain"
          unoptimized
        />
      ) : (
        <Icon className={`size-5 ${iconFg}`} aria-hidden />
      )}
    </span>
  );
}
