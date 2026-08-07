/** POST /v1/users/me/consent — BR-DAT-005 */
export interface UserConsentBodyDto {
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
  acceptDataProcessing: boolean;
  consentVersion?: string;
}

export interface UserConsentDataDto {
  message: string;
  consentedAt: string;
}

/** GET /v1/users/me/data-export — metadata envelope (khi BE trả JSON thay vì blob). */
export interface UserDataExportMetaDto {
  downloadUrl?: string;
  fileName?: string;
  expiresAt?: string;
}
