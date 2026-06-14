/** FE models — teams quản lý đội môi trường. */

export type TeamType = 'Cleanup' | 'Inspection' | 'Response' | 'Monitoring' | string;

/** BE map `isAvailable=true` ↔ `currentStatus='Available'`. */
export type TeamCurrentStatus = 'Available' | 'Busy' | string;

export interface TeamListItem {
  id: string;
  name: string;
  teamType: TeamType;
  localOfficeId: string;
  officeName: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  currentStatus: TeamCurrentStatus;
  activeReportId: string | null;
}

/** GET /v1/teams/{id} — thành viên trong team */
export interface TeamMember {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  isLeader: boolean;
  joinedAt: string;
}

/** GET /v1/teams/{id} — 200 data */
export interface TeamDetail {
  id: string;
  name: string;
  teamType: TeamType;
  localOfficeId: string;
  officeName: string;
  isActive: boolean;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TeamsList {
  items: TeamListItem[];
  pagination: TeamPagination;
}

export interface TeamsListParams {
  page?: number;
  pageSize?: number;
  localOfficeId?: string;
  teamType?: string;
  isActive?: boolean;
  /** Filter theo trạng thái hiện tại (Available/Busy). */
  isAvailable?: boolean;
}

/** POST /v1/teams */
export interface CreateTeamInput {
  name: string;
  localOfficeId: string;
  teamType: TeamType;
}

/** POST /v1/teams — 201 data */
export interface CreatedTeam {
  id: string;
  name: string;
  localOfficeId: string;
  teamType: TeamType;
}

/** POST /v1/teams/{teamId}/members */
export interface AddTeamMemberInput {
  userId: string;
  isLeader: boolean;
}

/** POST /v1/teams/{teamId}/members — 201 data */
export interface TeamMembership {
  id: string;
  teamId: string;
  userId: string;
  isLeader: boolean;
}
