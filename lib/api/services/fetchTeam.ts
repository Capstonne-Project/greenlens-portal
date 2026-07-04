/**
 * L2 — Teams (đội môi trường).
 */
import { adaptTeamDetail, adaptTeamsList } from '@/lib/api/adapters/teams.adapter';
import type { TeamDetail, TeamsList, TeamsListParams } from '@/lib/api/models/team';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  TeamDetail,
  TeamListItem,
  TeamMember,
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

export default {
  fetchTeams,
  fetchTeamDetail,
};
