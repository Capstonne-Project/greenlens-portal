/** Số huy hiệu mỗi trang (lưới admin — 3 cột × 2 hàng). */
export const ADMIN_BADGES_PAGE_SIZE = 6;

/** Màu accent theo code — flat, không gradient. */
export const BADGE_DISPLAY: Record<string, { accent: string; iconBg: string; iconFg: string }> = {
  first_report: { accent: 'bg-emerald-600', iconBg: 'bg-emerald-100', iconFg: 'text-emerald-800' },
  eco_warrior: { accent: 'bg-lime-600', iconBg: 'bg-lime-100', iconFg: 'text-lime-800' },
  green_champion: { accent: 'bg-green-600', iconBg: 'bg-green-100', iconFg: 'text-green-800' },
  earth_guardian: { accent: 'bg-teal-600', iconBg: 'bg-teal-100', iconFg: 'text-teal-800' },
  streak_7d: { accent: 'bg-sky-600', iconBg: 'bg-sky-100', iconFg: 'text-sky-800' },
  streak_30d: { accent: 'bg-indigo-600', iconBg: 'bg-indigo-100', iconFg: 'text-indigo-800' },
  hotspot_hunter: { accent: 'bg-orange-600', iconBg: 'bg-orange-100', iconFg: 'text-orange-800' },
  duplicate_finder: { accent: 'bg-amber-600', iconBg: 'bg-amber-100', iconFg: 'text-amber-800' },
  community_voice: { accent: 'bg-violet-600', iconBg: 'bg-violet-100', iconFg: 'text-violet-800' },
  rising_star: { accent: 'bg-yellow-600', iconBg: 'bg-yellow-100', iconFg: 'text-yellow-800' },
  eco_expert: { accent: 'bg-cyan-600', iconBg: 'bg-cyan-100', iconFg: 'text-cyan-800' },
  green_legend: { accent: 'bg-fuchsia-600', iconBg: 'bg-fuchsia-100', iconFg: 'text-fuchsia-800' },
  cleanup_hero: { accent: 'bg-rose-600', iconBg: 'bg-rose-100', iconFg: 'text-rose-800' },
};

const DEFAULT_BADGE_DISPLAY = {
  accent: 'bg-zinc-500',
  iconBg: 'bg-amber-100',
  iconFg: 'text-amber-800',
};

export function getBadgeDisplay(code: string) {
  return BADGE_DISPLAY[code.toLowerCase()] ?? DEFAULT_BADGE_DISPLAY;
}
