'use client';

import {
  exportMyData,
  submitUserConsent,
  type UserConsentInput,
} from '@/lib/api/services/fetchUser';
import { downloadBlob } from '@/utils/downloadBlob';
import { useMutation } from '@tanstack/react-query';

/** POST /v1/users/me/consent — BR-DAT-005 */
export function useSubmitUserConsent() {
  return useMutation({
    mutationFn: (body: UserConsentInput) => submitUserConsent(body),
  });
}

/** GET /v1/users/me/data-export */
export function useExportMyData() {
  return useMutation({
    mutationFn: async () => {
      const file = await exportMyData();
      downloadBlob(file.blob, file.fileName);
      return file;
    },
  });
}
