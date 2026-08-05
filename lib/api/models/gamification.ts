export interface LockGamificationInput {
  reason?: string;
}

export interface LockGamificationResult {
  userId: string;
  isLocked: boolean;
  message: string;
}

export interface TestNotificationTemplateInput {
  recipientEmail: string;
}

export interface TestNotificationTemplateResult {
  message: string;
  sent: boolean;
}
