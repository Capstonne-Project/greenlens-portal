'use client';

import {
  archiveCompanyTeam,
  addCompanyTeamMember,
  assignCompanyStaffTeam,
  assignCompanyTeam,
  reassignCompanyTeam,
  createCompany,
  createCompanyStaff,
  createCompanyTeam,
  deleteCompany,
  deleteCompanyTeam,
  fetchCompanies,
  fetchCompanyAssignmentDetail,
  fetchCompanyAssignments,
  fetchCompanyContractHistory,
  fetchCompanyDetail,
  fetchCompanyQueue,
  fetchCompanyReportDetail,
  fetchCompanyServiceAreas,
  fetchCompanyStaff,
  fetchCompanyTeams,
  fetchMyCompany,
  fetchMyCompanyContractHistory,
  fetchMyCompanyKpi,
  fetchMyWardCompanies,
  fetchMyWardCompanyDetail,
  removeCompanyTeamMember,
  suspendCompany,
  updateCompanyTeam,
  fetchCompanyTeamDetail,
  reactivateCompany,
  renewCompanyContract,
  updateCompanyServiceAreas,
  updateCompanyStaffStatus,
} from '@/lib/api/services/fetchCompany';
import type {
  AddCompanyTeamMemberInput,
  ArchiveCompanyTeamInput,
  AssignCompanyStaffTeamInput,
  AssignCompanyTeamInput,
  ReassignCompanyTeamInput,
  CompaniesListParams,
  CompanyAssignmentDetail,
  CompanyAssignmentListItem,
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
  MyWardCompaniesListParams,
  CompanyTeamDetail,
  RemoveCompanyTeamMemberInput,
  RenewCompanyContractInput,
  SuspendCompanyInput,
  UpdateCompanyServiceAreasInput,
  UpdateCompanyStaffStatusInput,
  UpdateCompanyTeamInput,
} from '@/lib/api/models/company';
import { assignmentListMissingThumbnailIds } from '@/lib/api/mappers/companyAssignment.mapper';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useProtectedQueryEnabled } from '@/hooks/useAuthSession';
import { pickAssignmentDetailMediaUrl } from '@/utils/reportThumbnail';
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';

// ── Officer (LEO) — quản lý doanh nghiệp ────────────────────────────────────
// Tách key factory khỏi `companyKeys` của company portal (dev) để tránh trùng export.

