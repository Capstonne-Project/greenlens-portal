'use client';

import { lockGamificationUser } from '@/lib/api/services/fetchGamification';
import type { LockGamificationInput } from '@/lib/api/models/gamification';
import { useMutation } from '@tanstack/react-query';

export function useLockGamificationUser() {
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body?: LockGamificationInput }) =>
      lockGamificationUser(userId, body),
  });
}
