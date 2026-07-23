'use client';

import {
  archiveCompanyTeam,
  assignCompanyStaffTeam,
  assignCompanyTeam,
  createCompany,
  createCompanyStaff,
  createCompanyTeam,
  deleteCompany,
  fetchCompanies,
  fetchCompanyAssignmentDetail,
  fetchCompanyAssignments,
  fetchCompanyContractHistory,
  fetchCompanyDetail,
  fetchCompanyQueue,
  fetchCompanyServiceAreas,
  fetchCompanyStaff,
  fetchCompanyTeams,
  fetchMyCompany,
  fetchMyCompanyContractHistory,
  fetchMyCompanyKpi,
  fetchMyWardCompanies,
  renameCompanyTeam,
  removeCompanyTeamMember,
  suspendCompany,
  reactivateCompany,
  renewCompanyContract,
  updateCompanyServiceAreas,
  updateCompanyStaffStatus,
} from '@/lib/api/services/fetchCompany';
import type {
  ArchiveCompanyTeamInput,
  AssignCompanyStaffTeamInput,
  AssignCompanyTeamInput,
  CompaniesListParams,
  CompanyAssignmentDetail,
  CompanyAssignmentsList,
  CompanyAssignmentsParams,
  CompanyQueueList,
  CompanyQueueParams,
  CompanyStaffList,
  CompanyStaffListParams,
  CompanyTeamsList,
  CompanyTeamsListParams,
  CreateCompanyInput,
  CreateCompanyStaffInput,
  CreateCompanyTeamInput,
  MyCompany,
  MyCompanyContractHistory,
  MyCompanyKpi,
  MyCompanyKpiParams,
  RenameCompanyTeamInput,
  RenewCompanyContractInput,
  SuspendCompanyInput,
  UpdateCompanyServiceAreasInput,
  UpdateCompanyStaffStatusInput,
} from '@/lib/api/models/company';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── Officer (LEO) — quản lý doanh nghiệp ────────────────────────────────────
// Tách key factory khỏi `companyKeys` của company portal (dev) để tránh trùng export.

const officerCompanyKeys = {
  all: ['officer', 'companies'] as const,
  list: (params: CompaniesListParams) => [...officerCompanyKeys.all, 'list', params] as const,
  myWard: () => [...officerCompanyKeys.all, 'my-ward'] as const,
  detail: (companyId: string) => [...officerCompanyKeys.all, 'detail', companyId] as const,
  serviceAreas: (companyId: string) =>
    [...officerCompanyKeys.all, 'service-areas', companyId] as const,
  contractHistory: (companyId: string) =>
    [...officerCompanyKeys.all, 'contract-history', companyId] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

export function useCompaniesList(params: CompaniesListParams) {
  return useQuery({
    queryKey: officerCompanyKeys.list(params),
    queryFn: () => fetchCompanies(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

/** GET /v1/companies/my-ward — công ty phục vụ phường/xã của LEO đang đăng nhập. */
export function useMyWardCompanies(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: officerCompanyKeys.myWard(),
    queryFn: () => fetchMyWardCompanies(),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled ?? true,
  });
}

export function useCompanyDetail(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: officerCompanyKeys.detail(companyId ?? ''),
    queryFn: () => fetchCompanyDetail(companyId!),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled: Boolean(companyId) && enabled,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCompanyInput) => createCompany(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: officerCompanyKeys.all });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: officerCompanyKeys.all });
    },
  });
}

/** POST /v1/companies/{id}/suspend — [DEO/Admin] tạm ngưng công ty (Active → Suspended). */
export function useSuspendCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SuspendCompanyInput }) =>
      suspendCompany(id, body),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: officerCompanyKeys.all });
      void queryClient.invalidateQueries({ queryKey: officerCompanyKeys.detail(id) });
    },
  });
}

/** POST /v1/companies/{id}/reactivate — [DEO/Admin] kích hoạt lại (Suspended → Active). */
export function useReactivateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reactivateCompany(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: officerCompanyKeys.all });
      void queryClient.invalidateQueries({ queryKey: officerCompanyKeys.detail(id) });
    },
  });
}