const officerCompanyKeys = {
  all: ['officer', 'companies'] as const,
  list: (params: CompaniesListParams) => [...officerCompanyKeys.all, 'list', params] as const,
  myWardList: (params: MyWardCompaniesListParams) =>
    [...officerCompanyKeys.all, 'my-ward', 'list', params] as const,
  myWardDetail: (companyId: string) =>
    [...officerCompanyKeys.all, 'my-ward', 'detail', companyId] as const,
  detail: (companyId: string) => [...officerCompanyKeys.all, 'detail', companyId] as const,
  serviceAreas: (companyId: string) =>
    [...officerCompanyKeys.all, 'service-areas', companyId] as const,
  contractHistory: (companyId: string) =>
    [...officerCompanyKeys.all, 'contract-history', companyId] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

export function useCompaniesList(params: CompaniesListParams) {
  const canFetch = useProtectedQueryEnabled();
  return useQuery({
    queryKey: officerCompanyKeys.list(params),
    queryFn: () => fetchCompanies(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: canFetch,
  });
}

/** GET /v1/companies/my-ward — danh sách công ty phục vụ phường/xã (LEO). */
export function useMyWardCompaniesList(
  params: MyWardCompaniesListParams,
  options?: { enabled?: boolean }
) {
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
  return useQuery({
    queryKey: officerCompanyKeys.myWardList(params),
    queryFn: () => fetchMyWardCompanies(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: canFetch,
  });
}

/** GET /v1/companies/my-ward/{id} — chi tiết công ty trong phường (LEO). */
export function useMyWardCompanyDetail(companyId: string | null, enabled = true) {
  const canFetch = useProtectedQueryEnabled(Boolean(companyId) && enabled);
  return useQuery({
    queryKey: officerCompanyKeys.myWardDetail(companyId ?? ''),
    queryFn: () => fetchMyWardCompanyDetail(companyId!),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled: canFetch,
  });
}

/** Dropdown phân công — chỉ công ty Active trong phường. */
export function useMyWardCompanies(options?: { enabled?: boolean }) {
  return useMyWardCompaniesList(
    { page: 1, pageSize: 100, status: 'Active' },
    { enabled: options?.enabled ?? true }
  );
}

export function useCompanyDetail(companyId: string | null, enabled = true) {
  const canFetch = useProtectedQueryEnabled(Boolean(companyId) && enabled);
  return useQuery({
    queryKey: officerCompanyKeys.detail(companyId ?? ''),
    queryFn: () => fetchCompanyDetail(companyId!),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled: canFetch,
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
  const canFetch = useProtectedQueryEnabled(Boolean(companyId) && enabled);
  return useQuery({
    queryKey: officerCompanyKeys.contractHistory(companyId ?? ''),
    queryFn: () => fetchCompanyContractHistory(companyId!),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled: canFetch,
  });
}

export function useCompanyServiceAreas(companyId: string | null, enabled = true) {
  const canFetch = useProtectedQueryEnabled(Boolean(companyId) && enabled);
  return useQuery({
    queryKey: officerCompanyKeys.serviceAreas(companyId ?? ''),
    queryFn: () => fetchCompanyServiceAreas(companyId!),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled: canFetch,
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
  teamDetail: (id: string) => [...companyKeys.all, 'teams', 'detail', id] as const,
  teamOptions: () => [...companyKeys.all, 'teams', 'options'] as const,
  queue: (params: CompanyQueueParams) => [...companyKeys.all, 'queue', params] as const,
  /** Overview header “N hàng đợi” CTA — not sidebar badge. */
  queueCount: () => [...companyKeys.all, 'queue', 'count'] as const,
  assignments: (params: CompanyAssignmentsParams) =>
    [...companyKeys.all, 'assignments', params] as const,
  /** Snapshot for company overview dashboard — recent assignments feed + fallbacks. */
  assignmentsDashboard: () => [...companyKeys.all, 'assignments', 'dashboard'] as const,
  assignmentDetail: (reportId: string) =>
    [...companyKeys.all, 'assignments', 'detail', reportId] as const,
  /** GET /v1/reports/company-reports/{reportId} — assign queue detail. */
  reportDetail: (reportId: string) => [...companyKeys.all, 'reports', 'detail', reportId] as const,
  assignmentThumbnail: (reportId: string) =>
    [...companyKeys.all, 'assignments', 'thumbnail', reportId] as const,
  contractHistory: () => [...companyKeys.all, 'contract-history'] as const,
  kpi: (params: MyCompanyKpiParams) => [...companyKeys.all, 'kpi', params] as const,
};

const STALE_MS = 3 * 60 * 1000;

export function useMyCompany() {
  const canFetch = useProtectedQueryEnabled();
  return useQuery({
    queryKey: companyKeys.profile(),
    queryFn: () => fetchMyCompany(),
    select: (envelope: ApiEnvelope<MyCompany>) => envelope.data,
    staleTime: STALE_MS,
    enabled: canFetch,
  });
}

export function useCompanyStaffList(
  params: CompanyStaffListParams,
  options?: { enabled?: boolean }
) {
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
  return useQuery({
    queryKey: companyKeys.staff(params),
    queryFn: () => fetchCompanyStaff(params),
    select: (envelope: ApiEnvelope<CompanyStaffList>) => envelope.data,
    staleTime: STALE_MS,
    enabled: canFetch,
  });
}

export function useCompanyTeamsList(
  params: CompanyTeamsListParams,
  options?: { enabled?: boolean }
) {
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
  return useQuery({
    queryKey: companyKeys.teams(params),
    queryFn: () => fetchCompanyTeams(params),
    select: (envelope: ApiEnvelope<CompanyTeamsList>) => envelope.data,
    staleTime: STALE_MS,
    enabled: canFetch,
  });
}

/** Dropdown team active — dùng khi tạo staff / phân công báo cáo. */
export function useCompanyTeamOptions(options?: { enabled?: boolean }) {
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
  const query = useQuery({
    queryKey: companyKeys.teamOptions(),
    queryFn: () => fetchCompanyTeams({ page: 1, pageSize: 100, isActive: true }),
    select: (envelope: ApiEnvelope<CompanyTeamsList>) =>
      envelope.data.items.map(t => ({
        id: t.id,
        name: t.name,
        memberCount: t.memberCount,
      })),
    staleTime: STALE_MS,
    enabled: canFetch,
  });

  return {
    options: query.data ?? [],
    isPending: query.isPending,
  };
}

/** Tất cả đội công ty (active + inactive) — gán staff / phân công báo cáo. */
export function useCompanyAllTeamOptions(options?: { enabled?: boolean }) {
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
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
    enabled: canFetch,
  });

  return {
    options: query.data ?? [],
    isPending: query.isPending,
  };
}

/** Notification types that add items to company dispatch queue — sidebar badge refresh. */
export const COMPANY_QUEUE_REFRESH_NOTIFICATION_TYPES = ['CompanyReportDispatched'] as const;

function decrementQueueCountEnvelope(
  old: ApiEnvelope<CompanyQueueList> | undefined
): ApiEnvelope<CompanyQueueList> | undefined {
  if (!old?.data?.pagination) return old;
  const nextTotal = Math.max(0, old.data.pagination.totalItems - 1);
  if (nextTotal === old.data.pagination.totalItems) return old;
  return {
    ...old,
    data: {
      ...old.data,
      pagination: {
        ...old.data.pagination,
        totalItems: nextTotal,
      },
    },
  };
}

/** Overview header queue CTA count (kept when sidebar badges removed). */
export function useCompanyQueueCount() {
  const canFetch = useProtectedQueryEnabled();
  return useQuery({
    queryKey: companyKeys.queueCount(),
    queryFn: () => fetchCompanyQueue({ page: 1, pageSize: 1 }),
    select: (envelope: ApiEnvelope<CompanyQueueList>) => envelope.data.pagination.totalItems,
    staleTime: 60 * 1000,
    /** Poll fallback when SignalR off — Overview CTA vẫn cập nhật sau LEO dispatch. */
    refetchInterval: 60 * 1000,
    enabled: canFetch,
  });
}

export function useCompanyQueue(params: CompanyQueueParams) {
  const canFetch = useProtectedQueryEnabled();
  return useQuery({
    queryKey: companyKeys.queue(params),
    queryFn: () => fetchCompanyQueue(params),
    select: (envelope: ApiEnvelope<CompanyQueueList>) => envelope.data,
    staleTime: 60 * 1000,
    enabled: canFetch,
  });
}

export function useCompanyAssignments(params: CompanyAssignmentsParams) {
  const canFetch = useProtectedQueryEnabled();
  return useQuery({
    queryKey: companyKeys.assignments(params),
    queryFn: () => fetchCompanyAssignments(params),
    select: (envelope: ApiEnvelope<CompanyAssignmentsList>) => envelope.data,
    staleTime: 60 * 1000,
    enabled: canFetch,
  });
}

/** Recent assignments for company overview dashboard (list + widget fallbacks). */
export function useCompanyDashboardAssignments() {
  const canFetch = useProtectedQueryEnabled();
  return useQuery({
    queryKey: companyKeys.assignmentsDashboard(),
    queryFn: () => fetchCompanyAssignments({ page: 1, pageSize: 12 }),
    select: (envelope: ApiEnvelope<CompanyAssignmentsList>) => envelope.data,
    staleTime: 60 * 1000,
    enabled: canFetch,
  });
}

export function useCompanyAssignmentDetail(reportId: string | null) {
  const queryClient = useQueryClient();
  const canFetch = useProtectedQueryEnabled(Boolean(reportId));

  return useQuery({
    queryKey: companyKeys.assignmentDetail(reportId ?? ''),
    queryFn: async () => {
      const envelope = await fetchCompanyAssignmentDetail(reportId!);
      return mergeAssignmentDetailWithListImages(envelope.data, queryClient, reportId ?? '');
    },
    enabled: canFetch,
    staleTime: 60 * 1000,
  });
}

/** GET /v1/reports/company-reports/{reportId} — chi tiết hàng đợi phân công. */
export function useCompanyReportDetail(reportId: string | null) {
  const queryClient = useQueryClient();
  const canFetch = useProtectedQueryEnabled(Boolean(reportId));

  return useQuery({
    queryKey: companyKeys.reportDetail(reportId ?? ''),
    queryFn: async () => {
      const envelope = await fetchCompanyReportDetail(reportId!);
      return mergeAssignmentDetailWithListImages(envelope.data, queryClient, reportId ?? '');
    },
    enabled: canFetch,
    staleTime: 60 * 1000,
  });
}

function mergeAssignmentDetailWithListImages(
  detail: CompanyAssignmentDetail | null | undefined,
  queryClient: QueryClient,
  reportId: string
): CompanyAssignmentDetail | null | undefined {
  if (!detail || !reportId) return detail;

  const existingImages = detail.reportImages ?? [];
  if (existingImages.length > 0) {
    return { ...detail, reportImages: existingImages };
  }

  const entries = queryClient.getQueriesData<CompanyAssignmentsList>({
    queryKey: [...companyKeys.all, 'assignments'],
  });

  for (const [, list] of entries) {
    const item = list?.items.find(row => row.report.reportId === reportId);
    const cachedImages = item?.report.reportImages ?? [];
    if (cachedImages.length > 0) {
      return { ...detail, reportImages: cachedImages };
    }
  }

  return { ...detail, reportImages: existingImages };
}

async function resolveAssignmentRowThumbnail(reportId: string): Promise<string | null> {
  try {
    const envelope = await fetchCompanyAssignmentDetail(reportId);
    return pickAssignmentDetailMediaUrl(envelope.data);
  } catch {
    return null;
  }
}

/** Bổ sung ảnh hàng khi list API chưa trả thumbnailUrl. */
export function useCompanyAssignmentThumbnails(items: CompanyAssignmentListItem[] | undefined) {
  const reportIds = useMemo(() => assignmentListMissingThumbnailIds(items ?? []), [items]);
  const canFetch = useProtectedQueryEnabled();

  const queries = useQueries({
    queries: reportIds.map(reportId => ({
      queryKey: companyKeys.assignmentThumbnail(reportId),
      queryFn: () => resolveAssignmentRowThumbnail(reportId),
      staleTime: 10 * 60 * 1000,
      enabled: canFetch && Boolean(reportId),
    })),
  });

  return useMemo(() => {
    const map = new Map<string, string>();
    reportIds.forEach((reportId, index) => {
      const url = queries[index]?.data;
      if (url) map.set(reportId, url);
    });
    return map;
  }, [reportIds, queries]);
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

/** POST /v1/teams/company-teams/{teamId}/members — thêm thành viên vào đội. */
export function useAddCompanyTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, body }: { teamId: string; body: AddCompanyTeamMemberInput }) =>
      addCompanyTeamMember(teamId, body),
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'staff'] });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'teams'] });
      queryClient.invalidateQueries({ queryKey: companyKeys.teamDetail(teamId) });
      queryClient.invalidateQueries({ queryKey: companyKeys.profile() });
    },
  });
}

