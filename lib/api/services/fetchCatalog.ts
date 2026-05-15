import type { ApiEnvelope } from '@/lib/api/types/auth';
import apiService from '../core';

export interface PollutionCategoryItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string | null;
}

export interface PollutionCategoryListData {
  items: PollutionCategoryItem[];
}

export async function fetchPollutionCategories(): Promise<ApiEnvelope<PollutionCategoryListData>> {
  const res = await apiService.get<ApiEnvelope<PollutionCategoryListData>>(
    '/v1/catalog/pollution-categories'
  );
  return res.data;
}

export default {
  fetchPollutionCategories,
};
