/** Số thẻ rác thải mỗi trang (lưới 3×3). */
export const ADMIN_WASTE_TAGS_PAGE_SIZE = 9;

/** Màu phẳng theo code — không gradient. */
export const WASTE_TAG_DISPLAY: Record<string, { iconBg: string; iconFg: string; accent: string }> =
  {
    HOUSEHOLD: { iconBg: 'bg-stone-100', iconFg: 'text-stone-700', accent: 'bg-stone-500' },
    FOOD_ORGANIC: { iconBg: 'bg-lime-100', iconFg: 'text-lime-800', accent: 'bg-lime-600' },
    RECYCLABLE: { iconBg: 'bg-cyan-100', iconFg: 'text-cyan-800', accent: 'bg-cyan-600' },
    HAZARDOUS: { iconBg: 'bg-rose-100', iconFg: 'text-rose-800', accent: 'bg-rose-600' },
    CONSTRUCTION: { iconBg: 'bg-amber-100', iconFg: 'text-amber-800', accent: 'bg-amber-600' },
    ELECTRONIC: { iconBg: 'bg-indigo-100', iconFg: 'text-indigo-800', accent: 'bg-indigo-600' },
    GARDEN_GREEN: { iconBg: 'bg-teal-100', iconFg: 'text-teal-800', accent: 'bg-teal-600' },
    MEDICAL: { iconBg: 'bg-fuchsia-100', iconFg: 'text-fuchsia-800', accent: 'bg-fuchsia-600' },
    INDUSTRIAL: { iconBg: 'bg-slate-100', iconFg: 'text-slate-700', accent: 'bg-slate-600' },
  };

const DEFAULT_WASTE_TAG_DISPLAY = {
  iconBg: 'bg-zinc-100',
  iconFg: 'text-zinc-700',
  accent: 'bg-zinc-500',
};

export function getWasteTagDisplay(code: string) {
  return WASTE_TAG_DISPLAY[code.toUpperCase()] ?? DEFAULT_WASTE_TAG_DISPLAY;
}