/**
 * DELETE /v1/teams/company-teams/{teamId}/members/{userId}
 * [CompanyManager] Xóa nhân viên khỏi team — vẫn thuộc công ty, chỉ rời team.
 */
export function useRemoveCompanyTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: RemoveCompanyTeamMemberInput) =>
      removeCompanyTeamMember(teamId, userId),
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'staff'] });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'teams'] });
      queryClient.invalidateQueries({ queryKey: companyKeys.teamDetail(teamId) });
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

/** PUT /v1/teams/company-teams/{id} — cập nhật tên + wasteTagIds. */
export function useUpdateCompanyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCompanyTeamInput }) =>
      updateCompanyTeam(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'teams'] });
      queryClient.invalidateQueries({ queryKey: companyKeys.teamDetail(id) });
    },
  });
}

/** GET /v1/teams/company-teams/{id} — chi tiết đội công ty. */
export function useCompanyTeamDetail(id: string | null) {
  const canFetch = useProtectedQueryEnabled(Boolean(id));
  return useQuery({
    queryKey: companyKeys.teamDetail(id ?? ''),
    queryFn: () => fetchCompanyTeamDetail(id!),
    select: (envelope: ApiEnvelope<CompanyTeamDetail>) => envelope.data,
    enabled: canFetch,
    staleTime: STALE_MS,
  });
}

