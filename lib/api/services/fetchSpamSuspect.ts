/**
 * L2 — Admin spam suspects (thin).
 */
import { adaptSpamSuspectsList } from '@/lib/api/adapters/spamSuspects.adapter';
import type { SpamSuspectsList, SpamSuspectsListParams } from '@/lib/api/models/spamSuspect';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  SpamSuspect,
  SpamSuspectsList,
  SpamSuspectsListParams,
  SpamSuspectsPagination,
} from '@/lib/api/models/spamSuspect';

export async function fetchSpamSuspects(
  params?: SpamSuspectsListParams
): Promise<ApiEnvelope<SpamSuspectsList>> {
  return adaptSpamSuspectsList(params);
}

export default {
  fetchSpamSuspects,
};
