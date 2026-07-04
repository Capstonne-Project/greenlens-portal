'use client';

import { rejectReport, verifyReport } from '@/lib/api/services/fetchReport';
import type { RejectReportInput, VerifyReportInput } from '@/lib/api/models/reportAction';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/** Query keys cho luồng officer (LEO/DEO) — không dùng trong admin. */
export const reportKeys = {
  all: ['reports'] as const,
  detail: (id: string) => [...reportKeys.all, 'detail', id] as const,
};

export function useVerifyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: VerifyReportInput }) =>
      verifyReport(id, body ?? {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useRejectReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RejectReportInput }) => rejectReport(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}
