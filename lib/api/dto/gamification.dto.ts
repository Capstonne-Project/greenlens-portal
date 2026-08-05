export interface LockGamificationBodyDto {
  reason?: string;
}

export interface LockGamificationResultDto {
  userId?: string;
  isLocked?: boolean;
  message?: string;
}

export interface TestNotificationTemplateBodyDto {
  recipientEmail?: string;
  email?: string;
  userId?: string;
}

export interface TestNotificationTemplateResultDto {
  message?: string;
  sent?: boolean;
}
