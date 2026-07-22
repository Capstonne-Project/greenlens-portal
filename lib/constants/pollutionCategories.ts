import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';

/** Mô tả & màu hiển thị theo code (khi BE chưa trả description). Flat colors only — no gradients. */
export const POLLUTION_CATEGORY_DISPLAY: Record<
  string,
  {
    descriptionVi: string;
    iconBg: string;
    iconFg: string;
    /** Thanh đáy card — muted solid */
    accent: string;
  }
> = {
  SMOKE: {
    descriptionVi: 'Khói, bụi, mùi phát thải',
    iconBg: 'bg-zinc-100',
    iconFg: 'text-teal-700',
    accent: 'bg-teal-600',
  },
  WASTEWATER: {
    descriptionVi: 'Nước thải, sông ô nhiễm',
    iconBg: 'bg-zinc-100',
    iconFg: 'text-sky-700',
    accent: 'bg-sky-600',
  },
  TRASH: {
    descriptionVi: 'Rác thải, vứt bừa bãi',
    iconBg: 'bg-zinc-100',
    iconFg: 'text-amber-700',
    accent: 'bg-amber-600',
  },
  CHEMICAL: {
    descriptionVi: 'Hóa chất, chất độc hại',
    iconBg: 'bg-zinc-100',
    iconFg: 'text-rose-700',
    accent: 'bg-rose-600',
  },
  NOISE: {
    descriptionVi: 'Tiếng ồn, rung động',
    iconBg: 'bg-zinc-100',
    iconFg: 'text-violet-700',
    accent: 'bg-violet-600',
  },
  SOIL: {
    descriptionVi: 'Đất nhiễm, chất thải rắn',
    iconBg: 'bg-zinc-100',
    iconFg: 'text-orange-700',
    accent: 'bg-orange-600',
  },
};

const DEFAULT_DISPLAY = {
  descriptionVi: 'Loại ô nhiễm môi trường',
  iconBg: 'bg-zinc-100',
  iconFg: 'text-zinc-600',
  accent: 'bg-zinc-500',
};

export function getPollutionCategoryDisplay(category: PollutionCategory) {
  const byCode = POLLUTION_CATEGORY_DISPLAY[category.code.toUpperCase()];
  return {
    descriptionVi: category.descriptionVi ?? byCode?.descriptionVi ?? DEFAULT_DISPLAY.descriptionVi,
    iconBg: byCode?.iconBg ?? DEFAULT_DISPLAY.iconBg,
    iconFg: byCode?.iconFg ?? DEFAULT_DISPLAY.iconFg,
    accent: byCode?.accent ?? DEFAULT_DISPLAY.accent,
  };
}

export const ADMIN_POLLUTION_CATEGORIES_PAGE_SIZE = 20;