/** POST /v1/companies/{id}/renew-contract — [DEO/Admin] gia hạn HĐ Bidding (Expired → Active). */
export function useRenewCompanyContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RenewCompanyContractInput }) =>
      renewCompanyContract(id, body),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: officerCompanyKeys.all });
      void queryClient.invalidateQueries({ queryKey: officerCompanyKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: officerCompanyKeys.contractHistory(id) });
    },
  });
}

/** GET /v1/companies/{id}/contract-history — lịch sử kỳ hợp đồng (lazy khi drawer mở). */
export function useCompanyContractHistory(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: officerCompanyKeys.contractHistory(companyId ?? ''),
    queryFn: () => fetchCompanyContractHistory(companyId!),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled: Boolean(companyId) && enabled,
  });
}

export function useCompanyServiceAreas(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: officerCompanyKeys.serviceAreas(companyId ?? ''),
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
      void queryClient.invalidateQueries({ queryKey: officerCompanyKeys.all });
      void queryClient.invalidateQueries({ queryKey: officerCompanyKeys.detail(companyId) });
      void queryClient.invalidateQueries({
        queryKey: officerCompanyKeys.serviceAreas(companyId),
      });
    },
  });
}

export { LIST_STALE_MS as COMPANY_LIST_STALE_MS };

// ── Company portal (dev) — giữ nguyên ───────────────────────────────────────

export const companyKeys = {
  all: ['company'] as const,
  profile: () => [...companyKeys.all, 'profile'] as const,
  staff: (params: CompanyStaffListParams) => [...companyKeys.all, 'staff', params] as const,
  teams: (params: CompanyTeamsListParams) => [...companyKeys.all, 'teams', params] as const,
  teamOptions: () => [...companyKeys.all, 'teams', 'options'] as const,
  queue: (params: CompanyQueueParams) => [...companyKeys.all, 'queue', params] as const,
  queueCount: () => [...companyKeys.all, 'queue', 'count'] as const,
  assignments: (params: CompanyAssignmentsParams) =>
    [...companyKeys.all, 'assignments', params] as const,
  assignmentDetail: (reportId: string) =>
    [...companyKeys.all, 'assignments', 'detail', reportId] as const,
  contractHistory: () => [...companyKeys.all, 'contract-history'] as const,
  kpi: (params: MyCompanyKpiParams) => [...companyKeys.all, 'kpi', params] as const,
};

const STALE_MS = 3 * 60 * 1000;

export function useMyCompany() {
  return useQuery({
    queryKey: companyKeys.profile(),
    queryFn: () => fetchMyCompany(),
    select: (envelope: ApiEnvelope<MyCompany>) => envelope.data,
    staleTime: STALE_MS,
  });
}

export function useCompanyStaffList(params: CompanyStaffListParams) {
  return useQuery({
    queryKey: companyKeys.staff(params),
    queryFn: () => fetchCompanyStaff(params),
    select: (envelope: ApiEnvelope<CompanyStaffList>) => envelope.data,
    staleTime: STALE_MS,
  });
}

export function useCompanyTeamsList(params: CompanyTeamsListParams) {
  return useQuery({
    queryKey: companyKeys.teams(params),
    queryFn: () => fetchCompanyTeams(params),
    select: (envelope: ApiEnvelope<CompanyTeamsList>) => envelope.data,
    staleTime: STALE_MS,
  });
}

/** Dropdown team active — dùng khi tạo staff / phân công báo cáo. */
export function useCompanyTeamOptions() {
  const query = useQuery({
    queryKey: companyKeys.teamOptions(),
    queryFn: () => fetchCompanyTeams({ page: 1, pageSize: 100, isActive: true }),
    select: (envelope: ApiEnvelope<CompanyTeamsList>) =>
      envelope.data.items.map(t => ({ id: t.id, name: t.name })),
    staleTime: STALE_MS,
  });

  return {
    options: query.data ?? [],
    isPending: query.isPending,
  };
}

