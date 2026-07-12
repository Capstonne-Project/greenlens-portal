/**
 * L2 — Admin gamification configs (thin).
 */
import {
  adaptGamificationConfigsList,
  adaptUpdateGamificationConfig,
} from '@/lib/api/adapters/gamificationConfigs.adapter';
import type {
  GamificationConfig,
  UpdateGamificationConfigInput,
} from '@/lib/api/models/gamificationConfig';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  GamificationConfig,
  UpdateGamificationConfigInput,
} from '@/lib/api/models/gamificationConfig';

export async function fetchGamificationConfigs(): Promise<ApiEnvelope<GamificationConfig[]>> {
  return adaptGamificationConfigsList();
}

export async function updateGamificationConfig(
  id: string,
  body: UpdateGamificationConfigInput
): Promise<ApiEnvelope<null>> {
  return adaptUpdateGamificationConfig(id, body);
}

export default {
  fetchGamificationConfigs,
  updateGamificationConfig,
};
