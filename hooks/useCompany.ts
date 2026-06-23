'use client';

import {
  createCompany,
  fetchCompanies,
  fetchCompanyServiceAreas,
  updateCompanyServiceAreas,
} from '@/lib/api/services/fetchCompany';
import type {
  CompaniesListParams,
  CreateCompanyInput,
  UpdateCompanyServiceAreasInput,
} from '@/lib/api/models/company';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const companyKeys = {
  all: ['officer', 'companies'] as const,
  list: (params: CompaniesListParams) => [...companyKeys.all, 'list', params] as const,
  serviceAreas: (companyId: string) => [...companyKeys.all, 'service-areas', companyId] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

export function useCompaniesList(params: CompaniesListParams) {
  return useQuery({
    queryKey: companyKeys.list(params),
    queryFn: () => fetchCompanies(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCompanyInput) => createCompany(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}

export function useCompanyServiceAreas(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: companyKeys.serviceAreas(companyId ?? ''),
    queryFn: () => fetchCompanyServiceAreas(companyId!),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled: Boolean(companyId) && enabled,
  });
}

export function useUpdateCompanyServiceAreas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      companyId,
      body,
    }: {
      companyId: string;
      body: UpdateCompanyServiceAreasInput;
    }) => updateCompanyServiceAreas(companyId, body),
    onSuccess: (_data, { companyId }) => {
      void queryClient.invalidateQueries({ queryKey: companyKeys.all });
      void queryClient.invalidateQueries({ queryKey: companyKeys.serviceAreas(companyId) });
    },
  });
}

export { LIST_STALE_MS as COMPANY_LIST_STALE_MS };
