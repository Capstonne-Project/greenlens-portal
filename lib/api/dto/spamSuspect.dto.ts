/** DTO khớp Swagger — GET /v1/admin/spam-suspects */

export interface SpamSuspectItemDto {
  userId: string;
  fullName?: string | null;
  email?: string | null;
  isBanned?: boolean;
  reportsLastHour?: number;
  rejectedLast7Days?: number;
  aiFlaggedCount?: number;
  suspectReasons?: string | null;
}

export interface SpamSuspectsListDataDto {
  items: SpamSuspectItemDto[];
  totalCount: number;
}

export interface SpamSuspectsListParamsDto {
  page?: number;
  pageSize?: number;
  minReportsPerHour?: number;
  minRejected7Days?: number;
  minAiFlagged?: number;
}
