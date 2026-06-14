/** Khớp BE `/v1/teams` — 2026-06-02. */

/** POST /v1/teams */
export interface CreateTeamBodyDto {
  name: string;
  localOfficeId: string;
  teamType: string;
}

/** POST /v1/teams — 201 data */
export interface CreateTeamDataDto {
  id: string;
  name: string;
  localOfficeId: string;
  teamType: string;
}

/** POST /v1/teams/{teamId}/members */
export interface AddTeamMemberBodyDto {
  userId: string;
  isLeader: boolean;
}

/** POST /v1/teams/{teamId}/members — 201 data */
export interface TeamMembershipDto {
  id: string;
  teamId: string;
  userId: string;
  isLeader: boolean;
}

export interface TeamListItemDto {
  id: string;
  name: string;
  teamType: string;
  localOfficeId: string;
  officeName: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  /** Trạng thái tức thời (Available/Busy). */
  currentStatus: string;
  /** ReportId đang xử lý nếu team Busy. */
  activeReportId: string | null;
}

/** GET /v1/teams/{id} — item trong `members[]` */
export interface TeamMemberDto {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  isLeader: boolean;
  joinedAt: string;
}

/** GET /v1/teams/{id} — 200 data */
export interface TeamDetailDto {
  id: string;
  name: string;
  teamType: string;
  localOfficeId: string;
  officeName: string;
  isActive: boolean;
  members: TeamMemberDto[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamsPaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TeamsListDataDto {
  items: TeamListItemDto[];
  pagination: TeamsPaginationDto;
}
