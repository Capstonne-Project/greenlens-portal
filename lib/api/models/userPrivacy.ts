/** POST /v1/users/me/consent */
export type UserConsentInput = {
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
  acceptDataProcessing: boolean;
  consentVersion?: string;
};

export type UserConsentResult = {
  message: string;
  consentedAt: string;
};

export type UserDataExportFile = {
  blob: Blob;
  fileName: string;
};