/** Tất cả đội công ty — dùng khi gán nhân viên vào đội. */
export function useCompanyAllTeamOptions() {
  const query = useQuery({
    queryKey: [...companyKeys.all, 'teams', 'all-options'] as const,
    queryFn: () => fetchCompanyTeams({ page: 1, pageSize: 100 }),
    select: (envelope: ApiEnvelope<CompanyTeamsList>) =>
      envelope.data.items.map(t => ({
        id: t.id,
        name: t.name,
        isActive: t.isActive,
        memberCount: t.memberCount,
      })),
    staleTime: STALE_MS,
  });

  return {
    options: query.data ?? [],
    isPending: query.isPending,
  };
}

export function useCompanyQueueCount() {
  return useQuery({
    queryKey: companyKeys.queueCount(),
    queryFn: () => fetchCompanyQueue({ page: 1, pageSize: 1 }),
    select: (envelope: ApiEnvelope<CompanyQueueList>) => envelope.data.pagination.totalItems,
    staleTime: 60 * 1000,
  });
}

export function useCompanyQueue(params: CompanyQueueParams) {
  return useQuery({
    queryKey: companyKeys.queue(params),
    queryFn: () => fetchCompanyQueue(params),
    select: (envelope: ApiEnvelope<CompanyQueueList>) => envelope.data,
    staleTime: 60 * 1000,
  });
}

export function useCompanyAssignments(params: CompanyAssignmentsParams) {
  return useQuery({
    queryKey: companyKeys.assignments(params),
    queryFn: () => fetchCompanyAssignments(params),
    select: (envelope: ApiEnvelope<CompanyAssignmentsList>) => envelope.data,
    staleTime: 60 * 1000,
  });
}

export function useCompanyAssignmentDetail(reportId: string | null) {
  return useQuery({
    queryKey: companyKeys.assignmentDetail(reportId ?? ''),
    queryFn: () => fetchCompanyAssignmentDetail(reportId!),
    select: (envelope: ApiEnvelope<CompanyAssignmentDetail>) => envelope.data,
    enabled: Boolean(reportId),
    staleTime: 60 * 1000,
  });
}

export function useCreateCompanyStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCompanyStaffInput) => createCompanyStaff(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.profile() });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'staff'] });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'teams'] });
    },
  });
}

export function useUpdateCompanyStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: UpdateCompanyStaffStatusInput }) =>
      updateCompanyStaffStatus(userId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'staff'] });
      queryClient.invalidateQueries({ queryKey: companyKeys.profile() });
    },
  });
}

export function useAssignCompanyStaffTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignCompanyStaffTeamInput) => assignCompanyStaffTeam(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'staff'] });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'teams'] });
      queryClient.invalidateQueries({ queryKey: companyKeys.profile() });
    },
  });
}

export function useRemoveCompanyTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      removeCompanyTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'staff'] });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'teams'] });
      queryClient.invalidateQueries({ queryKey: companyKeys.profile() });
    },
  });
}

export function useCreateCompanyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCompanyTeamInput) => createCompanyTeam(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'teams'] });
    },
  });
}

export function useRenameCompanyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RenameCompanyTeamInput }) =>
      renameCompanyTeam(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'teams'] });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'staff'] });
    },
  });
}

export function useMyCompanyContractHistory() {
  return useQuery({
    queryKey: companyKeys.contractHistory(),
    queryFn: () => fetchMyCompanyContractHistory(),
    select: (envelope: ApiEnvelope<MyCompanyContractHistory>) => envelope.data,
    staleTime: STALE_MS,
  });
}

/** GET /v1/companies/my/kpi — KPI công ty CM theo kỳ. */
export function useMyCompanyKpi(params: MyCompanyKpiParams = {}) {
  return useQuery({
    queryKey: companyKeys.kpi(params),
    queryFn: () => fetchMyCompanyKpi(params),
    select: (envelope: ApiEnvelope<MyCompanyKpi>) => envelope.data,
    staleTime: 60 * 1000,
  });
}

export function useArchiveCompanyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ArchiveCompanyTeamInput }) =>
      archiveCompanyTeam(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'teams'] });
      queryClient.invalidateQueries({ queryKey: companyKeys.teamOptions() });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'staff'] });
    },
  });
}

/** Company Manager — POST /v1/reports/{id}/assign-company-team (không phải LEO `/assign`). */
export function useAssignCompanyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: AssignCompanyTeamInput }) =>
      assignCompanyTeam(reportId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'queue'] });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'assignments'] });
    },
  });
}
