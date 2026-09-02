import type { Geometry } from 'geojson';

export interface CitizenMapProvince {
  code: string;
  name: string;
  geometry: Geometry | null;
}

/** 1 = None (không báo cáo active) … 5 = Critical. BE tính sẵn, FE chỉ hiển thị. */
export type CitizenMapWardRiskLevel = 1 | 2 | 3 | 4 | 5;

export interface CitizenMapWard {
  code: string;
  name: string;
  unitAbbreviation: string | null;
  geometry: Geometry | null;
  activeReportCount: number;
  level: CitizenMapWardRiskLevel;
  colorHex: string;
}

export interface CitizenMapWards {
  provinceCode: string;
  provinceName: string | null;
  items: CitizenMapWard[];
}

export type CitizenMapSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type CitizenMapReportStatus =
  | 'Submitted'
  | 'Verified'
  | 'InProgress'
  | 'Resolved'
  | 'Reopened'
  | 'Closed'
  | 'Rejected'
  | 'Duplicate';

export interface CitizenMapWardReportPin {
  id: string;
  code: string;
  latitude: number;
  longitude: number;
  severity: CitizenMapSeverity;
  categoryCode: string;
  title: string;
  categoryIconUrl: string | null;
  description: string | null;
  address: string | null;
  reporterCount: number;
  imageUrl: string | null;
  status: CitizenMapReportStatus;
  createdAt: string;
}

export interface CitizenMapWardReports {
  wardCode: string;
  wardName: string | null;
  items: CitizenMapWardReportPin[];
}
