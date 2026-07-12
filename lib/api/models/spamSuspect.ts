/** FE models — admin spam suspects dashboard. */

export interface SpamSuspect {
  userId: string;
  fullName: string;
  email: string;
  isBanned: boolean;
  reportsLastHour: number;
  rejectedLast7Days: number;
  aiFlaggedCount: number;
  suspectReasons: string;
}

export interface SpamSuspectsPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SpamSuspectsList {
  items: SpamSuspect[];
  pagination: SpamSuspectsPagination;
}

export interface SpamSuspectsListParams {
  page?: number;
  pageSize?: number;
  minReportsPerHour?: number;
  minRejected7Days?: number;
  minAiFlagged?: number;
}
