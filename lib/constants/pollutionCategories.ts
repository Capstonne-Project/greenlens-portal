import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';

/** Mô tả & màu hiển thị theo code (khi BE chưa trả description). */
export const POLLUTION_CATEGORY_DISPLAY: Record<
  string,
  { descriptionVi: string; iconBg: string; iconFg: string }
> = {
  SMOKE: {
    descriptionVi: 'Khói, bụi, mùi phát thải',
    iconBg: 'bg-emerald-100',
    iconFg: 'text-emerald-700',
  },
  WASTEWATER: {
    descriptionVi: 'Nước thải, sông ô nhiễm',
    iconBg: 'bg-sky-100',
    iconFg: 'text-sky-700',
  },
  TRASH: {
    descriptionVi: 'Rác thải, vứt bừa bãi',
    iconBg: 'bg-amber-100',
    iconFg: 'text-amber-800',
  },
  CHEMICAL: {
    descriptionVi: 'Hóa chất, chất độc hại',
    iconBg: 'bg-red-100',
    iconFg: 'text-red-700',
  },
  NOISE: {
    descriptionVi: 'Tiếng ồn, rung động',
    iconBg: 'bg-violet-100',
    iconFg: 'text-violet-700',
  },
  SOIL: {
    descriptionVi: 'Đất nhiễm, chất thải rắn',
    iconBg: 'bg-orange-100',
    iconFg: 'text-orange-800',
  },
};

const DEFAULT_DISPLAY = {
  descriptionVi: 'Loại ô nhiễm môi trường',
  iconBg: 'bg-muted',
  iconFg: 'text-muted-foreground',
};

export function getPollutionCategoryDisplay(category: PollutionCategory) {
  const byCode = POLLUTION_CATEGORY_DISPLAY[category.code.toUpperCase()];
  return {
    descriptionVi: category.descriptionVi ?? byCode?.descriptionVi ?? DEFAULT_DISPLAY.descriptionVi,
    iconBg: byCode?.iconBg ?? DEFAULT_DISPLAY.iconBg,
    iconFg: byCode?.iconFg ?? DEFAULT_DISPLAY.iconFg,
  };
}

export const ADMIN_POLLUTION_CATEGORIES_PAGE_SIZE = 20;
