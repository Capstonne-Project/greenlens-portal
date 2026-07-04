/**
 * L2 — Company Manager (profile, staff, teams, report queue).
 */
import {
  adaptAssignCompanyStaffTeam,
  adaptAssignCompanyTeam,
  adaptCompanyAssignmentDetail,
  adaptCompanyAssignments,
  adaptCompanyQueue,
  adaptCompanyStaffList,
  adaptCompanyTeamsList,
  adaptCreateCompanyStaff,
  adaptCreateCompanyTeam,
  adaptDeactivateCompanyTeam,
  adaptMyCompany,
  adaptRenameCompanyTeam,
  adaptUpdateCompanyStaffStatus,
} from '@/lib/api/adapters/company.adapter';
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
  CompanyTeam,
  CompanyTeamsList,
  CompanyTeamsListParams,
  CreateCompanyStaffInput,
  CreateCompanyStaffResult,
  CreateCompanyTeamInput,
  MyCompany,
  RenameCompanyTeamInput,
  UpdateCompanyStaffStatusInput,
} from '@/lib/api/models/company';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AssignCompanyStaffTeamInput,
  AssignCompanyTeamInput,
  CompanyAssignmentDetail,
  CompanyAssignmentListItem,
  CompanyAssignmentMedia,
  CompanyAssignmentProgressSummary,
  CompanyAssignmentsList,
  CompanyAssignmentsParams,
  CompanyAssignmentStatus,
  CompanyAssignmentTeamDetail,
  CompanyAssignmentTimelineEntry,
  CompanyAssignmentWasteTag,
  CompanyQueueItem,
  CompanyQueueList,
  CompanyQueueParams,
  CompanyQueueSeverity,
  CompanyServiceArea,
  CompanyStaffItem,
  CompanyStaffList,
  CompanyStaffListParams,
  CompanyTeam,
  CompanyTeamListItem,
  CompanyTeamOption,
  CompanyTeamsList,
  CompanyTeamsListParams,
  CreateCompanyStaffInput,
  CreateCompanyStaffResult,
  CreateCompanyTeamInput,
  MyCompany,
  RenameCompanyTeamInput,
  UpdateCompanyStaffStatusInput,
} from '@/lib/api/models/company';

export async function fetchMyCompany(): Promise<ApiEnvelope<MyCompany>> {
  return adaptMyCompany();
}

export async function fetchCompanyStaff(
  params?: CompanyStaffListParams
): Promise<ApiEnvelope<CompanyStaffList>> {
  return adaptCompanyStaffList(params);
}

export async function createCompanyStaff(
  body: CreateCompanyStaffInput
): Promise<ApiEnvelope<CreateCompanyStaffResult>> {
  return adaptCreateCompanyStaff(body);
}

export async function updateCompanyStaffStatus(
  userId: string,
  body: UpdateCompanyStaffStatusInput
): Promise<ApiEnvelope<string | null>> {
  return adaptUpdateCompanyStaffStatus(userId, body);
}

export async function assignCompanyStaffTeam(
  userId: string,
  body: AssignCompanyStaffTeamInput
): Promise<ApiEnvelope<string | null>> {
  return adaptAssignCompanyStaffTeam(userId, body);
}

export async function fetchCompanyTeams(
  params?: CompanyTeamsListParams
): Promise<ApiEnvelope<CompanyTeamsList>> {
  return adaptCompanyTeamsList(params);
}

export async function createCompanyTeam(
  body: CreateCompanyTeamInput
): Promise<ApiEnvelope<CompanyTeam>> {
  return adaptCreateCompanyTeam(body);
}

export async function renameCompanyTeam(
  id: string,
  body: RenameCompanyTeamInput
): Promise<ApiEnvelope<string | null>> {
  return adaptRenameCompanyTeam(id, body);
}

export async function deactivateCompanyTeam(id: string): Promise<ApiEnvelope<string | null>> {
  return adaptDeactivateCompanyTeam(id);
}

export async function fetchCompanyQueue(
  params?: CompanyQueueParams
): Promise<ApiEnvelope<CompanyQueueList>> {
  return adaptCompanyQueue(params);
}

export async function fetchCompanyAssignments(
  params?: CompanyAssignmentsParams
): Promise<ApiEnvelope<CompanyAssignmentsList>> {
  return adaptCompanyAssignments(params);
}

export async function fetchCompanyAssignmentDetail(
  reportId: string
): Promise<ApiEnvelope<CompanyAssignmentDetail>> {
  return adaptCompanyAssignmentDetail(reportId);
}

export async function assignCompanyTeam(
  reportId: string,
  body: AssignCompanyTeamInput
): Promise<void> {
  return adaptAssignCompanyTeam(reportId, body);
}

const companyService = {
  fetchMyCompany,
  fetchCompanyStaff,
  createCompanyStaff,
  updateCompanyStaffStatus,
  assignCompanyStaffTeam,
  fetchCompanyTeams,
  createCompanyTeam,
  renameCompanyTeam,
  deactivateCompanyTeam,
  fetchCompanyQueue,
  fetchCompanyAssignments,
  fetchCompanyAssignmentDetail,
  assignCompanyTeam,
};

export default companyService;
