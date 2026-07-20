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

export interface UpdateGamificationConfigBodyDto {
  points: number;
  description: string;
  isActive: boolean;
}
