import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faAppleWhole,
  faBiohazard,
  faBottleWater,
  faBriefcaseMedical,
  faCarBattery,
  faDroplet,
  faFlask,
  faHelmetSafety,
  faHouse,
  faIndustry,
  faLeaf,
  faMicrochip,
  faOilCan,
  faRecycle,
  faSeedling,
  faSmog,
  faTag,
  faTrashCan,
  faTree,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

/** Số thẻ rác thải mỗi trang (lưới 3×3). */
export const ADMIN_WASTE_TAGS_PAGE_SIZE = 9;

/** PageSize khi fetch admin list — đủ cho lọc/phân trang client. */
export const ADMIN_WASTE_TAGS_LIST_FETCH_SIZE = 500;

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

/** Font Awesome icon theo mã thẻ — semantic, dễ nhận diện trên badge. */
export const WASTE_TAG_FA_ICON: Record<string, IconDefinition> = {
  HOUSEHOLD: faHouse,
  FOOD_ORGANIC: faSeedling,
  RECYCLABLE: faRecycle,
  HAZARDOUS: faBiohazard,
  CONSTRUCTION: faHelmetSafety,
  ELECTRONIC: faMicrochip,
  GARDEN_GREEN: faTree,
  MEDICAL: faBriefcaseMedical,
  INDUSTRIAL: faIndustry,
  // Aliases / common BE variants
  ORGANIC: faSeedling,
  FOOD: faAppleWhole,
  PLASTIC: faRecycle,
  E_WASTE: faMicrochip,
  EWASTE: faMicrochip,
  BATTERY: faCarBattery,
  CHEMICAL: faFlask,
  OIL: faOilCan,
  MEDICAL_WASTE: faBriefcaseMedical,
  GREEN: faLeaf,
  WATER: faDroplet,
  LIQUID: faBottleWater,
  AIR: faSmog,
  TOXIC: faTriangleExclamation,
  GENERAL: faTrashCan,
};

const DEFAULT_WASTE_TAG_DISPLAY = {
  iconBg: 'bg-zinc-100',
  iconFg: 'text-zinc-700',
  accent: 'bg-zinc-500',
};

/** Keyword → icon khi code chưa có trong map (match nameVi / nameEn). */
const WASTE_TAG_NAME_ICON_RULES: Array<{ pattern: RegExp; icon: IconDefinition }> = [
  { pattern: /hữu\s*cơ|thực\s*phẩm|organic|food|compost/i, icon: faSeedling },
  { pattern: /tái\s*chế|nhựa|recycl|plastic|giấy|kim\s*loại/i, icon: faRecycle },
  { pattern: /nguy\s*hại|độc|hazard|toxic|biohazard|hóa\s*chất|chemical/i, icon: faBiohazard },
  { pattern: /xây\s*dựng|construction|phế\s*liệu\s*xd|gạch|bê\s*tông/i, icon: faHelmetSafety },
  { pattern: /điện\s*tử|electronic|e-?waste|thiết\s*bị/i, icon: faMicrochip },
  { pattern: /y\s*tế|medical|syringe|bệnh\s*viện|kim\s*tiêm/i, icon: faBriefcaseMedical },
  { pattern: /công\s*nghiệp|industrial|nhà\s*máy|factory/i, icon: faIndustry },
  { pattern: /vườn|cây|garden|green|lá|cỏ/i, icon: faTree },
  { pattern: /sinh\s*hoạt|hộ\s*gia\s*đình|household|gia\s*đình/i, icon: faHouse },
  { pattern: /pin|ắc\s*quy|battery/i, icon: faCarBattery },
  { pattern: /dầu|oil|mỡ/i, icon: faOilCan },
  { pattern: /nước|liquid|water|chai/i, icon: faDroplet },
  { pattern: /khí|khói|khí\s*thải|smog|air/i, icon: faSmog },
];

export function getWasteTagDisplay(code: string) {
  return WASTE_TAG_DISPLAY[code.toUpperCase()] ?? DEFAULT_WASTE_TAG_DISPLAY;
}

/** Icon FA theo code; fallback theo tên; mặc định thùng rác. */
export function getWasteTagFaIcon(code?: string | null, nameHint?: string | null): IconDefinition {
  const normalized = code?.trim().toUpperCase();
  if (normalized && WASTE_TAG_FA_ICON[normalized]) {
    return WASTE_TAG_FA_ICON[normalized]!;
  }

  const hint = nameHint?.trim();
  if (hint) {
    for (const rule of WASTE_TAG_NAME_ICON_RULES) {
      if (rule.pattern.test(hint)) return rule.icon;
    }
  }

  return faTag;
}
