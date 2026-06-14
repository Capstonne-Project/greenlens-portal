import type {
  AddTeamMemberBodyDto,
  CreateTeamBodyDto,
  CreateTeamDataDto,
  TeamDetailDto,
  TeamMembershipDto,
  TeamsListDataDto,
} from '@/lib/api/dto/team.dto';
import {
  mapCreateTeamDataDto,
  mapTeamDetailDto,
  mapTeamMembershipDto,
  mapTeamsListDataDto,
} from '@/lib/api/mappers/team.mapper';
import type {
  AddTeamMemberInput,
  CreateTeamInput,
  CreatedTeam,
  TeamDetail,
  TeamMembership,
  TeamsList,
  TeamsListParams,
} from '@/lib/api/models/team';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function buildTeamsQuery(params?: TeamsListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.localOfficeId?.trim()) query.localOfficeId = params.localOfficeId.trim();
  if (params?.teamType?.trim()) query.teamType = params.teamType.trim();
  if (params?.isActive !== undefined) query.isActive = params.isActive;
  if (params?.isAvailable !== undefined) query.isAvailable = params.isAvailable;
  return query;
}

export async function adaptTeamsList(params?: TeamsListParams): Promise<ApiEnvelope<TeamsList>> {
  const res = await apiService.get<ApiEnvelope<TeamsListDataDto>>(
    '/v1/teams',
    buildTeamsQuery(params)
  );
  return mapApiEnvelope(res.data, mapTeamsListDataDto);
}

export async function adaptTeamDetail(id: string): Promise<ApiEnvelope<TeamDetail>> {
  const res = await apiService.get<ApiEnvelope<TeamDetailDto>>(`/v1/teams/${id}`);
  return mapApiEnvelope(res.data, mapTeamDetailDto);
}

export async function adaptCreateTeam(body: CreateTeamInput): Promise<ApiEnvelope<CreatedTeam>> {
  const payload: CreateTeamBodyDto = {
    name: body.name.trim(),
    localOfficeId: body.localOfficeId,
    teamType: body.teamType,
  };
  const res = await apiService.post<ApiEnvelope<CreateTeamDataDto>>('/v1/teams', payload);
  return mapApiEnvelope(res.data, mapCreateTeamDataDto);
}

export async function adaptAddTeamMember(
  teamId: string,
  body: AddTeamMemberInput
): Promise<ApiEnvelope<TeamMembership>> {
  const payload: AddTeamMemberBodyDto = {
    userId: body.userId,
    isLeader: body.isLeader,
  };
  const res = await apiService.post<ApiEnvelope<TeamMembershipDto>>(
    `/v1/teams/${teamId}/members`,
    payload
  );
  return mapApiEnvelope(res.data, mapTeamMembershipDto);
}

/** DELETE /v1/teams/{teamId}/members/{userId} — 200 data: string */
export async function adaptRemoveTeamMember(
  teamId: string,
  userId: string
): Promise<ApiEnvelope<string>> {
  const res = await apiService.delete<ApiEnvelope<string>>(`/v1/teams/${teamId}/members/${userId}`);
  return res.data;
}
