/** FE models — teams quản lý đội môi trường. */

export type TeamType = 'Cleanup' | 'Inspection' | 'Response' | 'Monitoring' | string;

export interface TeamListItem {
  id: string;
  name: string;
  teamType: TeamType;
  localOfficeId: string;
  officeName: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
}

export interface TeamMember {
  userId: string;
  fullName: string;
  email: string;
  isLeader: boolean;
  joinedAt: string;
}

export interface TeamDetail extends Omit<TeamListItem, 'memberCount'> {
  members: TeamMember[];
  updatedAt: string | null;
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
}
