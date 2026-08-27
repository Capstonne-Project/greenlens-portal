/**
 * Server-only public preview — used by generateMetadata / RSC landing.
 * Native fetch (no axios, no Authorization) so Facebook crawler and ISR work.
 */
import type { CommunityCleanupPublicPreviewDto } from '@/lib/api/dto/communityCleanup.dto';
import { getApiBaseUrl } from '@/lib/api/getApiBaseUrl';
import { mapCommunityCleanupPublicPreviewDto } from '@/lib/api/mappers/communityCleanup.mapper';
import type { CommunityCleanupPublicPreview } from '@/lib/api/models/communityCleanup';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export async function fetchPublicCommunityCleanupPreview(
  eventId: string
): Promise<CommunityCleanupPublicPreview | null> {
  const id = eventId.trim();
  if (!id) return null;

  const base = getApiBaseUrl();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/v1/public/community-cleanups/${encodeURIComponent(id)}`, {
      next: { revalidate: 60 },
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'vi-VN',
      },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as ApiEnvelope<CommunityCleanupPublicPreviewDto | null>;
    if (json.data == null) return null;
    return mapCommunityCleanupPublicPreviewDto(json.data);
  } catch {
    return null;
  }
}
