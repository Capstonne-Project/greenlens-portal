export interface Province {
  code: string;
  name: string;
  boundaryUrl: string | null;
}

export interface Ward {
  code: string;
  name: string;
  unitAbbreviation: string | null;
  boundaryUrl: string | null;
}

/**
 * GET /v1/catalog/wards/{wardCode}/boundary — AllowAnonymous, tra boundary theo `wardCode` đã biết trước.
 * KHÔNG dùng cho LEO map (LEO không biết `wardCode` của mình trước) — xem `LeoWardBoundary` ở
 * `lib/api/models/office.ts`, lấy qua GET /v1/offices/my/ward-boundary.
 */
export interface WardBoundary {
  wardCode: string;
  boundaryUrl: string | null;
}
