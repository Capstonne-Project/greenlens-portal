import {
  adaptAssignOfficeOfficer,
  adaptCreateOffice,
  adaptFetchLeoMyReports,
  adaptFetchLeoWardBoundary,
  adaptFetchOfficeStaff,
  adaptLookupOfficeStaff,
  adaptOfficeDetail,
  adaptOfficesList,
  adaptRecruitOfficeStaff,
  adaptUpdateOffice,
} from '@/lib/api/adapters/offices.adapter';
import type {
  AssignOfficeOfficerInput,
  CreateOfficeInput,
  LeoMyReportsData,
  LeoMyReportsParams,
  LeoWardBoundary,
  Office,
  OfficeDetail,
  OfficesList,
  OfficesListParams,
  OfficeStaffList,
  OfficeStaffListParams,
  OfficeStaffLookupResult,
  RecruitOfficeStaffInput,
  RecruitOfficeStaffResult,
  UpdateOfficeInput,
} from '@/lib/api/models/office';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AssignOfficeOfficerInput,
  CreateOfficeInput,
  LeoMyReportAssignment,
  LeoMyReportItem,
  LeoMyReportsData,
  LeoMyReportsParams,
  LeoMyReportsSeverity,
  LeoMyReportsSortBy,
  LeoMyReportsStatus,
  LeoWardBoundary,
  Office,
  OfficeDetail,
  OfficeListItem,
  OfficesList,
  OfficesListParams,
  OfficeStaffList,
  OfficeStaffListParams,
  OfficeStaffLookupResult,
  RecruitOfficeStaffInput,
  RecruitOfficeStaffResult,
  UpdateOfficeInput,
} from '@/lib/api/models/office';

export async function fetchOffices(params?: OfficesListParams): Promise<ApiEnvelope<OfficesList>> {
  return adaptOfficesList(params);
}

export async function fetchOfficeDetail(id: string): Promise<ApiEnvelope<OfficeDetail>> {
  return adaptOfficeDetail(id);
}

export async function createOffice(body: CreateOfficeInput): Promise<ApiEnvelope<Office>> {
  return adaptCreateOffice(body);
}

export async function updateOffice(id: string, body: UpdateOfficeInput): Promise<void> {
  return adaptUpdateOffice(id, body);
}

export async function assignOfficeOfficer(
  id: string,
  body: AssignOfficeOfficerInput
): Promise<void> {
  return adaptAssignOfficeOfficer(id, body);
}

/** GET /v1/offices/my/reports — LEO theo dõi báo cáo trong LocalOffice. */
export async function fetchLeoMyReports(
  params?: LeoMyReportsParams
): Promise<ApiEnvelope<LeoMyReportsData>> {
  return adaptFetchLeoMyReports(params);
}

/** GET /v1/offices/my/staff — danh sách Cleaner/Inspector trong LocalOffice. */
export async function fetchOfficeStaff(
  params?: OfficeStaffListParams
): Promise<ApiEnvelope<OfficeStaffList>> {
  return adaptFetchOfficeStaff(params);
}

/** GET /v1/offices/my/staff/lookup — tra cứu Citizen theo email (exact). */
export async function lookupOfficeStaff(
  email: string
): Promise<ApiEnvelope<OfficeStaffLookupResult>> {
  return adaptLookupOfficeStaff(email);
}

/** POST /v1/offices/my/staff — LEO tuyển Citizen vào LocalOffice + đội. */
export async function recruitOfficeStaff(
  body: RecruitOfficeStaffInput
): Promise<ApiEnvelope<RecruitOfficeStaffResult>> {
  return adaptRecruitOfficeStaff(body);
}

/** GET /v1/offices/my/ward-boundary — ranh giới phường LEO đang quản lý (suy từ JWT). */
export async function fetchLeoWardBoundary(): Promise<ApiEnvelope<LeoWardBoundary>> {
  return adaptFetchLeoWardBoundary();
}

export default {
  fetchOffices,
  fetchOfficeDetail,
  createOffice,
  updateOffice,
  assignOfficeOfficer,
  fetchLeoMyReports,
  fetchOfficeStaff,
  lookupOfficeStaff,
  recruitOfficeStaff,
  fetchLeoWardBoundary,
};
