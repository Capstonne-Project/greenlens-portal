import type { TeamDetailDto, TeamsListDataDto } from '@/lib/api/dto/team.dto';
import { mapTeamDetailDto, mapTeamsListDataDto } from '@/lib/api/mappers/team.mapper';
import type { TeamDetail, TeamsList, TeamsListParams } from '@/lib/api/models/team';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function buildTeamsQuery(params?: TeamsListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.localOfficeId?.trim()) query.localOfficeId = params.localOfficeId.trim();
  if (params?.teamType?.trim()) query.teamType = params.teamType.trim();
  if (params?.isActive !== undefined) query.isActive = params.isActive;
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
