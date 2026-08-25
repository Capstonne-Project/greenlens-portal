/** FE models — teams quản lý đội môi trường. */

export type TeamType = 'Cleanup' | 'Inspection' | 'Response' | 'Monitoring' | string;

/** BE map `isAvailable=true` ↔ `currentStatus='Available'`. */
export type TeamCurrentStatus = 'Available' | 'Busy' | string;

export interface TeamListItem {
  id: string;
  name: string;
  teamType: TeamType;
  localOfficeId: string;
  /** null cho company team (không gắn LocalOffice). */
  officeName: string | null;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  currentStatus: TeamCurrentStatus;
  activeReportId: string | null;
  /** Cleanup teams only — tags đội phụ trách. */
  wasteTags: WasteTagInTeam[];
  /** Số tag khớp với report khi filter theo reportId. */
  wasteTagMatchCount: number;
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
  /** null cho company team (không gắn LocalOffice). */
  officeName: string | null;
  isActive: boolean;
  members: TeamMember[];
  /** Cleanup teams only — tags đội phụ trách. */
  wasteTags: WasteTagInTeam[];
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
  /** Multi-filter OR — trả về đội có bất kỳ tag nào trong danh sách. */
  wasteTagIds?: string[];
  /** Khi có reportId → sort theo wasteTagMatchCount desc (số tag khớp report). */
  reportId?: string;
}

/** wasteTags trả về trong POST /v1/teams response. */
export interface WasteTagInTeam {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl: string | null;
}

/** POST /v1/teams — LEO: office lấy từ auth token.
 *  - Cleanup  → wasteTagIds bắt buộc (≥ 1 phần tử)
 *  - Inspection → wasteTagIds phải rỗng / không gửi
 */
export interface CreateTeamInput {
  name: string;
  teamType: TeamType;
  wasteTagIds?: string[];
}

/** POST /v1/teams — 200 data */
export interface CreatedTeam {
  id: string;
  name: string;
  localOfficeId: string;
  teamType: TeamType;
  wasteTags: WasteTagInTeam[];
}

/** PUT /v1/teams/{id} — [Admin/LEO] cập nhật team.
 *  - `wasteTagIds` optional: có thì replace toàn bộ tag hiện tại.
 *  - Cleanup  → min 1 tag nếu gửi.
 *  - Inspection gửi tag → BE trả 422.
 */
export interface UpdateTeamInput {
  name: string;
  wasteTagIds?: string[];
}

/** PUT /v1/teams/{id} — 200 data (chuỗi id team đã cập nhật). */
export type UpdatedTeam = string;

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
