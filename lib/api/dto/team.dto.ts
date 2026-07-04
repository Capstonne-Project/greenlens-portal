export interface TeamListItemDto {
  id: string;
  name: string;
  teamType: string;
  localOfficeId: string;
  officeName: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
}

export interface TeamMemberDto {
  userId: string;
  fullName: string;
  email: string;
  isLeader: boolean;
  joinedAt: string;
}

export interface TeamDetailDto {
  id: string;
  name: string;
  teamType: string;
  localOfficeId: string;
  officeName: string;
  isActive: boolean;
  members: TeamMemberDto[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface TeamsListDataDto {
  items: TeamListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}
