/** Defaults heuristic spam dashboard (minRejected7Days, minAiFlagged). */

export const SPAM_SUSPECTS_PAGE_SIZE = 20;

/** Khi minReportsPerHour = undefined → BE lấy submit_max_per_hour từ system settings. */
export const SPAM_SUSPECT_DEFAULTS = {
  minRejected7Days: 3,
  minAiFlagged: 2,
} as const;

/** Fallback UI khi hiển thị hint — seed submit_max_per_hour mặc định. */
export const SPAM_SUSPECT_SYSTEM_DEFAULT_MIN_REPORTS_PER_HOUR = 5;
