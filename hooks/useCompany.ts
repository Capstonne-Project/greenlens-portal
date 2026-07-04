'use client';

import {
  assignCompanyStaffTeam,
  assignCompanyTeam,
  createCompanyStaff,
  createCompanyTeam,
  deactivateCompanyTeam,
  fetchCompanyAssignmentDetail,
  fetchCompanyAssignments,
  fetchCompanyQueue,
  fetchCompanyStaff,
  fetchCompanyTeams,
  fetchMyCompany,
  renameCompanyTeam,
  updateCompanyStaffStatus,
} from '@/lib/api/services/fetchCompany';
import type {
  AssignCompanyStaffTeamInput,
  AssignCompanyTeamInput,
  CompanyAssignmentDetail,
  CompanyAssignmentsList,
  CompanyAssignmentsParams,
  CompanyQueueList,
  CompanyQueueParams,
  CompanyStaffList,
  CompanyStaffListParams,
  CompanyTeamsList,
  CompanyTeamsListParams,
  CreateCompanyStaffInput,
  CreateCompanyTeamInput,
  MyCompany,
  RenameCompanyTeamInput,
  UpdateCompanyStaffStatusInput,
} from '@/lib/api/models/company';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    mutationFn: ({ userId, body }: { userId: string; body: AssignCompanyStaffTeamInput }) =>
      assignCompanyStaffTeam(userId, body),
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

export function useDeactivateCompanyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateCompanyTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'teams'] });
    },
  });
}

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
