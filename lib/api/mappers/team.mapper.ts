import type {
  TeamDetailDto,
  TeamListItemDto,
  TeamMemberDto,
  TeamsListDataDto,
} from '@/lib/api/dto/team.dto';
import type { TeamDetail, TeamListItem, TeamMember, TeamsList } from '@/lib/api/models/team';

export function mapTeamListItemDto(dto: TeamListItemDto): TeamListItem {
  return {
    id: dto.id,
    name: dto.name,
    teamType: dto.teamType,
    localOfficeId: dto.localOfficeId,
    officeName: dto.officeName,
    isActive: dto.isActive,
    memberCount: dto.memberCount,
    createdAt: dto.createdAt,
  };
}

export function mapTeamMemberDto(dto: TeamMemberDto): TeamMember {
  return {
    userId: dto.userId,
    fullName: dto.fullName,
    email: dto.email,
    isLeader: dto.isLeader,
    joinedAt: dto.joinedAt,
  };
}

export function mapTeamDetailDto(dto: TeamDetailDto): TeamDetail {
  return {
    id: dto.id,
    name: dto.name,
    teamType: dto.teamType,
    localOfficeId: dto.localOfficeId,
    officeName: dto.officeName,
    isActive: dto.isActive,
    members: (dto.members ?? []).map(mapTeamMemberDto),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? null,
  };
}

export function mapTeamsListDataDto(data: TeamsListDataDto): TeamsList {
  const totalPages = Math.max(1, Math.ceil(data.totalCount / Math.max(data.pageSize, 1)));

  return {
    items: data.items.map(mapTeamListItemDto),
    pagination: {
      page: data.page,
      pageSize: data.pageSize,
      totalItems: data.totalCount,
      totalPages,
      hasNext: data.page < totalPages,
      hasPrev: data.page > 1,
    },
  };
}
