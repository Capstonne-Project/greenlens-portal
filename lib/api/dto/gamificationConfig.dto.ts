/** DTO khớp Swagger — admin gamification-configs */

export interface GamificationConfigDto {
  id: string;
  actionType: string;
  points: number;
  description?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface GamificationConfigPaginationDto {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

/** GET /v1/admin/gamification-configs — data.items + pagination. */
export interface GamificationConfigListDataDto {
  items?: GamificationConfigDto[];
  pagination?: GamificationConfigPaginationDto;
}

export interface UpdateGamificationConfigBodyDto {
  points: number;
  description: string;
  isActive: boolean;
}
