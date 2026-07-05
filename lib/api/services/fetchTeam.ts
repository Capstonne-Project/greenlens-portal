/**
 * L2 — Teams (đội môi trường).
 */
import {
  adaptAddTeamMember,
  adaptCreateTeam,
  adaptRemoveTeamMember,
  adaptTeamDetail,
  adaptTeamsList,
} from '@/lib/api/adapters/teams.adapter';
import type {
  AddTeamMemberInput,
  CreateTeamInput,
  CreatedTeam,
  TeamDetail,
  TeamMembership,
  TeamsList,
  TeamsListParams,
} from '@/lib/api/models/team';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AddTeamMemberInput,
  CreateTeamInput,
  CreatedTeam,
  TeamCurrentStatus,
  TeamDetail,
  TeamListItem,
  TeamMember,
  TeamMembership,
  TeamPagination,
  TeamsList,
  TeamsListParams,
  TeamType,
} from '@/lib/api/models/team';

export async function fetchTeams(params?: TeamsListParams): Promise<ApiEnvelope<TeamsList>> {
  return adaptTeamsList(params);
}

export async function fetchTeamDetail(id: string): Promise<ApiEnvelope<TeamDetail>> {
  return adaptTeamDetail(id);
}

export async function createTeam(body: CreateTeamInput): Promise<ApiEnvelope<CreatedTeam>> {
  return adaptCreateTeam(body);
}

export async function addTeamMember(
  teamId: string,
  body: AddTeamMemberInput
): Promise<ApiEnvelope<TeamMembership>> {
  return adaptAddTeamMember(teamId, body);
}

export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<ApiEnvelope<string>> {
  return adaptRemoveTeamMember(teamId, userId);
}

const teamService = {
  fetchTeams,
  fetchTeamDetail,
  createTeam,
  addTeamMember,
  removeTeamMember,
};

export default teamService;
