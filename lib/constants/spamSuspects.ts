/** Defaults khớp Swagger heuristic spam dashboard. */

export const SPAM_SUSPECTS_PAGE_SIZE = 20;

export const SPAM_SUSPECT_DEFAULTS = {
  minReportsPerHour: 5,
  minRejected7Days: 3,
  minAiFlagged: 2,
} as const;
