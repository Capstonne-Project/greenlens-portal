import { fetchCatalogPollutionCategories } from '@/lib/api/services/fetchPollutionCategory';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

/** @deprecated Dùng `PollutionCategory` từ `@/lib/api/models/pollutionCategory` */
export interface PollutionCategoryItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string | null;
}

/** @deprecated */
export interface PollutionCategoryListData {
  items: PollutionCategoryItem[];
}

export async function fetchPollutionCategories(): Promise<ApiEnvelope<PollutionCategoryListData>> {
  const envelope = await fetchCatalogPollutionCategories();
  return {
    ...envelope,
    data: {
      items: envelope.data.items.map(item => ({
        id: item.id,
        code: item.code,
        nameVi: item.nameVi,
        nameEn: item.nameEn,
        iconUrl: item.iconUrl,
      })),
    },
  };
}

export default {
  fetchPollutionCategories,
};
