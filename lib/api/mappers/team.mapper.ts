import type {
  CreateTeamDataDto,
  TeamDetailDto,
  TeamListItemDto,
  TeamMemberDto,
  TeamMembershipDto,
  TeamsListDataDto,
  WasteTagInTeamDto,
} from '@/lib/api/dto/team.dto';
import type {
  CreatedTeam,
  TeamDetail,
  TeamListItem,
  TeamMember,
  TeamMembership,
  TeamsList,
  WasteTagInTeam,
} from '@/lib/api/models/team';

export function mapTeamListItemDto(dto: TeamListItemDto): TeamListItem {
  return {
    id: dto.id,
    name: dto.name,
    teamType: dto.teamType,
    localOfficeId: dto.localOfficeId,
    officeName: dto.officeName ?? null,
    isActive: dto.isActive,
    memberCount: dto.memberCount,
    createdAt: dto.createdAt,
    currentStatus: dto.currentStatus,
    activeReportId: dto.activeReportId ?? null,
    wasteTags: (dto.wasteTags ?? []).map(mapWasteTagInTeamDto),
    wasteTagMatchCount: dto.wasteTagMatchCount ?? 0,
  };
}

export function mapTeamMemberDto(dto: TeamMemberDto): TeamMember {
  return {
    userId: dto.userId,
    fullName: dto.fullName,
    email: dto.email,
    phoneNumber: dto.phoneNumber ?? null,
    avatarUrl: dto.avatarUrl ?? null,
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
    officeName: dto.officeName ?? null,
    isActive: dto.isActive,
    members: (dto.members ?? []).map(mapTeamMemberDto),
    wasteTags: (dto.wasteTags ?? []).map(mapWasteTagInTeamDto),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapWasteTagInTeamDto(dto: WasteTagInTeamDto): WasteTagInTeam {
  return {
    tagId: dto.tagId,
    code: dto.code,
    nameVi: dto.nameVi,
    nameEn: dto.nameEn,
    iconUrl: dto.iconUrl ?? null,
  };
}

export function mapCreateTeamDataDto(dto: CreateTeamDataDto): CreatedTeam {
  return {
    id: dto.id,
    name: dto.name,
    localOfficeId: dto.localOfficeId,
    teamType: dto.teamType,
    wasteTags: (dto.wasteTags ?? []).map(mapWasteTagInTeamDto),
  };
}

export function mapTeamMembershipDto(dto: TeamMembershipDto): TeamMembership {
  return {
    id: dto.id,
    teamId: dto.teamId,
    userId: dto.userId,
    isLeader: dto.isLeader,
  };
}

export function mapTeamsListDataDto(data: TeamsListDataDto): TeamsList {
  return {
    items: data.items.map(mapTeamListItemDto),
    pagination: {
      page: data.pagination.page,
      pageSize: data.pagination.pageSize,
      totalItems: data.pagination.totalItems,
      totalPages: data.pagination.totalPages,
      hasNext: data.pagination.hasNext,
      hasPrev: data.pagination.hasPrev,
    },
  };
}
