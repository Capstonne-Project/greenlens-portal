export const AUDIT_LOGS_PAGE_SIZE = 20;

export const AUDIT_ENTITY_TYPES = [
  'User',
  'Report',
  'PollutionCategory',
  'WasteTag',
  'PenaltyFramework',
  'Team',
  'Office',
  'Department',
  'Company',
] as const;

export const AUDIT_ACTIONS = [
  'Create',
  'Update',
  'Delete',
  'Toggle',
  'Login',
  'Logout',
  'Ban',
  'Unban',
] as const;