export function useMyCompanyContractHistory() {
  const canFetch = useProtectedQueryEnabled();
  return useQuery({
    queryKey: companyKeys.contractHistory(),
    queryFn: () => fetchMyCompanyContractHistory(),
    select: (envelope: ApiEnvelope<MyCompanyContractHistory>) => envelope.data,
    staleTime: STALE_MS,
    enabled: canFetch,
  });
}

/** GET /v1/companies/my/kpi — KPI công ty CM theo kỳ. */
export function useMyCompanyKpi(params: MyCompanyKpiParams = {}) {
  const canFetch = useProtectedQueryEnabled();
  return useQuery({
    queryKey: companyKeys.kpi(params),
    queryFn: () => fetchMyCompanyKpi(params),
    select: (envelope: ApiEnvelope<MyCompanyKpi>) => envelope.data,
    staleTime: 60 * 1000,
    enabled: canFetch,
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

/**
 * DELETE /v1/teams/company-teams/{id}
 * [CompanyManager] Soft Delete — team không còn hiện trên hệ thống (dữ liệu vẫn lưu).
 */
export function useDeleteCompanyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCompanyTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'teams'] });
      queryClient.invalidateQueries({ queryKey: companyKeys.teamOptions() });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'staff'] });
      queryClient.invalidateQueries({ queryKey: companyKeys.profile() });
    },
  });
}

/** Company Manager — POST /v1/reports/{id}/assign-company-team (không phải LEO `/assign`). */
export function useAssignCompanyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      body,
      idempotencyKey,
    }: {
      reportId: string;
      body: AssignCompanyTeamInput;
      idempotencyKey?: string;
    }) => assignCompanyTeam(reportId, body, { idempotencyKey }),
    onSuccess: () => {
      queryClient.setQueryData<ApiEnvelope<CompanyQueueList>>(
        companyKeys.queueCount(),
        decrementQueueCountEnvelope
      );
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'queue'] });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'reports', 'detail'] });
    },
  });
}

/**
 * Company Manager — PUT /v1/reports/{id}/reassign-company-team
 * Body: { oldTeamId, newTeamId, reason } (reason ≥ 20). Assignment Declined/Assigned.
 */
export function useReassignCompanyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: ReassignCompanyTeamInput }) =>
      reassignCompanyTeam(reportId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'reports', 'detail'] });
    },
  });
}
