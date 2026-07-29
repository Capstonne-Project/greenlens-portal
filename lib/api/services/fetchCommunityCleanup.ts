/**
 * L2 — Community Cleanup (chương trình dọn cộng đồng).
 */
import { adaptCreateCommunityCleanup } from '@/lib/api/adapters/communityCleanup.adapter';
import type {
  CommunityCleanupEventDetail,
  CreateCommunityCleanupInput,
} from '@/lib/api/models/communityCleanup';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  CommunityCleanupEventDetail,
  CommunityCleanupLeader,
  CommunityCleanupMediaSummary,
  CommunityCleanupStatus,
  CreateCommunityCleanupInput,
} from '@/lib/api/models/communityCleanup';

/** POST /v1/reports/{reportId}/community-cleanups — [LEO] mở chương trình dọn cộng đồng. */
export async function createCommunityCleanup(
  reportId: string,
  body: CreateCommunityCleanupInput
): Promise<ApiEnvelope<CommunityCleanupEventDetail>> {
  return adaptCreateCommunityCleanup(reportId, body);
}

const communityCleanupService = {
  createCommunityCleanup,
};

export default communityCleanupService;
