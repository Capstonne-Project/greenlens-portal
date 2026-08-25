import type {
  AddTeamMemberBodyDto,
  CreateTeamBodyDto,
  CreateTeamDataDto,
  TeamDetailDto,
  TeamMembershipDto,
  TeamsListDataDto,
  UpdateTeamBodyDto,
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
  UpdateTeamInput,
  UpdatedTeam,
} from '@/lib/api/models/team';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function buildTeamsQuery(params?: TeamsListParams): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.localOfficeId?.trim()) query.localOfficeId = params.localOfficeId.trim();
  if (params?.teamType?.trim()) query.teamType = params.teamType.trim();
  if (params?.isActive !== undefined) query.isActive = params.isActive;
  if (params?.isAvailable !== undefined) query.isAvailable = params.isAvailable;
  if (params?.wasteTagIds?.length) query.wasteTagIds = params.wasteTagIds;
  if (params?.reportId?.trim()) query.reportId = params.reportId.trim();
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
    teamType: body.teamType,
    ...(body.teamType === 'Cleanup' && body.wasteTagIds?.length
      ? { wasteTagIds: body.wasteTagIds }
      : {}),
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

/** PUT /v1/teams/{id} — cập nhật tên + wasteTagIds. */
export async function adaptUpdateTeam(
  id: string,
  body: UpdateTeamInput
): Promise<ApiEnvelope<UpdatedTeam>> {
  const payload: UpdateTeamBodyDto = {
    name: body.name.trim(),
    ...(body.wasteTagIds ? { wasteTagIds: body.wasteTagIds } : {}),
  };
  const res = await apiService.put<ApiEnvelope<UpdatedTeam>>(`/v1/teams/${id}`, payload);
  return res.data;
}

/** DELETE /v1/teams/{teamId}/members/{userId} — 200 data: string */
export async function adaptRemoveTeamMember(
  teamId: string,
  userId: string
): Promise<ApiEnvelope<string>> {
  const res = await apiService.delete<ApiEnvelope<string>>(`/v1/teams/${teamId}/members/${userId}`);
  return res.data;
}
