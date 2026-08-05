import type { UserConsentBodyDto, UserConsentDataDto } from '@/lib/api/dto/userPrivacy.dto';
import type { UserConsentInput, UserConsentResult } from '@/lib/api/models/userPrivacy';
import apiService from '@/lib/api/core';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

function mapConsentResult(dto: UserConsentDataDto): UserConsentResult {
  return {
    message: dto.message,
    consentedAt: dto.consentedAt,
  };
}

/** POST /v1/users/me/consent — BR-DAT-005 */
export async function adaptSubmitUserConsent(body: UserConsentInput): Promise<UserConsentResult> {
  const payload: UserConsentBodyDto = {
    acceptTerms: body.acceptTerms,
    acceptPrivacyPolicy: body.acceptPrivacyPolicy,
    acceptDataProcessing: body.acceptDataProcessing,
    ...(body.consentVersion?.trim() ? { consentVersion: body.consentVersion.trim() } : {}),
  };

  const res = await apiService.post<ApiEnvelope<UserConsentDataDto>>(
    '/v1/users/me/consent',
    payload
  );

  return mapConsentResult(res.data.data);
}

/** GET /v1/users/me/data-export — tải blob (JSON/ZIP tùy BE). */
export async function adaptExportMyData(): Promise<{ blob: Blob; fileName: string }> {
  const res = await apiService.get<Blob>('/v1/users/me/data-export', undefined, {
    responseType: 'blob',
  });

  const disposition = res.headers['content-disposition'] as string | undefined;
  let fileName = 'greenlens-data-export.json';
  const match = disposition?.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/i);
  if (match?.[1]) {
    fileName = decodeURIComponent(match[1].replace(/"/g, '').trim());
  }

  return { blob: res.data, fileName };
}
