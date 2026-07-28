'use client';

import { officerKeys } from '@/hooks/useOfficer';
import { leoOfficesKeys } from '@/hooks/useLeoOffices';
import { createCommunityCleanup } from '@/lib/api/services/fetchCommunityCleanup';
import type { CreateCommunityCleanupInput } from '@/lib/api/models/communityCleanup';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/** POST /v1/reports/{reportId}/community-cleanups — [LEO] mở chương trình dọn cộng đồng. */
export function useCreateCommunityCleanup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: CreateCommunityCleanupInput }) =>
      createCommunityCleanup(reportId, body),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
    },
  });
}
