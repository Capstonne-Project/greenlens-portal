/** FE models — admin gamification point configs. */

export interface GamificationConfig {
  id: string;
  actionType: string;
  points: number;
  description: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateGamificationConfigInput {
  points: number;
  description: string;
  isActive: boolean;
}
